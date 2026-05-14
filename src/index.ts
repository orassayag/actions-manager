import actions from './registry';
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

async function runScheduled(actionName: string): Promise<void> {
  const action = findAction(actionName);
  if (!action) {
    console.error(`\n❌  Unknown action: "${actionName}"`);
    printUsage();
    process.exit(1);
  }
  await runAction(action, 'Task Scheduler', actions);
}

// ─── Manual / interactive mode ────────────────────────────────────────────────

async function runInteractive(): Promise<void> {
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
    process.exit(0);
  }

  const action = findAction(selectedAction);
  if (!action) {
    console.error('Action not found — this should never happen.');
    process.exit(1);
  }

  await runAction(action, 'Manual', actions);
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export async function main(args: string[]): Promise<void> {
  const arg = args[0];

  // Always refresh report on startup to sync with Task Scheduler triggers
  await refreshReport(actions);

  if (arg === '--help' || arg === '-h') {
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
    console.error(err);
    process.exit(1);
  });
}
