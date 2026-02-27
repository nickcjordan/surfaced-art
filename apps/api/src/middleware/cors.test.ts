import { describe, it, expect } from 'vitest'
import { app } from '../index'

describe('CORS configuration', () => {
  it('should allow requests from surfaced.art', async () => {
    const res = await app.request('/health', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://surfaced.art',
        'Access-Control-Request-Method': 'GET',
      },
    })
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://surfaced.art')
  })

  it('should allow requests from www.surfaced.art', async () => {
    const res = await app.request('/health', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://www.surfaced.art',
        'Access-Control-Request-Method': 'GET',
      },
    })
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://www.surfaced.art')
  })

  it('should allow requests from localhost:3000', async () => {
    const res = await app.request('/health', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
      },
    })
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000')
  })

  it('should allow requests from Vercel preview deploys', async () => {
    const res = await app.request('/health', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://surfaced-art-abc123.vercel.app',
        'Access-Control-Request-Method': 'GET',
      },
    })
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://surfaced-art-abc123.vercel.app')
  })

  it('should reject requests from unauthorized origins', async () => {
    const res = await app.request('/health', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://evil.com',
        'Access-Control-Request-Method': 'GET',
      },
    })
    // When origin is rejected, Hono does not set Access-Control-Allow-Origin
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull()
  })

  it('should include credentials support', async () => {
    const res = await app.request('/health', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://surfaced.art',
        'Access-Control-Request-Method': 'GET',
      },
    })
    expect(res.headers.get('Access-Control-Allow-Credentials')).toBe('true')
  })
})
