import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  ActionHistoryMap,
  ActionDefinition,
  RunType,
  RunStatus,
} from './types';
import { settings } from './settings';
import { getTasksWithTriggers, formatTrigger } from './scheduler';

// ─── Paths ────────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const REPORT_FILE = settings.reportPath;

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// ─── Jerusalem time helpers ───────────────────────────────────────────────────

/**
 * Returns current date/time formatted as dd/MM/yyyy HH:mm:ss in Jerusalem time.
 */
export function getJerusalemTimestamp(): string {
  const now = new Date();
  return now
    .toLocaleString('en-GB', {
      timeZone: 'Asia/Jerusalem',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    .replace(',', ''); // remove comma between date and time
}

/**
 * Returns ISO string of current time (for storage in JSON).
 */
function nowISO(): string {
  return new Date().toISOString();
}

// ─── History JSON ─────────────────────────────────────────────────────────────

export function loadHistory(): ActionHistoryMap {
  ensureDataDir();
  if (!fs.existsSync(HISTORY_FILE)) return {};
  try {
    const raw = fs.readFileSync(HISTORY_FILE, 'utf-8');
    return JSON.parse(raw) as ActionHistoryMap;
  } catch {
    return {};
  }
}

function saveHistory(history: ActionHistoryMap): void {
  ensureDataDir();
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
}

// ─── Report TXT ───────────────────────────────────────────────────────────────

/**
 * Rebuilds ACTIONS_REPORT.txt from the current history + action definitions.
 * Actions with no history yet are listed with "Never" as the last run time.
 */
async function rebuildReport(
  actions: ActionDefinition[],
  history: ActionHistoryMap
): Promise<void> {
  ensureDataDir();

  const scheduledTasks = await getTasksWithTriggers();

  // Column widths
  const COL1 = 24; // Action label
  const COL2 = 14; // Last Run Type
  const COL3 = 16; // Frequency

  const header =
    pad('Action', COL1) +
    ' | ' +
    pad('Last Run Type', COL2) +
    ' | ' +
    pad('Frequency', COL3) +
    ' | ' +
    'Last Run';
  const separator =
    '-'.repeat(COL1 + 1) +
    '+' +
    '-'.repeat(COL2 + 2) +
    '+' +
    '-'.repeat(COL3 + 2) +
    '+';

  const rows = actions.map((action) => {
    const h = history[action.name];

    let runTypeLabel = h ? h.runType : '-';
    let lastRun: string;

    // Get frequency from Task Scheduler if taskName is provided
    let frequency = 'Never';
    if (action.taskName) {
      const task = scheduledTasks.find((t) => t.TaskName === action.taskName);
      if (task && task.Triggers) {
        const triggers = Array.isArray(task.Triggers)
          ? task.Triggers
          : [task.Triggers];
        const activeTrigger = triggers.find((t) => t.Enabled);
        if (activeTrigger) {
          frequency = formatTrigger(activeTrigger);
        }
      }
    } else if (action.schedulePeriod) {
      // Fallback to schedulePeriod if taskName is not found or not provided
      frequency = action.schedulePeriod;
    }

    if (!h) {
      lastRun = 'Never';
    } else {
      // Re-format stored ISO → Jerusalem display format
      const d = new Date(h.lastRunAt);
      lastRun = d
        .toLocaleString('en-GB', {
          timeZone: 'Asia/Jerusalem',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
        .replace(',', '');
    }

    return (
      pad(action.label, COL1) +
      ' | ' +
      pad(runTypeLabel, COL2) +
      ' | ' +
      pad(frequency, COL3) +
      ' | ' +
      lastRun
    );
  });

  const updatedAt = `Last Updated: ${getJerusalemTimestamp()}`;
  const lines = [updatedAt, '', header, separator, ...rows, ''];
  fs.writeFileSync(REPORT_FILE, lines.join('\n'), 'utf-8');
}

function pad(str: string, width: number): string {
  return str.length >= width
    ? str.substring(0, width)
    : str + ' '.repeat(width - str.length);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Rebuilds the report without recording a new run.
 */
export async function refreshReport(
  actions: ActionDefinition[]
): Promise<void> {
  const history = loadHistory();
  await rebuildReport(actions, history);
}

/**
 * Records a run in history.json and rebuilds ACTIONS_REPORT.txt.
 */
export async function recordRun(
  action: ActionDefinition,
  runType: RunType,
  allActions: ActionDefinition[],
  status: RunStatus = 'Finished'
): Promise<void> {
  const history = loadHistory();

  history[action.name] = {
    lastRunAt: nowISO(),
    runType,
    status,
    period: runType === 'Task Scheduler' ? action.schedulePeriod : undefined,
  };

  saveHistory(history);
  await rebuildReport(allActions, history);
}
