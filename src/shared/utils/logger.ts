export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const PREFIX = '[Autofill]';

export function log(level: LogLevel, ...args: unknown[]): void {
  console[level](`${PREFIX}`, ...args);
}

export const logger = {
  debug: (...args: unknown[]) => log('debug', ...args),
  info: (...args: unknown[]) => log('info', ...args),
  warn: (...args: unknown[]) => log('warn', ...args),
  error: (...args: unknown[]) => log('error', ...args),
};


