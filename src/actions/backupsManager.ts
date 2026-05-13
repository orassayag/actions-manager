import { ActionDefinition } from '../types';
import { spawn } from 'child_process';

const backupsManager: ActionDefinition = {
  name: 'backupsManager',
  label: 'Backups Manager',
  schedulePeriod: 'Daily',
  pauseAfterRun: false,
  run: async () => {
    await new Promise<void>((resolve, reject) => {
      const child = spawn('pnpm', ['run', 'sync'], {
        cwd: 'C:\\Or\\web\\projects\\backups-manager',
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

export default backupsManager;
