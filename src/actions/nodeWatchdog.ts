import { ActionDefinition } from '../index';
import { execSync } from 'child_process';
import { appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// ─── Config ───────────────────────────────────────────────────────────────────

const MAX_RUNTIME_MS = 10 * 60 * 60 * 1000; // 10 hours
const LOG_DIR = 'C:\\logs';
const LOG_FILE = join(LOG_DIR, 'node-watchdog.log');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(msg: string): void {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  process.stdout.write(line);
  try {
    mkdirSync(LOG_DIR, { recursive: true });
    appendFileSync(LOG_FILE, line);
  } catch (err) {
    console.warn('⚠️  Could not write to log file:', (err as Error).message);
  }
}

interface WmicProcess {
  pid: number;
  name: string;
  commandLine: string;
  creationDate: Date | null;
}

/**
 * Returns all running processes via WMIC.
 * We avoid ps-list here so the action has zero extra deps beyond Node builtins.
 */
function getProcessList(): WmicProcess[] {
  try {
    // WMIC gives us Name, ProcessId, CommandLine, CreationDate in CSV form
    const raw = execSync(
      'wmic process get Name,ProcessId,CommandLine,CreationDate /format:csv',
      { encoding: 'utf8', windowsHide: true }
    );

    const lines = raw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    // First non-empty line is "Node,..." header; second is CSV header
    const csvHeader = lines.find((l) =>
      l.toLowerCase().includes('commandline,creationdate')
    );
    if (!csvHeader) return [];

    const cols = csvHeader.split(',').map((c) => c.trim().toLowerCase());
    const nameIdx = cols.indexOf('name');
    const pidIdx = cols.indexOf('processid');
    const cmdIdx = cols.indexOf('commandline');
    const dateIdx = cols.indexOf('creationdate');

    const results: WmicProcess[] = [];

    for (const line of lines) {
      if (line === csvHeader) continue;
      const parts = line.split(',');
      if (parts.length < cols.length) continue;

      const name = parts[nameIdx]?.trim() ?? '';
      if (name.toLowerCase() !== 'node.exe') continue;

      const pid = parseInt(parts[pidIdx]?.trim() ?? '0', 10);
      const commandLine = parts[cmdIdx]?.trim() ?? '';
      const rawDate = parts[dateIdx]?.trim() ?? '';

      // WMIC date format: YYYYMMDDHHmmss.ffffff+offset  e.g. 20250604143022.123456+060
      let creationDate: Date | null = null;
      if (rawDate.length >= 14) {
        const y = rawDate.slice(0, 4);
        const mo = rawDate.slice(4, 6);
        const d = rawDate.slice(6, 8);
        const h = rawDate.slice(8, 10);
        const mi = rawDate.slice(10, 12);
        const s = rawDate.slice(12, 14);
        creationDate = new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}`);
      }

      if (pid) results.push({ pid, name, commandLine, creationDate });
    }

    return results;
  } catch (err) {
    log(`ERROR reading process list: ${(err as Error).message}`);
    return [];
  }
}

/**
 * Known process names that host the Windows Task Scheduler service.
 * - taskeng.exe   — Windows 7 / Server 2008 task host
 * - taskhostw.exe — Windows 8+ task host wrapper
 * - svchost.exe   — generic host; used by the Schedule service on modern Windows
 */
const SCHEDULER_HOST_NAMES = new Set([
  'taskeng.exe',
  'taskhostw.exe',
  'svchost.exe',
]);

/**
 * Returns the parent PID of a given PID using WMIC, or null if unavailable.
 */
function getParentPid(pid: number): number | null {
  try {
    const raw = execSync(
      `wmic process where ProcessId=${pid} get ParentProcessId /format:value`,
      { encoding: 'utf8', windowsHide: true }
    );
    const match = raw.match(/ParentProcessId=(\d+)/i);
    return match ? parseInt(match[1], 10) : null;
  } catch {
    return null;
  }
}

/**
 * Returns the executable name of a given PID using WMIC, or null if unavailable.
 */
function getProcessName(pid: number): string | null {
  try {
    const raw = execSync(
      `wmic process where ProcessId=${pid} get Name /format:value`,
      { encoding: 'utf8', windowsHide: true }
    );
    const match = raw.match(/Name=(.+)/i);
    return match ? match[1].trim().toLowerCase() : null;
  } catch {
    return null;
  }
}

/**
 * Walks up the parent process chain (up to MAX_DEPTH levels) and returns true
 * if any ancestor is a known Windows Task Scheduler host process.
 *
 * This is the strict check — it works regardless of command line content, so
 * manually launched node processes (even from the same project directory) are
 * never incorrectly flagged.
 */
const SCHEDULER_WALK_DEPTH = 6;

function isSchedulerSpawned(proc: WmicProcess): boolean {
  let currentPid = proc.pid;

  for (let depth = 0; depth < SCHEDULER_WALK_DEPTH; depth++) {
    const parentPid = getParentPid(currentPid);
    if (!parentPid || parentPid === 0 || parentPid === currentPid) break;

    const parentName = getProcessName(parentPid);
    if (!parentName) break;

    if (SCHEDULER_HOST_NAMES.has(parentName)) return true;

    currentPid = parentPid;
  }

  return false;
}

// ─── Action ───────────────────────────────────────────────────────────────────

const nodeWatchdog: ActionDefinition = {
  name: 'nodeWatchdog',
  label: 'Node Watchdog',
  taskName: 'nodeWatchdog',
  schedulePeriod: 'Every6Hours', // adjust to whatever your scheduler supports
  pauseAfterRun: false,

  run: async () => {
    await Promise.resolve();
    log('─── Node Watchdog started ───────────────────────────────');

    const procs = getProcessList();
    const nodeProcs = procs.filter((p) => p.name.toLowerCase() === 'node.exe');

    log(`Found ${nodeProcs.length} node.exe process(es) total.`);

    const now = Date.now();
    let killed = 0;
    let skipped = 0;

    for (const proc of nodeProcs) {
      if (!proc.creationDate || isNaN(proc.creationDate.getTime())) {
        log(`  PID ${proc.pid} — could not determine start time, skipping.`);
        skipped++;
        continue;
      }

      const ageMs = now - proc.creationDate.getTime();
      const ageHours = (ageMs / 3_600_000).toFixed(1);

      if (!isSchedulerSpawned(proc)) {
        log(
          `  PID ${proc.pid} — age ${ageHours}h — NOT a scheduler process, skipping.`
        );
        skipped++;
        continue;
      }

      if (ageMs <= MAX_RUNTIME_MS) {
        log(`  PID ${proc.pid} — age ${ageHours}h — within limit, skipping.`);
        skipped++;
        continue;
      }

      log(
        `  PID ${proc.pid} — age ${ageHours}h — EXCEEDS ${MAX_RUNTIME_MS / 3_600_000}h limit → KILLING`
      );
      log(`    CMD: ${proc.commandLine.slice(0, 120)}`);

      try {
        execSync(`taskkill /F /PID ${proc.pid}`, { windowsHide: true });
        log(`  ✅  PID ${proc.pid} terminated.`);
        killed++;
      } catch (err) {
        log(`  ❌  Failed to kill PID ${proc.pid}: ${(err as Error).message}`);
      }
    }

    log(`─── Done. Killed: ${killed}  Skipped: ${skipped} ───────────────`);
  },
};

export default nodeWatchdog;
