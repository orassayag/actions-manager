import { ActionDefinition } from '../types';
import { spawnAction } from '../utils/spawnAction';

const syncAutoPackagesUpdater: ActionDefinition = {
  name: 'syncAutoPackagesUpdater',
  label: 'Auto Packages Updater',
  taskName: 'syncAutoPackagesUpdater',
  schedulePeriod: 'Daily',
  pauseAfterRun: false,
  run: () => {
    spawnAction('syncAutoPackagesUpdater', 'pnpm', ['run', 'sync'], {
      cwd: 'C:\\Or\\web\\projects\\auto-packages-updater-ts',
    });
  },
};

export default syncAutoPackagesUpdater;
