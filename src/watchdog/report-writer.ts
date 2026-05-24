import fs from 'fs';
import { RunResult } from './action-runner.js';

const REPORT_PATH = 'C:\\Users\\Or Assayag\\Desktop\\ACTIONS_REPORT.txt';

function formatTimestamp(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
}

export function appendWatchdogReport(results: RunResult[]): void {
  if (!fs.existsSync(REPORT_PATH)) {
    return; // Don't create if it doesn't exist, though it should
  }

  let raw = fs.readFileSync(REPORT_PATH, 'utf8');

  // Remove any previous watchdog block before appending a fresh one
  const existingBlockIndex = raw.indexOf('\nNode-Windows Watchdog:');
  if (existingBlockIndex !== -1) {
    raw = raw.slice(0, existingBlockIndex);
  }

  const timestamp = formatTimestamp(new Date());
  const failed = results.filter((r) => !r.success);

  let block: string;

  if (failed.length === 0) {
    block = `\nNode-Windows Watchdog:\n${timestamp} - All run as expected!\n`;
  } else {
    const lines = failed
      .map((r) => {
        const status =
          r.error && r.error.includes('ACTIONS_REPORT.txt')
            ? 'Failed to sync to report!'
            : 'Failed to run!';
        return `${r.name.padEnd(25)}| ${status}`;
      })
      .join('\n');
    block = `\nNode-Windows Watchdog:\n${timestamp}\n${lines}\n`;
  }

  fs.writeFileSync(REPORT_PATH, raw + block, 'utf8');
}
