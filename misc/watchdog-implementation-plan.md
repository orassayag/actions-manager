# Actions Manager — Watchdog Service Implementation Plan

## Overview

Add a **node-windows watchdog service** that runs alongside Windows Task Scheduler.
Task Scheduler remains the **primary executor**. The watchdog runs **once at 08:00**,
checks which Task Scheduler actions ran successfully overnight, and appends a summary
to the bottom of `ACTIONS_REPORT.txt`.

---

## Architecture

```
Windows Boot
    │
    ├── Task Scheduler (primary)
    │       Runs each action at its scheduled time overnight
    │       Writes last-run info to: ACTIONS_REPORT.txt
    │
    └── Watchdog Service (fallback) ← YOU ARE BUILDING THIS
            Runs 24/7 as a Windows Service (but only acts at 08:00)
            Reads ACTIONS_REPORT.txt at 08:00 (primary source)
            For actions with their own report file → reads that file instead (more reliable)
            Checks which Task Scheduler actions missed their window
            Re-runs missed actions
            Appends a Watchdog summary block to ACTIONS_REPORT.txt
```

---

## Report File

**Path:** `C:\Users\Or Assayag\Desktop\ACTIONS_REPORT.txt`

The watchdog reads this file at 08:00 and appends one of two outcomes to the bottom.

### Success output (all ran)

```
Node-Windows Watchdog:
24/05/2026 09:05:57 - All run as expected!
```

### Failure output (some missed)

```
Node-Windows Watchdog:
24/05/2026 09:05:57
Sync Daily Documents     | Failed to run!
Auto Packages Updater    | Failed to run!
```

> The watchdog appends to the file — it does NOT rewrite the existing table.

---

## Actions to Monitor

Only actions with `Last Run Type = Task Scheduler` are checked.
`Manual` and `Never` actions are always ignored.

| Action                   | Frequency        | Expected by 08:00?         | Verification Source              |
| ------------------------ | ---------------- | -------------------------- | -------------------------------- |
| Sync Daily Documents     | Daily 22:00      | ✅ Yes                     | `ACTIONS_REPORT.txt`             |
| Auto Packages Updater    | Daily 23:00      | ✅ Yes                     | `PROJECTS_UPDATES_REPORT.txt` ⭐ |
| Contacts Scan Maintainer | Daily 02:30      | ✅ Yes                     | `SCAN_CONTACTS_REPORT.txt` ⭐    |
| Backups Manager          | Daily 04:00      | ✅ Yes                     | `BACKUP_REPORT.txt` ⭐           |
| Daily Events Bot         | Daily 07:00      | ✅ Yes (if Task Scheduler) | `ACTIONS_REPORT.txt`             |
| Repos Scan Reporter      | Weekly 02:00 Sat | ✅ Yes (Saturdays only)    | `SCAN_REPOS_REPORT.txt` ⭐       |
| Series & Movies          | Never            | ❌ Skip                    | —                                |
| Global Package Updater   | Never            | ❌ Skip                    | —                                |

⭐ = has a dedicated report file that takes priority over `ACTIONS_REPORT.txt`

---

## File Structure

```
actions-manager/
├── src/
│   ├── actions/                    ← existing actions (unchanged)
│   ├── watchdog/
│   │   ├── watchdog.ts             ← main entry point (runs 24/7, fires at 08:00)
│   │   ├── status-reader.ts        ← parses ACTIONS_REPORT.txt
│   │   ├── report-verifier.ts      ← reads individual action report files (more reliable) ← NEW
│   │   ├── schedule-checker.ts     ← decides if a task was missed
│   │   ├── action-runner.ts        ← re-runs missed actions
│   │   └── report-writer.ts        ← appends watchdog summary to ACTIONS_REPORT.txt
│   └── types.ts                    ← existing (unchanged)
├── install-watchdog-service.ts     ← run ONCE to register Windows Service
├── uninstall-watchdog-service.ts
└── package.json
```

---

