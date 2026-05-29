import { ActionDefinition } from '../types';
import { spawnSync } from 'child_process';
import { logger } from '../logging';

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

    logger.debug(`Running syncDaily: xcopy from "${src}" to "${dst}"`);
    const result = spawnSync('xcopy', ['/s', '/y', `"${src}"`, `"${dst}"`], {
      stdio: 'inherit',
      shell: true,
    });

    if (result.error) {
      logger.error('Failed to run xcopy for syncDaily', result.error);
      throw result.error;
    }

    if (result.status !== 0) {
      logger.error(`xcopy for syncDaily exited with code ${result.status}`);
      throw new Error(`xcopy exited with code ${result.status}`);
    }

    logger.debug('syncDaily completed, waiting 5 seconds...');
    // 5-second pause equivalent (non-blocking)
    await new Promise<void>((resolve) => setTimeout(resolve, 5000));
    logger.debug('syncDaily wait finished');
  },
};

export default syncDaily;
