import { ActionDefinition } from '../types';
import { spawnAction } from '../utils/spawnAction';

const globalPackageUpdater: ActionDefinition = {
  name: 'globalPackageUpdater',
  label: 'Global Package Updater',
  schedulePeriod: undefined, // manual only
  pauseAfterRun: true, // was "pause" in the original bat
  run: () => {
    spawnAction('globalPackageUpdater', 'pnpm', ['run', 'start'], {
      cwd: 'C:\\Or\\web\\projects\\global-package-updater',
    });
  },
};

export default globalPackageUpdater;
