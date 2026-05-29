import cron from 'node-cron';
import { runWatchdogCheck } from './core.js';
import { Logger } from '../logging/index.js';

const logger = new Logger('Watchdog');

logger.info('Watchdog service started. Waiting for 08:00...');

// Run every day at 08:00
cron.schedule(
  '0 8 * * *',
  async () => {
    logger.info('Scheduled 08:00 check triggered.');
    try {
      await runWatchdogCheck();
    } catch (err) {
      logger.error('Watchdog check failed', err);
    }
  },
  {
    timezone: 'Asia/Jerusalem',
  }
);

// Add a heartbeat log every hour to verify service is alive and check timezone
cron.schedule('0 * * * *', () => {
  const localTime = new Date().toLocaleString('en-IL', {
    timeZone: 'Asia/Jerusalem',
  });
  logger.debug(`Watchdog heartbeat. Local time: ${localTime}`);
});
