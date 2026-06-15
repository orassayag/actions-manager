import { ActionDefinition } from '../index';
import { spawn } from 'child_process';

const globalPackageUpdater: ActionDefinition = {
  name: 'globalPackageUpdater',
  label: 'Global Package Updater',
  schedulePeriod: undefined, // manual only
  pauseAfterRun: true, // was "pause" in the original bat
  run: async () => {
    await new Promise<void>((resolve, reject) => {
      const child = spawn('pnpm', ['run', 'start'], {
        cwd: 'C:\\Or\\web\\projects\\global-package-updater',
        stdio: 'inherit',
        shell: true,
      });

      child.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Process exited with code ${code}`));
        }
      });

      child.on('error', (err) => {
        reject(err);
      });
    });
  },
};

export default globalPackageUpdater;
