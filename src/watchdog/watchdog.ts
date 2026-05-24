import cron from 'node-cron';
import { runWatchdogCheck } from './core.js';

console.log(
  `[${new Date().toISOString()}] Watchdog service started. Waiting for 08:00...`
);

// Run every day at 08:00
cron.schedule('0 8 * * *', async () => {
  await runWatchdogCheck();
});
