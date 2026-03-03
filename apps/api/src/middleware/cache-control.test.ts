import { describe, it, expect, afterEach } from 'vitest'
import { Hono } from 'hono'
import { cacheControl } from './cache-control'

function createTestApp(directive: string) {
  const app = new Hono()
  app.use('*', cacheControl(directive))
  app.get('/test', (c) => c.json({ ok: true }))
  app.post('/test', (c) => c.json({ created: true }, 201))
  app.get('/error', (c) => c.json({ error: 'not found' }, 404))
  app.get('/server-error', (c) => c.json({ error: 'internal' }, 500))
  return app
}

describe('cacheControl middleware', () => {
  const originalEnv = process.env.CACHE_DISABLED

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.CACHE_DISABLED = originalEnv
    } else {
      delete process.env.CACHE_DISABLED
    }
  })

  it('should set Cache-Control header on GET 200 responses', async () => {
    const app = createTestApp('public, max-age=300')
    const res = await app.request('/test')
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=300')
  })

  it('should not set header on POST responses', async () => {
    const app = createTestApp('public, max-age=300')
    const res = await app.request('/test', { method: 'POST' })
    expect(res.status).toBe(201)
    expect(res.headers.get('Cache-Control')).toBeNull()
  })

  it('should not set header on 404 error responses', async () => {
    const app = createTestApp('public, max-age=300')
    const res = await app.request('/error')
    expect(res.status).toBe(404)
    expect(res.headers.get('Cache-Control')).toBeNull()
  })

  it('should not set header on 500 error responses', async () => {
    const app = createTestApp('public, max-age=300')
    const res = await app.request('/server-error')
    expect(res.status).toBe(500)
    expect(res.headers.get('Cache-Control')).toBeNull()
  })

  it('should not interfere with response body', async () => {
    const app = createTestApp('public, max-age=3600')
    const res = await app.request('/test')
    const body = await res.json()
    expect(body).toEqual({ ok: true })
  })

  it('should support no-store directive', async () => {
    const app = createTestApp('no-store')
    const res = await app.request('/test')
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })

  it('should support private, no-cache directive', async () => {
    const app = createTestApp('private, no-cache')
    const res = await app.request('/test')
    expect(res.headers.get('Cache-Control')).toBe('private, no-cache')
  })

  it('should skip cache headers when CACHE_DISABLED=true', async () => {
    process.env.CACHE_DISABLED = 'true'
    const app = createTestApp('public, max-age=300')
    const res = await app.request('/test')
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBeNull()
  })

  it('should set cache headers when CACHE_DISABLED is not set', async () => {
    delete process.env.CACHE_DISABLED
    const app = createTestApp('public, max-age=300')
    const res = await app.request('/test')
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=300')
  })

  it('should set cache headers when CACHE_DISABLED=false', async () => {
    process.env.CACHE_DISABLED = 'false'
    const app = createTestApp('public, max-age=300')
    const res = await app.request('/test')
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=300')
  })
})
