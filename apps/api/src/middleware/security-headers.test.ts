import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { securityHeaders } from './security-headers'

function createTestApp() {
  const app = new Hono()
  app.use('*', securityHeaders())
  app.get('/test', (c) => c.json({ ok: true }))
  return app
}

describe('securityHeaders middleware', () => {
  it('should set Strict-Transport-Security header', async () => {
    const app = createTestApp()
    const res = await app.request('/test')
    expect(res.headers.get('Strict-Transport-Security')).toBe(
      'max-age=63072000; includeSubDomains; preload'
    )
  })

  it('should set X-Content-Type-Options header', async () => {
    const app = createTestApp()
    const res = await app.request('/test')
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
  })

  it('should set X-Frame-Options header', async () => {
    const app = createTestApp()
    const res = await app.request('/test')
    expect(res.headers.get('X-Frame-Options')).toBe('DENY')
  })

  it('should set X-XSS-Protection to 0 (disabled, use CSP instead)', async () => {
    const app = createTestApp()
    const res = await app.request('/test')
    expect(res.headers.get('X-XSS-Protection')).toBe('0')
  })

  it('should set Referrer-Policy header', async () => {
    const app = createTestApp()
    const res = await app.request('/test')
    expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
  })

  it('should set Permissions-Policy header', async () => {
    const app = createTestApp()
    const res = await app.request('/test')
    expect(res.headers.get('Permissions-Policy')).toBe(
      'camera=(), microphone=(), geolocation=()'
    )
  })

  it('should set Content-Security-Policy header', async () => {
    const app = createTestApp()
    const res = await app.request('/test')
    const csp = res.headers.get('Content-Security-Policy')
    expect(csp).toBeTruthy()
    // API only serves JSON, so a restrictive CSP is appropriate
    expect(csp).toContain("default-src 'none'")
    expect(csp).toContain("frame-ancestors 'none'")
  })

  it('should apply headers to all responses', async () => {
    const app = createTestApp()
    // Even a 404 should have security headers
    const res = await app.request('/nonexistent')
    // Hono returns 404 from its default handler — but our middleware runs on '*'
    // so any matched route will have headers. For unmatched routes, the middleware
    // still runs because it's registered on '*'.
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
  })

  it('should not interfere with response body', async () => {
    const app = createTestApp()
    const res = await app.request('/test')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ ok: true })
  })
})
