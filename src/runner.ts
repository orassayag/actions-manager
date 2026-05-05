import { ActionDefinition, RunType } from './types';
import { recordRun } from './history';
import * as readline from 'readline';

/**
 * Runs an action, records its history, and optionally pauses (keeps window open).
 */
export async function runAction(
  action: ActionDefinition,
  runType: RunType,
  allActions: ActionDefinition[],
): Promise<void> {
  console.log(`\n▶  Running: ${action.label}  [${runType}]`);
  console.log('─'.repeat(50));

  // Record START of run
  recordRun(action, runType, allActions, 'Running');

  try {
    await action.run();
    console.log(`\n✅  Finished: ${action.label}`);
    // Record SUCCESSFUL end of run
    recordRun(action, runType, allActions, 'Finished');
  } catch (err: any) {
    // Record ERROR end of run
    recordRun(action, runType, allActions, 'Error');
    if (err instanceof Error && err.message.includes('exited with code')) {
      // Silence expected process exit errors since child process already printed them
    } else {
      console.error(`\n❌  Error in "${action.label}":`, err);
    }
  }

  if (action.pauseAfterRun && runType === 'Manual') {
    await pressAnyKeyToContinue();
  }
}

function pressAnyKeyToContinue(): Promise<void> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('\nPress Enter to close...', () => {
      rl.close();
      resolve();
    });
  });
}
