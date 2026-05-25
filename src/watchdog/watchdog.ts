import cron from 'node-cron';
import { runWatchdogCheck } from './core.js';

console.log(
  `[${new Date().toISOString()}] Watchdog service started. Waiting for 08:00...`
);

// Run every day at 08:00
cron.schedule(
  '0 8 * * *',
  async () => {
    console.log(
      `[${new Date().toISOString()}] Scheduled 08:00 check triggered.`
    );
    try {
      await runWatchdogCheck();
    } catch (err) {
      console.error(
        `[${new Date().toISOString()}] Watchdog check failed:`,
        (err as Error).message
      );
    }
  },
  {
    timezone: 'Asia/Jerusalem',
  }
);

// Add a heartbeat log every hour to verify service is alive and check timezone
cron.schedule('0 * * * *', () => {
  console.log(
    `[${new Date().toISOString()}] Watchdog heartbeat. Local time: ${new Date().toLocaleString('en-IL', { timeZone: 'Asia/Jerusalem' })}`
  );
});
