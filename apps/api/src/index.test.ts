import { describe, it, expect } from 'vitest'
import { app } from './index'

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

  describe('404 handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await app.request('/unknown-route')
      expect(res.status).toBe(404)

      const data = await res.json()
      expect(data).toHaveProperty('error', 'Not found')
    })
  })
})
