import { describe, it, expect, vi } from 'vitest'

vi.mock('@surfaced-art/db', () => ({
  prisma: {
    $queryRawUnsafe: vi.fn().mockResolvedValue([{ now: new Date() }]),
    artistProfile: {
      findUnique: vi.fn(),
      findFirst: vi.fn().mockResolvedValue({ id: 'test-id' }),
    },
    listing: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      findUnique: vi.fn(),
    },
  },
}))

const { app } = await import('./index')

describe('API', () => {
  describe('GET /', () => {
    it('should return API info', async () => {
      const res = await app.request('/')
      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data).toHaveProperty('name', 'Surfaced Art API')
      expect(data).toHaveProperty('version', '0.0.1')
      expect(data).toHaveProperty('status', 'running')
    })
  })

  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await app.request('/health')
      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data).toHaveProperty('status', 'ok')
      expect(data).toHaveProperty('timestamp')
    })
  })

  describe('GET /health/db', () => {
    it('should return database health status', async () => {
      const res = await app.request('/health/db')
      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data).toHaveProperty('status', 'ok')
      expect(data).toHaveProperty('timestamp')
      expect(data).toHaveProperty('durationMs')
      expect(data.checks.connection.status).toBe('ok')
      expect(data.checks.schema.status).toBe('ok')
    })
  })

  describe('404 handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await app.request('/unknown-route')
      expect(res.status).toBe(404)

      const data = await res.json()
      expect(data.error.code).toBe('NOT_FOUND')
      expect(data.error.message).toBe('Not found')
    })
  })
})