## Step-by-Step Implementation

### Step 1 — Install Dependencies

```bash
pnpm add node-windows node-cron
pnpm add -D @types/node-cron
```

> `node-windows` has no type definitions — add a local shim if TypeScript complains:
>
> ```typescript
> // src/watchdog/node-windows.d.ts
> declare module 'node-windows' {
>   export class Service {
>     constructor(config: Record<string, unknown>);
>     on(event: string, cb: (...args: unknown[]) => void): void;
>     install(): void;
>     uninstall(): void;
>     start(): void;
>   }
> }
> ```

---

### Step 2 — `src/watchdog/status-reader.ts`

Parses `ACTIONS_REPORT.txt` and returns only Task Scheduler actions.

```typescript
import fs from 'fs';

export interface ActionStatus {
  name: string;
  lastRunType: string; // 'Task Scheduler' | 'Manual'
  frequency: string; // e.g. 'Daily 22:00', 'Weekly 02:00 Sat', 'Never'
  lastRun: Date;
}

const REPORT_PATH = 'C:\\Users\\Or Assayag\\Desktop\\ACTIONS_REPORT.txt';

export function readTaskSchedulerActions(): ActionStatus[] {
  const raw = fs.readFileSync(REPORT_PATH, 'utf8');

  // Only read lines above the watchdog block (if one already exists)
  const reportBody = raw.split('Node-Windows Watchdog:')[0];

  const lines = reportBody
    .split('\n')
    .filter((l) => l.includes('|'))
    .filter((l) => !l.startsWith('Action') && !l.startsWith('---'));

  return lines
    .map((line) => {
      const [name, lastRunType, frequency, lastRun] = line
        .split('|')
        .map((s) => s.trim());

      // Parse DD/MM/YYYY HH:MM:SS → valid Date
      const dateMatch = lastRun.match(
        /(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/
      );
      if (!dateMatch) return null;

      const [, dd, mm, yyyy, hh, min, ss] = dateMatch;
      const parsed = new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`);

      return { name, lastRunType, frequency, lastRun: parsed };
    })
    .filter(
      (a): a is ActionStatus => a !== null && a.lastRunType === 'Task Scheduler'
    );
}
```

---

### Step 3 — `src/watchdog/report-verifier.ts`

Reads each action's **dedicated report file** (where available) and extracts the last run
timestamp. This is more reliable than `ACTIONS_REPORT.txt` because the reports are written
directly by the action itself, not by the scheduler wrapper.

Each report has a different date format — the verifier handles all of them.

```typescript
import fs from 'fs';

/**
 * Maps action name (as it appears in ACTIONS_REPORT.txt) to:
 *   - the path of its dedicated report file
 *   - a parser that extracts the last run Date from that file's header
 */
const DEDICATED_REPORTS: Record<
  string,
  { path: string; parseDate: (raw: string) => Date | null }
