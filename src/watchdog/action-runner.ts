import { ActionDefinition } from '../types.js';
import syncDaily from '../actions/syncDaily.js';
import autoPackagesUpdater from '../actions/syncAutoPackagesUpdater.js';
import contactsScanMaintainer from '../actions/contactsScanMaintainer.js';
import backupsManager from '../actions/backupsManager.js';
import dailyEventsBot from '../actions/dailyEventsBot.js';
import reposScanReporter from '../actions/reposScanReporter.js';
import seriesAndMovies from '../actions/seriesAndMovies.js';
import globalPackageUpdater from '../actions/globalPackageUpdater.js';

// Keys must match exactly what appears in the Action column of ACTIONS_REPORT.txt
export const ACTION_MAP: Record<string, ActionDefinition> = {
  'Sync Daily Documents': syncDaily,
  'Auto Packages Updater': autoPackagesUpdater,
  'Contacts Scan Maintainer': contactsScanMaintainer,
  'Backups Manager': backupsManager,
  'Daily Events Bot': dailyEventsBot,
  'Repos Scan Reporter': reposScanReporter,
  'Series & Movies': seriesAndMovies,
  'Global Package Updater': globalPackageUpdater,
};

export interface RunResult {
  name: string;
  success: boolean;
  error?: string;
}

export function isSchedulerAction(name: string): boolean {
  const action = ACTION_MAP[name];
  return !!(action && (action.taskName || action.schedulePeriod));
}

export async function runAction(name: string): Promise<RunResult> {
  const action = ACTION_MAP[name];
  if (!action) {
    return { name, success: false, error: 'No ActionDefinition found' };
  }

  try {
    await action.run();
    return { name, success: true };
  } catch (err) {
    return { name, success: false, error: (err as Error).message };
  }
}
