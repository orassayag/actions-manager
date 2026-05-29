import { ActionDefinition } from '../types';
import { spawnSync } from 'child_process';
import { logger } from '../logging';

const syncAutoPackagesUpdater: ActionDefinition = {
  name: 'syncAutoPackagesUpdater',
  label: 'Auto Packages Updater',
  taskName: 'syncAutoPackagesUpdater',
  schedulePeriod: 'Daily',
  pauseAfterRun: false,
  run: async () => {
    const cwd = 'C:\\Or\\web\\projects\\auto-packages-updater-ts';
    logger.debug(`Spawning syncAutoPackagesUpdater in ${cwd}`);
    await Promise.resolve();
    const result = spawnSync('pnpm', ['run', 'sync'], {
      cwd,
      stdio: 'inherit',
      shell: true,
    });

    if (result.error) {
      logger.error('Failed to spawn syncAutoPackagesUpdater', result.error);
      throw result.error;
    }

    if (result.status !== 0) {
      logger.error(`syncAutoPackagesUpdater exited with code ${result.status}`);
      throw new Error(`Process exited with code ${result.status}`);
    }
    logger.debug('syncAutoPackagesUpdater completed successfully');
  },
};

export default syncAutoPackagesUpdater;
