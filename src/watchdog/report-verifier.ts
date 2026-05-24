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
    if (fs.existsSync(config.path)) {
      const raw = fs.readFileSync(config.path, 'utf8');
      const parsed = config.parseDate(raw);
      if (parsed && !isNaN(parsed.getTime())) {
        return { date: parsed, source: 'dedicated-report' };
      }
    }
  } catch {
    // File missing or unreadable — fall back gracefully
  }

  return { date: fallbackDate, source: 'actions-report' };
}
