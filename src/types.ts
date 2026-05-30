export type RunType = 'Manual' | 'Task Scheduler';
export type RunStatus = 'Running' | 'Finished' | 'Error';

interface ActionHistory {
  lastRunAt: string; // ISO string (Jerusalem time stored as local ISO)
  runType: RunType;
  status: RunStatus;
  period?: string; // e.g. "Daily", "Weekly" — only for Task Scheduler runs
}

export interface ActionHistoryMap {
  [actionName: string]: ActionHistory;
}

export interface ActionDefinition {
  /** Unique key — used as the CLI arg and the report label */
  name: string;
  /** Human-readable label shown in dropdown and report */
  label: string;
  /**
   * The name of the task in Windows Task Scheduler.
   * If undefined, the action is considered manual only.
   */
  taskName?: string;
  /**
   * Scheduling period label shown in ACTIONS_REPORT.txt.
   * Set to undefined for actions that are only run manually.
   * e.g. "Daily", "Weekly", "Monthly"
   */
  schedulePeriod?: string;
  /**
   * Whether to pause (keep window open) after execution.
   * Mirrors the `pause` keyword in the original .bat files.
   */
  pauseAfterRun: boolean;
  /** The actual function that runs the action (can be sync or async) */
  run: () => void | Promise<void>;
}
