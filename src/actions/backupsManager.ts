import { ActionDefinition } from '../types';
import { spawn } from 'child_process';
import { logger } from '../logging';

const backupsManager: ActionDefinition = {
  name: 'backupsManager',
  label: 'Backups Manager',
  taskName: 'backupsManager',
  schedulePeriod: 'Daily',
  pauseAfterRun: false,
  run: async () => {
    const cwd = 'C:\\Or\\web\\projects\\backups-manager';
    logger.debug(`Spawning backups-manager in ${cwd}`);
    await new Promise<void>((resolve, reject) => {
      const child = spawn('pnpm', ['run', 'sync'], {
        cwd,
        stdio: 'inherit',
        shell: true,
      });

      child.on('exit', (code) => {
        if (code === 0) {
          logger.debug('backups-manager completed successfully');
          resolve();
        } else {
          logger.error(`backups-manager exited with code ${code}`);
          reject(new Error(`Process exited with code ${code}`));
        }
      });

      child.on('error', (err) => {
        logger.error('Failed to spawn backups-manager', err);
        reject(err);
      });
    });
  },
};

export default backupsManager;
