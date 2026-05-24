import { runWatchdogCheck } from './core.js';

/**
 * Manual trigger script to simulate the 08:00 watchdog execution.
 * Run this via: pnpm watchdog:run
 */
async function trigger(): Promise<void> {
  console.log('--- Manual Watchdog Trigger ---');
  await runWatchdogCheck();
  console.log('--- Check Complete ---');
}

trigger().catch((err) => {
  console.error('Manual trigger failed:', err);
  process.exit(1);
});
