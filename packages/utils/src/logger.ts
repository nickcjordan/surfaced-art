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
  const timestamp = new Date().toISOString()

  // Spread data first so callers cannot accidentally override core fields.
  const entry: LogEntry = {
    ...data,
    level,
    message,
    timestamp,
  }

  let serialized: string
  try {
    serialized = JSON.stringify(entry)
  } catch (err) {
    const SENSITIVE_KEYS = ['password', 'secret', 'token']
    const redactedData =
      data == null
        ? undefined
        : typeof data !== 'object'
          ? String(data)
          : Object.entries(data).reduce<Record<string, unknown>>(
              (acc, [key, value]) => {
                const lowerKey = key.toLowerCase()
                if (SENSITIVE_KEYS.some((s) => lowerKey.includes(s))) {
                  acc[key] = '[REDACTED]'
                } else {
                  acc[key] = String(value)
                }
                return acc
              },
              {}
            )

    serialized = JSON.stringify({
      level,
      message,
      timestamp,
      serializationError: err instanceof Error ? err.message : 'Unknown serialization error',
      data: redactedData,
    })
  }

  if (level === 'error') {
    console.error(serialized)
  } else {
    console.log(serialized)
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
