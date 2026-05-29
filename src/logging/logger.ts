import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { LogLevel, LogEntry } from './types';
import { LOG_CONFIG } from './logConfig';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class Logger {
  private context: string = 'App';

  constructor(context?: string) {
    if (context) {
      this.context = context;
    }
  }

  setContext(context: string): void {
    this.context = context;
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(
    message: string,
    error?: unknown,
    data?: Record<string, unknown>
  ): void {
    const errorData: Record<string, unknown> = { ...data };

    if (error instanceof Error) {
      errorData.error = error.message;
      errorData.stack = error.stack;
    } else if (error !== undefined) {
      errorData.error = String(error);
    }

    this.log(LogLevel.ERROR, message, errorData);
  }

  private log(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      data,
    };

    if (LOG_CONFIG.enableConsole && this.shouldLog(level)) {
      const formattedMessage = `[${level.toUpperCase()}] [${this.context}] ${message}`;
      if (level === LogLevel.ERROR) {
        console.error(formattedMessage);
      } else if (level === LogLevel.WARN) {
        console.warn(formattedMessage);
      } else {
        console.log(formattedMessage);
      }
    }

    if (LOG_CONFIG.enableFile) {
      this.writeToFile(entry).catch(() => {
        // Silently fail if file logging fails to avoid console noise as requested
      });
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 1,
      [LogLevel.WARN]: 2,
      [LogLevel.ERROR]: 3,
    };
    const configLevel = LOG_CONFIG.level.toLowerCase() as LogLevel;
    const configLevelValue = levels[configLevel] ?? 0;
    return levels[level] >= configLevelValue;
  }

  private async writeToFile(entry: LogEntry): Promise<void> {
    // Write to the root of the project, not relative to src/logging
    const projectRoot = join(__dirname, '..', '..');
    const logFilePath = join(projectRoot, LOG_CONFIG.logDir, 'app.log');
    const logLine = JSON.stringify(entry) + '\n';
    try {
      await fs.mkdir(dirname(logFilePath), {
        recursive: true,
      });
      await fs.appendFile(logFilePath, logLine);
    } catch {
      // Ignore errors
    }
  }
}

export const logger = new Logger();
