import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { rateLimiter, resetAllLimiters } from './rate-limiter'

beforeEach(() => {
  resetAllLimiters()
})

function createApp(maxRequests: number, windowMs: number) {
  const app = new Hono()
  app.use('/test', rateLimiter({ maxRequests, windowMs }))
  app.post('/test', (c) => c.json({ ok: true }))
  return app
}

describe('rateLimiter middleware', () => {
  it('should allow requests under the limit', async () => {
    const app = createApp(3, 60_000)

    const res = await app.request('/test', { method: 'POST' })
    expect(res.status).toBe(200)
  })

  it('should include rate limit headers in response', async () => {
    const app = createApp(5, 60_000)

    const res = await app.request('/test', { method: 'POST' })
    expect(res.headers.get('X-RateLimit-Limit')).toBe('5')
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('4')
    expect(res.headers.get('X-RateLimit-Reset')).toBeTruthy()
  })

  it('should decrement remaining count on each request', async () => {
    const app = createApp(3, 60_000)

    const res1 = await app.request('/test', { method: 'POST' })
    expect(res1.headers.get('X-RateLimit-Remaining')).toBe('2')

    const res2 = await app.request('/test', { method: 'POST' })
    expect(res2.headers.get('X-RateLimit-Remaining')).toBe('1')

    const res3 = await app.request('/test', { method: 'POST' })
    expect(res3.headers.get('X-RateLimit-Remaining')).toBe('0')
  })

  it('should return 429 when limit is exceeded', async () => {
    const app = createApp(2, 60_000)

    await app.request('/test', { method: 'POST' })
    await app.request('/test', { method: 'POST' })

    const res = await app.request('/test', { method: 'POST' })
    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.error.code).toBe('RATE_LIMITED')
    expect(body.error.message).toContain('Too many requests')
  })

  it('should include Retry-After header on 429 responses', async () => {
    const app = createApp(1, 60_000)

    await app.request('/test', { method: 'POST' })
    const res = await app.request('/test', { method: 'POST' })

    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBeTruthy()
    const retryAfter = Number(res.headers.get('Retry-After'))
    expect(retryAfter).toBeGreaterThan(0)
    expect(retryAfter).toBeLessThanOrEqual(60)
  })

  it('should track different IPs separately', async () => {
    const app = createApp(1, 60_000)

    // First IP
    const res1 = await app.request('/test', {
      method: 'POST',
      headers: { 'X-Forwarded-For': '1.2.3.4' },
    })
    expect(res1.status).toBe(200)

    // Second IP should still be allowed
    const res2 = await app.request('/test', {
      method: 'POST',
      headers: { 'X-Forwarded-For': '5.6.7.8' },
    })
    expect(res2.status).toBe(200)

    // First IP should now be blocked
    const res3 = await app.request('/test', {
      method: 'POST',
      headers: { 'X-Forwarded-For': '1.2.3.4' },
    })
    expect(res3.status).toBe(429)
  })
})
