/**
 * Structured JSON logger for CloudWatch Logs Insights.
 *
 * Outputs single-line JSON to stdout/stderr so CloudWatch can parse
 * and query by field (level, message, timestamp, plus any additional data).
 *
 * Do not log sensitive data (emails, passwords, payment details, full addresses).
 */

export type LogLevel = 'info' | 'warn' | 'error'

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  [key: string]: unknown
}

function log(
  level: LogLevel,
  message: string,
  data?: Record<string, unknown>
): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...data,
  }

  if (level === 'error') {
    console.error(JSON.stringify(entry))
  } else {
    console.log(JSON.stringify(entry))
  }
}

export const logger = {
  info: (message: string, data?: Record<string, unknown>) =>
    log('info', message, data),
  warn: (message: string, data?: Record<string, unknown>) =>
    log('warn', message, data),
  error: (message: string, data?: Record<string, unknown>) =>
    log('error', message, data),
}
