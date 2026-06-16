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
import { getTasksWithTriggers, formatTriggers } from './scheduler';

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

  // 1. Gather row data for sorting
  const rowData = actions.map((action) => {
    const h = history[action.name];

    let runTypeLabel = h ? h.runType : '-';
    let frequency = 'Never';

    // Get frequency from Task Scheduler if taskName is provided
    if (action.taskName) {
      const task = scheduledTasks.find((t) => t.TaskName === action.taskName);
      if (task && task.Triggers) {
        const triggers = Array.isArray(task.Triggers)
          ? task.Triggers
          : [task.Triggers];
        frequency = formatTriggers(triggers);
      }
    } else if (action.schedulePeriod) {
      // Fallback to schedulePeriod if taskName is not found or not provided
      frequency = action.schedulePeriod;
    }

    let lastRunDisplay: string;
    let lastRunTimestamp: number;

    if (!h) {
      lastRunDisplay = 'Never';
      lastRunTimestamp = 0; // Epoch for "Never" run
    } else {
      // Re-format stored ISO → Jerusalem display format
      const d = new Date(h.lastRunAt);
      lastRunTimestamp = d.getTime();
      lastRunDisplay = d
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

    return {
      label: action.label,
      runTypeLabel,
      frequency,
      lastRunDisplay,
      lastRunTimestamp,
    };
  });

  // 2. Sort row data
  // Order: Daily -> Weekly -> Others -> Never
  // Each category: From early to late on "Last Run" (chronological)
  const getFrequencyPriority = (freq: string): number => {
    const f = freq.toLowerCase();
    if (f.startsWith('daily')) return 1;
    if (f.startsWith('weekly')) return 2;
    if (f === 'never') return 4;
    return 3; // Monthly, Manual, Startup, etc.
  };

  rowData.sort((a, b) => {
    const prioA = getFrequencyPriority(a.frequency);
    const prioB = getFrequencyPriority(b.frequency);

    if (prioA !== prioB) {
      return prioA - prioB;
    }

    // Within same category, sort by timestamp (early to late)
    return a.lastRunTimestamp - b.lastRunTimestamp;
  });

  // 3. Format rows
  const COL1 = 24; // Action label
  const COL2 = 14; // Last Run Type
  const COL3 = 17; // Frequency

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

  const rows = rowData.map((data) => {
    return (
      pad(data.label, COL1) +
      ' | ' +
      pad(data.runTypeLabel, COL2) +
      ' | ' +
      pad(data.frequency, COL3) +
      ' | ' +
      data.lastRunDisplay
    );
  });

  const updatedAt = `Last Updated: ${getJerusalemTimestamp()}`;

  // 4. Generate #FOR-BOT# section
  const botRows = [...rowData]
    .sort((a, b) => b.lastRunTimestamp - a.lastRunTimestamp)
    .map((d) => `${d.label} - ${d.lastRunDisplay}`);

  const botSection = ['', '#FOR-BOT#', ...botRows];

  const lines = [updatedAt, '', header, separator, ...rows, ...botSection, ''];

  try {
    fs.writeFileSync(REPORT_FILE, lines.join('\n'), 'utf-8');
  } catch (err: any) {
    if (err.code === 'EPERM' || err.code === 'EBUSY') {
      console.warn(
        `\n⚠️  Warning: Could not update report file at ${REPORT_FILE}. It might be open in another program. Execution will continue.`
      );
    } else {
      console.error(`\n❌  Error writing report file: ${err.message}`);
    }
  }
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
