import { ActionDefinition } from './types';

// ─── Import all actions ───────────────────────────────────────────────────────
import dailyEventsBot from './actions/dailyEventsBot';
import syncDaily from './actions/syncDaily';
import syncAutoPackagesUpdater from './actions/syncAutoPackagesUpdater';
import seriesAndMovies from './actions/seriesAndMovies';
import reposScanReporter from './actions/reposScanReporter';
import contactsScanMaintainer from './actions/contactsScanMaintainer';
import globalPackageUpdater from './actions/globalPackageUpdater';
import backupsManager from './actions/backupsManager';

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
  seriesAndMovies,
  reposScanReporter,
  contactsScanMaintainer,
  globalPackageUpdater,
  backupsManager,
];

export default actions;
