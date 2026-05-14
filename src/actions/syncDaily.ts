import { ActionDefinition } from '../types';
import { spawnSync } from 'child_process';

const syncDaily: ActionDefinition = {
  name: 'syncDaily',
  label: 'Sync Daily Documents',
  taskName: 'syncDaily',
  schedulePeriod: 'Daily',
  pauseAfterRun: false,
  run: async () => {
    const src = 'c:\\Users\\Or Assayag\\Dropbox\\or-life\\documents\\daily';
    const dst =
      'c:\\Users\\Or Assayag\\Dropbox\\or-life\\documents\\daily-backup';

    const result = spawnSync('xcopy', ['/s', '/y', `"${src}"`, `"${dst}"`], {
      stdio: 'inherit',
      shell: true,
    });

    if (result.status !== 0) {
      throw new Error(`xcopy exited with code ${result.status}`);
    }

    // 5-second pause equivalent (non-blocking)
    await new Promise<void>((resolve) => setTimeout(resolve, 5000));
  },
};

export default syncDaily;
