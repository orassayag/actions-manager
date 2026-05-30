import { ActionDefinition } from '../types';
import { spawnAction } from '../utils/spawnAction';
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

    spawnAction('syncDaily', 'xcopy', ['/s', '/y', `"${src}"`, `"${dst}"`], {
      cwd: process.cwd(),
    });

    logger.debug('syncDaily completed, waiting 5 seconds...');
    // 5-second pause equivalent (non-blocking)
    await new Promise<void>((resolve) => setTimeout(resolve, 5000));
    logger.debug('syncDaily wait finished');
  },
};

export default syncDaily;
