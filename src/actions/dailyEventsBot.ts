import { ActionDefinition } from '../types';
import { spawnAction } from '../utils/spawnAction';

const dailyEventsBot: ActionDefinition = {
  name: 'dailyEventsBot',
  label: 'Daily Events Bot',
  taskName: 'dailyEventsBot',
  schedulePeriod: 'Daily',
  pauseAfterRun: false,
  run: () => {
    spawnAction('daily-events-bot', 'pnpm', ['run', 'start'], {
      cwd: 'C:\\Or\\web\\projects\\daily-events-bot',
    });
  },
};

export default dailyEventsBot;
