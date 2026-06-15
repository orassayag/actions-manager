import { ActionDefinition } from '../index';
import { spawnSync } from 'child_process';

const dailyEventsBot: ActionDefinition = {
  name: 'dailyEventsBot',
  label: 'Daily Events Bot',
  taskName: 'dailyEventsBot',
  schedulePeriod: 'Daily',
  pauseAfterRun: false,
  run: async () => {
    await Promise.resolve();
    const result = spawnSync('pnpm', ['run', 'start'], {
      cwd: 'C:\\Or\\web\\projects\\daily-events-bot',
      stdio: 'inherit',
      shell: true,
    });

    if (result.error) {
      throw result.error;
    }

    if (result.status !== 0) {
      throw new Error(`Process exited with code ${result.status}`);
    }
  },
};

export default dailyEventsBot;
