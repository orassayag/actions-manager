import { LogLevel } from './types';

export const LOG_CONFIG = {
  level: (process.env.LOG_LEVEL as LogLevel) || LogLevel.DEBUG,
  logDir: 'logs',
  enableConsole: false,
  enableFile: true,
};