> = {
  'Auto Packages Updater': {
    path: 'C:\\Users\\Or Assayag\\Desktop\\PROJECTS_UPDATES_REPORT.txt',
    // Header format:
    //   PROJECTS_UPDATES_REPORT
    //   Date: 23/05/2026 23:01:34
    parseDate: (raw) => {
      const match = raw.match(
        /Date:\s+(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/
      );
      if (!match) return null;
      const [, dd, mm, yyyy, hh, min, ss] = match;
      return new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`);
    },
  },

  'Backups Manager': {
    path: 'C:\\Users\\Or Assayag\\Desktop\\BACKUP_REPORT.txt',
    // Header format:
    //   BACKUP MANAGER REPORT
    //   Date/Time  : 24/05/2026 04:31:14
    parseDate: (raw) => {
      const match = raw.match(
        /Date\/Time\s*:\s+(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/
      );
      if (!match) return null;
      const [, dd, mm, yyyy, hh, min, ss] = match;
      return new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`);
    },
  },

  'Contacts Scan Maintainer': {
    path: 'C:\\Users\\Or Assayag\\Desktop\\SCAN_CONTACTS_REPORT.txt',
    // Header format:
    //   SCAN_CONTACTS_REPORT
    //   Date: 24/05/2026, 8:51:18
    parseDate: (raw) => {
      const match = raw.match(
        /Date:\s+(\d{2})\/(\d{2})\/(\d{4}),\s+(\d{1,2}):(\d{2}):(\d{2})/
      );
      if (!match) return null;
      const [, dd, mm, yyyy, hh, min, ss] = match;
      return new Date(
        `${yyyy}-${mm}-${dd}T${hh.padStart(2, '0')}:${min}:${ss}`
      );
    },
  },

  'Repos Scan Reporter': {
    path: 'C:\\Users\\Or Assayag\\Desktop\\SCAN_REPOS_REPORT.txt',
    // Header format:
    //   SCAN REPORT - nodejs-learning-v1
    //   Date: 24/05/2026, 12:44:28
    parseDate: (raw) => {
      const match = raw.match(
        /Date:\s+(\d{2})\/(\d{2})\/(\d{4}),\s+(\d{1,2}):(\d{2}):(\d{2})/
      );
      if (!match) return null;
      const [, dd, mm, yyyy, hh, min, ss] = match;
      return new Date(
        `${yyyy}-${mm}-${dd}T${hh.padStart(2, '0')}:${min}:${ss}`
      );
    },
  },
};

export interface VerifiedLastRun {
  date: Date;
  source: 'dedicated-report' | 'actions-report';
}

/**
 * Returns the most reliable last-run date for an action.
 * Prefers the dedicated report file if one exists and is readable.
 * Falls back to the date already parsed from ACTIONS_REPORT.txt.
 */
export function getVerifiedLastRun(
  actionName: string,
  fallbackDate: Date
): VerifiedLastRun {
  const config = DEDICATED_REPORTS[actionName];
  if (!config) {
    return { date: fallbackDate, source: 'actions-report' };
  }

  try {
    const raw = fs.readFileSync(config.path, 'utf8');
    const parsed = config.parseDate(raw);
    if (parsed && !isNaN(parsed.getTime())) {
      return { date: parsed, source: 'dedicated-report' };
    }
  } catch {
    // File missing or unreadable — fall back gracefully
  }

  return { date: fallbackDate, source: 'actions-report' };
}
```

---

### Step 4 — `src/watchdog/schedule-checker.ts`

Given a frequency string and a verified last-run date, decides if the action was missed by 08:00.
The `lastRun` passed in is already the most reliable date (from `report-verifier.ts`).

```typescript
/**
 * Returns true if the action should have completed before now
 * but its verified last-run timestamp predates its most recent scheduled slot.
 */
export function wasMissed(frequency: string, lastRun: Date): boolean {
  const now = new Date();
  const scheduledTime = getLastExpectedRunTime(frequency, now);
  if (!scheduledTime) return false;

  // Only flag as missed if the scheduled time has already passed
  if (now < scheduledTime) return false;

  return lastRun < scheduledTime;
}

