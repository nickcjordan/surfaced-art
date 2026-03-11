import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { requestId } from './request-id'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function createTestApp() {
  const app = new Hono()
  app.use('*', requestId())
  app.get('/test', (c) => c.json({ ok: true }))
  return app
}

describe('requestId middleware', () => {
  it('should add X-Request-Id response header', async () => {
    const app = createTestApp()
    const res = await app.request('/test')
    expect(res.headers.get('X-Request-Id')).toBeTruthy()
  })

  it('should generate a valid UUID v4', async () => {
    const app = createTestApp()
    const res = await app.request('/test')
    const id = res.headers.get('X-Request-Id')!
    expect(id).toMatch(UUID_REGEX)
  })

  it('should generate unique IDs for each request', async () => {
    const app = createTestApp()
    const res1 = await app.request('/test')
    const res2 = await app.request('/test')
    expect(res1.headers.get('X-Request-Id')).not.toBe(
      res2.headers.get('X-Request-Id')
    )
  })

  it('should preserve an incoming X-Request-Id header', async () => {
    const app = createTestApp()
    const incomingId = '550e8400-e29b-41d4-a716-446655440000'
    const res = await app.request('/test', {
      headers: { 'X-Request-Id': incomingId },
    })
    expect(res.headers.get('X-Request-Id')).toBe(incomingId)
  })

  it('should not interfere with the response body', async () => {
    const app = createTestApp()
    const res = await app.request('/test')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ ok: true })
  })
})
