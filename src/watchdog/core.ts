import { readTaskSchedulerActions } from './status-reader.js';
import { getVerifiedLastRun } from './report-verifier.js';
import { wasMissed } from './schedule-checker.js';
import {
  runAction,
  RunResult,
  isSchedulerAction,
  ACTION_MAP,
} from './action-runner.js';
import { appendWatchdogReport } from './report-writer.js';
import { recordRun } from '../history.js';
import { Logger } from '../logging/index.js';

const logger = new Logger('WatchdogCore');

/**
 * Executes the core watchdog check logic.
 * This is the logic that normally runs at 08:00.
 */
export async function runWatchdogCheck(): Promise<void> {
  logger.info('Watchdog check started');

  const allActions = Object.values(ACTION_MAP);

  let actions;
  try {
    actions = readTaskSchedulerActions();
  } catch (err) {
    logger.error('Failed to read ACTIONS_REPORT.txt', err);
    return;
  }

  const results: RunResult[] = [];

  for (const action of actions) {
    // Only check actions that are defined as Task Scheduler actions in the registry
    if (!isSchedulerAction(action.name)) {
      logger.debug(`Skipping manual-only action: "${action.name}"`);
      continue;
    }

    // 1. Check if the date in ACTIONS_REPORT.txt is already missed
    const isMissedInActionsReport = wasMissed(action.frequency, action.lastRun);

    // 2. Try to get a more reliable date from dedicated reports
    const verified = getVerifiedLastRun(action.name, action.lastRun);

    // 3. Check if the verified date is also missed
    const isMissedInVerifiedReport = wasMissed(action.frequency, verified.date);

    logger.debug(`Checking "${action.name}"`, {
      actionsReportStatus: isMissedInActionsReport ? 'MISSED' : 'OK',
      dedicatedReportStatus:
        verified.source === 'dedicated-report'
          ? isMissedInVerifiedReport
            ? 'MISSED'
            : 'OK'
          : 'N/A',
    });

    // Recovery Logic:
    // If the dedicated report is MISSED, we MUST attempt recovery.
    // If ACTIONS_REPORT is MISSED but Dedicated is OK, it's a sync failure (we don't re-run, just report it).

    if (isMissedInVerifiedReport) {
      logger.warn(`MISSED (verified): ${action.name} — attempting recovery...`);

      const actionDef = ACTION_MAP[action.name];
      const result = await runAction(action.name);

      // Update history and ACTIONS_REPORT.txt with the new run
      if (result.success && actionDef) {
        await recordRun(actionDef, 'Task Scheduler', allActions, 'Finished');
      } else if (actionDef) {
        await recordRun(actionDef, 'Task Scheduler', allActions, 'Error');
      }

      results.push(result);
      if (result.success) {
        logger.info(`Recovery successful for ${action.name}`);
      } else {
        logger.error(`Recovery failed for ${action.name}`, result.error);
      }
    } else if (isMissedInActionsReport) {
      logger.warn(`SYNC FAILURE: ${action.name} (Dedicated report is OK)`);
      results.push({
        name: action.name,
        success: false,
        error: 'Missed in ACTIONS_REPORT.txt (but OK in dedicated)',
      });
    } else {
      logger.debug(`OK: ${action.name}`);
      results.push({ name: action.name, success: true });
    }
  }

  try {
    appendWatchdogReport(results);
    logger.info('Watchdog report updated');
  } catch (err) {
    logger.error('Failed to write watchdog report', err);
  }
}
