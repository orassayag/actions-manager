// Core exports
export * from './history';
export * from './runner';
export * from './prompt';
export * from './settings';
export * from './scheduler';
export * from './types';

// Export actions as named and default
import actionsRegistry from './registry';
export const actions = actionsRegistry;
export default actionsRegistry;
import { runAction } from './runner';
import { ActionDefinition } from './types';
import { selectWithEscape } from './prompt';
import { refreshReport } from './history';

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

async function runScheduled(actionName: string): Promise<number> {
  const action = findAction(actionName);
  if (!action) {
    console.error(`\n❌  Unknown action: "${actionName}"`);
    printUsage();
    return 1;
  }
  await runAction(action, 'Task Scheduler', actions);
  return 0;
}

// ─── Manual / interactive mode ────────────────────────────────────────────────

async function runInteractive(): Promise<number> {
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
    console.log('\nBye! 👋');
    return 0;
  }

  const action = findAction(selectedAction);
  if (!action) {
    console.error('Action not found — this should never happen.');
    return 1;
  }

  await runAction(action, 'Manual', actions);
  return 0;
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export async function main(args: string[]): Promise<number> {
  const arg = args[0];

  // Always refresh report on startup to sync with Task Scheduler triggers
  try {
    await refreshReport(actions);
  } catch (_err) {
    // If report refresh fails (e.g. file lock), we log and continue
    // The individual actions will also handle this via runAction → recordRun
    console.warn('⚠️  Warning: Initial report refresh failed. Continuing...');
  }

  if (arg === '--help' || arg === '-h') {
    printUsage();
    return 0;
  }

  if (arg) {
    // Called by Task Scheduler with an action name argument
    return await runScheduled(arg);
  } else {
    // Called manually — show interactive picker
    return await runInteractive();
  }
}

/* istanbul ignore next */
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  main(process.argv.slice(2))
    .then((code) => {
      process.exit(code);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
