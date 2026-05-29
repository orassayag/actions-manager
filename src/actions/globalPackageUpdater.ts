import { ActionDefinition } from '../types';
import { spawn } from 'child_process';
import { logger } from '../logging';

const globalPackageUpdater: ActionDefinition = {
  name: 'globalPackageUpdater',
  label: 'Global Package Updater',
  schedulePeriod: undefined, // manual only
  pauseAfterRun: true, // was "pause" in the original bat
  run: async () => {
    const cwd = 'C:\\Or\\web\\projects\\global-package-updater';
    logger.debug(`Spawning globalPackageUpdater in ${cwd}`);
    await new Promise<void>((resolve, reject) => {
      const child = spawn('pnpm', ['run', 'start'], {
        cwd,
        stdio: 'inherit',
        shell: true,
      });

      child.on('exit', (code) => {
        if (code === 0) {
          logger.debug('globalPackageUpdater completed successfully');
          resolve();
        } else {
          logger.error(`globalPackageUpdater exited with code ${code}`);
          reject(new Error(`Process exited with code ${code}`));
        }
      });

      child.on('error', (err) => {
        logger.error('Failed to spawn globalPackageUpdater', err);
        reject(err);
      });
    });
  },
};

export default globalPackageUpdater;
