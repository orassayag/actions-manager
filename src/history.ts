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
function rebuildReport(
  actions: ActionDefinition[],
  history: ActionHistoryMap,
): void {
  ensureDataDir();

  // Column widths
  const COL1 = 32; // Action label
  const COL2 = 28; // Run type + period

  const header =
    pad('Action', COL1) + '| ' + pad('Run Type', COL2) + '| ' + 'Last Run';
  const separator = '-'.repeat(COL1) + '+' + '-'.repeat(COL2 + 2);

  const rows = actions.map((action) => {
    const h = history[action.name];

    let runTypeLabel: string;
    let lastRun: string;

    if (!h) {
      runTypeLabel = '-';
      lastRun = 'Never';
    } else {
      runTypeLabel =
        h.runType === 'Task Scheduler' && h.period
          ? `Task Scheduler (${h.period})`
          : h.runType;

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
      pad(action.label, COL1) + '| ' + pad(runTypeLabel, COL2) + '| ' + lastRun
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
 * Records a run in history.json and rebuilds ACTIONS_REPORT.txt.
 */
export function recordRun(
  action: ActionDefinition,
  runType: RunType,
  allActions: ActionDefinition[],
  status: RunStatus = 'Finished',
): void {
  const history = loadHistory();

  history[action.name] = {
    lastRunAt: nowISO(),
    runType,
    status,
    period: runType === 'Task Scheduler' ? action.schedulePeriod : undefined,
  };

  saveHistory(history);
  rebuildReport(allActions, history);
}
