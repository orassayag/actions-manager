import { ActionDefinition } from './types';

// ─── Import all actions ───────────────────────────────────────────────────────
import {
  dailyEventsBot,
  syncDaily,
  syncAutoPackagesUpdater,
  syncRepos,
  seriesAndMovies,
  reposScanReporter,
  contactsScanMaintainer,
  globalPackageUpdater,
  backupsManager,
  nodeWatchdog,
  logsCleaner,
} from './actions/index';

// ─── Registry ─────────────────────────────────────────────────────────────────
// Order here controls the dropdown order when running manually.
// ─── HOW TO ADD A NEW ACTION ─────────────────────────────────────────────────
// 1. Create src/actions/myNewAction.ts  (use any existing action as a template)
// 2. Import it above
// 3. Add it to the array below
// 4. In Task Scheduler, point the task to run.bat with arg: myNewAction
// See README.md for the full guide.
// ─────────────────────────────────────────────────────────────────────────────

const actions: ActionDefinition[] = [
  dailyEventsBot,
  syncDaily,
  syncAutoPackagesUpdater,
  syncRepos,
  seriesAndMovies,
  reposScanReporter,
  contactsScanMaintainer,
  globalPackageUpdater,
  backupsManager,
  nodeWatchdog,
  logsCleaner,
];

export default actions;
