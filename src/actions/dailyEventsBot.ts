import { ActionDefinition } from '../types';
import { spawnSync } from 'child_process';

const dailyEventsBot: ActionDefinition = {
  name: 'dailyEventsBot',
  label: 'Daily Events Bot',
  schedulePeriod: 'Daily',
  pauseAfterRun: false,
  run: async () => {
    const result = spawnSync('pnpm', ['run', 'start'], {
      cwd: 'C:\\Or\\web\\projects\\daily-events-bot',
      stdio: 'inherit',
      shell: true,
    });
    if (result.status !== 0) {
      throw new Error(`Process exited with code ${result.status}`);
    }
  },
};

export default dailyEventsBot;
