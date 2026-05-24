import fs from 'fs';

export interface ActionStatus {
  name: string;
  lastRunType: string; // 'Task Scheduler' | 'Manual'
  frequency: string; // e.g. 'Daily 22:00', 'Weekly 02:00 Sat', 'Never'
  lastRun: Date;
}

const REPORT_PATH = 'C:\\Users\\Or Assayag\\Desktop\\ACTIONS_REPORT.txt';

export function readTaskSchedulerActions(): ActionStatus[] {
  if (!fs.existsSync(REPORT_PATH)) {
    throw new Error(`Report file not found at ${REPORT_PATH}`);
  }

  const raw = fs.readFileSync(REPORT_PATH, 'utf8');

  // Only read lines above the watchdog block (if one already exists)
  const reportBody = raw.split('Node-Windows Watchdog:')[0];

  const lines = reportBody
    .split('\n')
    .filter((l) => l.includes('|'))
    .filter(
      (l) =>
        !l.toLowerCase().includes('action') &&
        !l.includes('---') &&
        !l.includes('===')
    );

  return lines
    .map((line) => {
      const segments = line.split('|').map((s) => s.trim());
      if (segments.length < 4) return null;

      const [name, lastRunType, frequency, lastRun] = segments;

      // Parse DD/MM/YYYY HH:MM:SS → valid Date
      const dateMatch = lastRun.match(
        /(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/
      );
      if (!dateMatch) return null;

      const [, dd, mm, yyyy, hh, min, ss] = dateMatch;
      const parsed = new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`);

      return { name, lastRunType, frequency, lastRun: parsed };
    })
    .filter((a): a is ActionStatus => a !== null);
}