function getLastExpectedRunTime(frequency: string, now: Date): Date | null {
  // Daily HH:MM
  const dailyMatch = frequency.match(/^Daily (\d{2}):(\d{2})$/);
  if (dailyMatch) {
    const [, hh, mm] = dailyMatch;
    const scheduled = new Date(now);
    scheduled.setHours(parseInt(hh), parseInt(mm), 0, 0);
    // If today's slot is in the future, use yesterday's
    if (scheduled > now) scheduled.setDate(scheduled.getDate() - 1);
    return scheduled;
  }

  // Weekly HH:MM Day (e.g. "Weekly 02:00 Sat")
  const weeklyMatch = frequency.match(/^Weekly (\d{2}):(\d{2}) (\w{3})$/);
  if (weeklyMatch) {
    const [, hh, mm, dayName] = weeklyMatch;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const targetDay = days.indexOf(dayName);
    if (targetDay === -1) return null;

    const scheduled = new Date(now);
    scheduled.setHours(parseInt(hh), parseInt(mm), 0, 0);
    const diff = (now.getDay() - targetDay + 7) % 7;
    scheduled.setDate(scheduled.getDate() - diff);
    if (scheduled > now) scheduled.setDate(scheduled.getDate() - 7);
    return scheduled;
  }

  // 'Never' or unrecognized
  return null;
}
```

---

### Step 4 — `src/watchdog/action-runner.ts`

Maps action names (as they appear in `ACTIONS_REPORT.txt`) to their `ActionDefinition`
and calls `run()`. **Update this map whenever you add a new action.**

```typescript
import { ActionDefinition } from '../types.js';
import syncDailyDocuments from '../actions/syncDailyDocuments.js';
import autoPackagesUpdater from '../actions/autoPackagesUpdater.js';
import contactsScanMaintainer from '../actions/contactsScanMaintainer.js';
import backupsManager from '../actions/backupsManager.js';

// Keys must match exactly what appears in the Action column of ACTIONS_REPORT.txt
const ACTION_MAP: Record<string, ActionDefinition> = {
  'Sync Daily Documents': syncDailyDocuments,
  'Auto Packages Updater': autoPackagesUpdater,
  'Contacts Scan Maintainer': contactsScanMaintainer,
  'Backups Manager': backupsManager,
};

export interface RunResult {
  name: string;
  success: boolean;
  error?: string;
}

export async function runAction(name: string): Promise<RunResult> {
  const action = ACTION_MAP[name];
  if (!action) {
    return { name, success: false, error: 'No ActionDefinition found' };
  }

  try {
    await action.run();
    return { name, success: true };
  } catch (err) {
    return { name, success: false, error: (err as Error).message };
  }
}
```

---

### Step 5 — `src/watchdog/report-writer.ts`

Appends the watchdog summary block to the bottom of `ACTIONS_REPORT.txt`.

```typescript
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
      .map((r) => `${r.name.padEnd(25)}| Failed to run!`)
      .join('\n');
    block = `\nNode-Windows Watchdog:\n${timestamp}\n${lines}\n`;
  }

  fs.writeFileSync(REPORT_PATH, raw + block, 'utf8');
}
```

---

### Step 6 — `src/watchdog/watchdog.ts`

Main entry point. Runs 24/7 as a Windows Service. Fires **once at 08:00**.
For each Task Scheduler action it:

1. Gets the fallback last-run date from `ACTIONS_REPORT.txt`
2. Tries to get a more reliable date from the action's dedicated report (if one exists)
3. Runs `wasMissed()` against whichever date is most reliable
4. Logs which source was used for transparency

```typescript
import cron from 'node-cron';
import { readTaskSchedulerActions } from './status-reader.js';
import { getVerifiedLastRun } from './report-verifier.js';
import { wasMissed } from './schedule-checker.js';
import { runAction, RunResult } from './action-runner.js';
import { appendWatchdogReport } from './report-writer.js';

console.log(
  `[${new Date().toISOString()}] Watchdog service started. Waiting for 08:00...`
);

