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

/**
 * Executes the core watchdog check logic.
 * This is the logic that normally runs at 08:00.
 */
export async function runWatchdogCheck(): Promise<void> {
  console.log(`[${new Date().toISOString()}] Watchdog check started.`);

  const allActions = Object.values(ACTION_MAP);

  let actions;
  try {
    actions = readTaskSchedulerActions();
  } catch (err) {
    console.error(
      `[${new Date().toISOString()}] Failed to read ACTIONS_REPORT.txt:`,
      (err as Error).message
    );
    return;
  }

  const results: RunResult[] = [];

  for (const action of actions) {
    // Only check actions that are defined as Task Scheduler actions in the registry
    if (!isSchedulerAction(action.name)) {
      console.log(
        `[${new Date().toISOString()}] Skipping manual-only action: "${action.name}"`
      );
      continue;
    }

    // 1. Check if the date in ACTIONS_REPORT.txt is already missed
    const isMissedInActionsReport = wasMissed(action.frequency, action.lastRun);

    // 2. Try to get a more reliable date from dedicated reports
    const verified = getVerifiedLastRun(action.name, action.lastRun);

    // 3. Check if the verified date is also missed
    const isMissedInVerifiedReport = wasMissed(action.frequency, verified.date);

    console.log(`[${new Date().toISOString()}] Checking "${action.name}"`);
    console.log(
      `  - ACTIONS_REPORT.txt status: ${isMissedInActionsReport ? 'MISSED' : 'OK'}`
    );
    if (verified.source === 'dedicated-report') {
      console.log(
        `  - Dedicated report status: ${isMissedInVerifiedReport ? 'MISSED' : 'OK'}`
      );
    }

    // Recovery Logic:
    // If the dedicated report is MISSED, we MUST attempt recovery.
    // If ACTIONS_REPORT is MISSED but Dedicated is OK, it's a sync failure (we don't re-run, just report it).

    if (isMissedInVerifiedReport) {
      console.log(
        `[${new Date().toISOString()}] MISSED (verified): ${action.name} — attempting recovery...`
      );

      const actionDef = ACTION_MAP[action.name];
      const result = await runAction(action.name);

      // Update history and ACTIONS_REPORT.txt with the new run
      if (result.success && actionDef) {
        await recordRun(actionDef, 'Task Scheduler', allActions, 'Finished');
      } else if (actionDef) {
        await recordRun(actionDef, 'Task Scheduler', allActions, 'Error');
      }

      results.push(result);
      console.log(
        `[${new Date().toISOString()}] ${result.success ? '✅' : '❌'} ${action.name} ${
          result.error ? `- Error: ${result.error}` : ''
        }`
      );
    } else if (isMissedInActionsReport) {
      console.log(
        `[${new Date().toISOString()}] SYNC FAILURE: ${action.name} (Dedicated report is OK)`
      );
      results.push({
        name: action.name,
        success: false,
        error: 'Missed in ACTIONS_REPORT.txt (but OK in dedicated)',
      });
    } else {
      console.log(`[${new Date().toISOString()}] OK: ${action.name}`);
      results.push({ name: action.name, success: true });
    }
  }

  try {
    appendWatchdogReport(results);
    console.log(`[${new Date().toISOString()}] Report updated.`);
  } catch (err) {
    console.error(
      `[${new Date().toISOString()}] Failed to write report:`,
      (err as Error).message
    );
  }
}
