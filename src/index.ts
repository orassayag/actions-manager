import actions from './registry';
import { runAction } from './runner';
import { ActionDefinition } from './types';
import { selectWithEscape } from './prompt';
import { refreshReport } from './history';
import { logger } from './logging';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findAction(name: string): ActionDefinition | undefined {
  return actions.find((a) => a.name.toLowerCase() === name.toLowerCase());
}

function printUsage(): void {
  console.log('\nUsage:');
  console.log('  run.bat <actionName>   — run action via Task Scheduler');
  console.log('  run.bat                — interactive dropdown (manual)\n');
  console.log('Available actions:');
  actions.forEach((a) => console.log(`  ${a.name.padEnd(30)} ${a.label}`));
  console.log();
}

// ─── Task Scheduler mode ──────────────────────────────────────────────────────

async function runScheduled(actionName: string): Promise<void> {
  logger.info(`Running in scheduled mode for action: ${actionName}`);
  const action = findAction(actionName);
  if (!action) {
    logger.error(`Unknown action requested in scheduled mode: ${actionName}`);
    console.error(`\n❌  Unknown action: "${actionName}"`);
    printUsage();
    process.exit(1);
  }
  await runAction(action, 'Task Scheduler', actions);
}

// ─── Manual / interactive mode ────────────────────────────────────────────────

async function runInteractive(): Promise<void> {
  logger.info('Running in interactive mode');
  const choices = actions.map((a) => ({
    name: a.label,
    value: a.name,
  }));

  const { escaped, value: selectedAction } = await selectWithEscape({
    message: 'Select an action to run:',
    choices,
    pageSize: 15,
  });

  if (escaped || !selectedAction) {
    logger.info('User escaped interactive mode');
    console.log('\nBye! 👋');
    process.exit(0);
  }

  logger.info(`Action selected interactively: ${selectedAction}`);
  const action = findAction(selectedAction);
  if (!action) {
    logger.error(`Action not found after selection: ${selectedAction}`);
    console.error('Action not found — this should never happen.');
    process.exit(1);
  }

  await runAction(action, 'Manual', actions);
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export async function main(args: string[]): Promise<void> {
  const arg = args[0];
  logger.info('App started', { args });

  // Always refresh report on startup to sync with Task Scheduler triggers
  try {
    logger.debug('Refreshing report on startup');
    await refreshReport(actions);
  } catch (err) {
    // If report refresh fails (e.g. file lock), we log and continue
    // The individual actions will also handle this via runAction -> recordRun
    logger.warn('Initial report refresh failed', { error: err });
    console.warn('⚠️  Warning: Initial report refresh failed. Continuing...');
  }

  if (arg === '--help' || arg === '-h') {
    logger.info('Help requested');
    printUsage();
    return;
  }

  if (arg) {
    // Called by Task Scheduler with an action name argument
    await runScheduled(arg);
  } else {
    // Called manually — show interactive picker
    await runInteractive();
  }
}

/* istanbul ignore next */
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  main(process.argv.slice(2)).catch((err) => {
    logger.error('Unhandled error in main', err);
    console.error(err);
    process.exit(1);
  });
}
