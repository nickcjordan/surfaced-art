import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logger, type LogEntry } from './logger'

describe('logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function parseOutput(spy: ReturnType<typeof vi.spyOn>): LogEntry {
    const call = spy.mock.calls[0]
    return JSON.parse(call[0] as string)
  }

  describe('info', () => {
    it('should output valid JSON with correct fields', () => {
      logger.info('test message')

      expect(consoleLogSpy).toHaveBeenCalledOnce()
      const entry = parseOutput(consoleLogSpy)
      expect(entry.level).toBe('info')
      expect(entry.message).toBe('test message')
      expect(entry.timestamp).toBeDefined()
    })

    it('should use console.log', () => {
      logger.info('test')

      expect(consoleLogSpy).toHaveBeenCalledOnce()
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })
  })

  describe('warn', () => {
    it('should output valid JSON with correct fields', () => {
      logger.warn('warning message')

      expect(consoleLogSpy).toHaveBeenCalledOnce()
      const entry = parseOutput(consoleLogSpy)
      expect(entry.level).toBe('warn')
      expect(entry.message).toBe('warning message')
      expect(entry.timestamp).toBeDefined()
    })

    it('should use console.log', () => {
      logger.warn('test')

      expect(consoleLogSpy).toHaveBeenCalledOnce()
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })
  })

  describe('error', () => {
    it('should output valid JSON with correct fields', () => {
      logger.error('error message')

      expect(consoleErrorSpy).toHaveBeenCalledOnce()
      const entry = parseOutput(consoleErrorSpy)
      expect(entry.level).toBe('error')
      expect(entry.message).toBe('error message')
      expect(entry.timestamp).toBeDefined()
    })

    it('should use console.error', () => {
      logger.error('test')

      expect(consoleErrorSpy).toHaveBeenCalledOnce()
      expect(consoleLogSpy).not.toHaveBeenCalled()
    })
  })

  describe('timestamp', () => {
    it('should produce a valid ISO 8601 timestamp', () => {
      logger.info('test')

      const entry = parseOutput(consoleLogSpy)
      const parsed = new Date(entry.timestamp as string)
      expect(parsed.toISOString()).toBe(entry.timestamp)
    })
  })

  describe('additional data', () => {
    it('should spread additional data fields into the output', () => {
      logger.info('request completed', {
        slug: 'jane-doe',
        durationMs: 42,
        listingCount: 5,
      })

      const entry = parseOutput(consoleLogSpy)
      expect(entry.level).toBe('info')
      expect(entry.message).toBe('request completed')
      expect(entry.slug).toBe('jane-doe')
      expect(entry.durationMs).toBe(42)
      expect(entry.listingCount).toBe(5)
    })

    it('should work without additional data', () => {
      logger.info('simple message')

      const entry = parseOutput(consoleLogSpy)
      expect(entry.level).toBe('info')
      expect(entry.message).toBe('simple message')
      expect(Object.keys(entry)).toEqual(
        expect.arrayContaining(['level', 'message', 'timestamp'])
      )
    })

    it('should spread error data fields into error output', () => {
      logger.error('database failed', {
        error: 'Connection refused',
        stack: 'Error: Connection refused\n    at ...',
      })

      const entry = parseOutput(consoleErrorSpy)
      expect(entry.error).toBe('Connection refused')
      expect(entry.stack).toBe('Error: Connection refused\n    at ...')
    })

    it('should not allow data to override core fields', () => {
      logger.info('real message', {
        level: 'error' as unknown as string,
        message: 'overridden',
        timestamp: '1999-01-01T00:00:00.000Z',
      })

      const entry = parseOutput(consoleLogSpy)
      expect(entry.level).toBe('info')
      expect(entry.message).toBe('real message')
      expect(entry.timestamp).not.toBe('1999-01-01T00:00:00.000Z')
    })

    it('should handle non-serializable data gracefully', () => {
      const circular: Record<string, unknown> = { route: '/artists' }
      circular.self = circular

      logger.info('circular ref', circular)

      expect(consoleLogSpy).toHaveBeenCalledOnce()
      const entry = parseOutput(consoleLogSpy)
      expect(entry.level).toBe('info')
      expect(entry.message).toBe('circular ref')
      expect(entry.serializationError).toBeDefined()
      // Fallback should include stringified data for debugging context
      const data = entry.data as Record<string, unknown>
      expect(data.route).toBe('/artists')
    })

    it('should redact sensitive keys in serialization fallback', () => {
      const circular: Record<string, unknown> = {
        userPassword: 'hunter2',
        apiToken: 'abc123',
        clientSecret: 'shhh',
        route: '/login',
      }
      circular.self = circular

      logger.info('sensitive circular', circular)

      expect(consoleLogSpy).toHaveBeenCalledOnce()
      const entry = parseOutput(consoleLogSpy)
      expect(entry.serializationError).toBeDefined()
      const data = entry.data as Record<string, unknown>
      expect(data.userPassword).toBe('[REDACTED]')
      expect(data.apiToken).toBe('[REDACTED]')
      expect(data.clientSecret).toBe('[REDACTED]')
      expect(data.route).toBe('/login')
    })
  })
})
