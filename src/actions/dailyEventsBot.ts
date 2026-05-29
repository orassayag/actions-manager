import { ActionDefinition } from '../types';
import { spawnSync } from 'child_process';
import { logger } from '../logging';

const dailyEventsBot: ActionDefinition = {
  name: 'dailyEventsBot',
  label: 'Daily Events Bot',
  taskName: 'dailyEventsBot',
  schedulePeriod: 'Daily',
  pauseAfterRun: false,
  run: async () => {
    const cwd = 'C:\\Or\\web\\projects\\daily-events-bot';
    logger.debug(`Spawning daily-events-bot in ${cwd}`);
    await Promise.resolve();
    const result = spawnSync('pnpm', ['run', 'start'], {
      cwd,
      stdio: 'inherit',
      shell: true,
    });

    if (result.error) {
      logger.error('Failed to spawn daily-events-bot', result.error);
      throw result.error;
    }

    if (result.status !== 0) {
      logger.error(`daily-events-bot exited with code ${result.status}`);
      throw new Error(`Process exited with code ${result.status}`);
    }
    logger.debug('daily-events-bot completed successfully');
  },
};

export default dailyEventsBot;