cron.schedule('0 8 * * *', async () => {
  console.log(`[${new Date().toISOString()}] 08:00 check started.`);

  let actions;
  try {
    actions = readTaskSchedulerActions();
  } catch (err) {
    console.error(
      `[${new Date().toISOString()}] Failed to read ACTIONS_REPORT.txt:`,
      err
    );
    return;
  }

  const results: RunResult[] = [];

  for (const action of actions) {
    // Get the most reliable last-run date for this action
    const verified = getVerifiedLastRun(action.name, action.lastRun);

    console.log(
      `[${new Date().toISOString()}] Checking "${action.name}" ` +
        `(source: ${verified.source}, last run: ${verified.date.toISOString()})`
    );

    if (wasMissed(action.frequency, verified.date)) {
      console.log(
        `[${new Date().toISOString()}] MISSED: ${action.name} — attempting recovery...`
      );
      const result = await runAction(action.name);
      results.push(result);
      console.log(
        `[${new Date().toISOString()}] ${result.success ? '✅' : '❌'} ${action.name}`
      );
    } else {
      console.log(`[${new Date().toISOString()}] OK: ${action.name}`);
      results.push({ name: action.name, success: true });
    }
  }

  try {
    appendWatchdogReport(results);
    console.log(`[${new Date().toISOString()}] Report updated.`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Failed to write report:`, err);
  }
});
```

---

### Step 7 — `install-watchdog-service.ts`

Run **once as Administrator** to register the Windows Service.

```typescript
import { Service } from 'node-windows';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const svc = new Service({
  name: 'ActionsManagerWatchdog',
  description:
    'Checks overnight Task Scheduler actions at 08:00 and recovers missed ones.',
  script: path.resolve(__dirname, 'src/watchdog/watchdog.ts'),
  nodeOptions: ['--loader', 'ts-node/esm'],
  env: [{ name: 'NODE_ENV', value: 'production' }],
});

svc.on('install', () => {
  console.log('✅ Service installed. Starting...');
  svc.start();
});

svc.on('error', (err: unknown) => {
  console.error('❌ Error:', err);
});

svc.install();
```

### `uninstall-watchdog-service.ts`

```typescript
import { Service } from 'node-windows';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const svc = new Service({
  name: 'ActionsManagerWatchdog',
  script: path.resolve(__dirname, 'src/watchdog/watchdog.ts'),
});

svc.on('uninstall', () => console.log('✅ Service removed.'));
svc.uninstall();
```

---

### Step 8 — `package.json` scripts

```json
{
  "scripts": {
    "watchdog:install": "ts-node install-watchdog-service.ts",
    "watchdog:uninstall": "ts-node uninstall-watchdog-service.ts",
    "watchdog:dev": "ts-node src/watchdog/watchdog.ts"
  }
}
```

---

### Step 9 — First Run

```bash
# 1. Install dependencies
pnpm install

# 2. Test locally (Ctrl+C to stop — won't fire until 08:00 but confirms no boot errors)
pnpm watchdog:dev

# 3. Register as Windows Service (run terminal as Administrator)
pnpm watchdog:install
```

Open `services.msc` and confirm **ActionsManagerWatchdog** appears and is Running.

---

## Example Report Output

### All good:

```
Node-Windows Watchdog:
24/05/2026 08:00:12 - All run as expected!
```

### Some missed:

```
Node-Windows Watchdog:
24/05/2026 08:00:12
Sync Daily Documents     | Failed to run!
Auto Packages Updater    | Failed to run!
```

> Each morning the old watchdog block is replaced with a fresh one — the main table is never modified.

---

## Adding a New Action (future)

1. Create the `ActionDefinition` in `src/actions/`
2. Add it to `ACTION_MAP` in `action-runner.ts`
3. If the action has its own report file, add an entry to `DEDICATED_REPORTS` in `report-verifier.ts` with the file path and a `parseDate` function matching its header format
4. Restart the service via `services.msc` or run:
   ```bash
   # In an elevated PowerShell
   Restart-Service ActionsManagerWatchdog
   ```

---

## Notes & Caveats

- **Run installer as Administrator** — Windows Service registration requires elevated permissions.
- **Node.js must be in the system PATH** (not just user PATH) since the service runs without a user session.
- **`ACTIONS_REPORT.txt` must be updated by Task Scheduler** after each successful run — the watchdog uses `Last Run` timestamps to detect failures, so if Task Scheduler doesn't write to the file, the watchdog can't detect success.
- **One recovery attempt per action per day** — the watchdog runs once at 08:00. If the recovery run also fails, `Failed to run!` is still written to the report.
- **Weekly actions** are only flagged on the day after they're scheduled (e.g. `Repos Scan Reporter` on Saturdays). On other days the watchdog skips them.
