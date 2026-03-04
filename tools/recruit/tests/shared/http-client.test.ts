import { describe, it, expect, vi } from 'vitest'
import { HttpClient, type FetchResult } from '../../src/shared/http-client.js'
import { RateLimiter } from '../../src/shared/rate-limiter.js'

function createMockFetch(responses: Array<{ status: number; body: string; ok?: boolean }>) {
  let callIndex = 0
  return vi.fn(async () => {
    const resp = responses[callIndex] ?? responses[responses.length - 1]!
    callIndex++
    return new Response(resp.body, {
      status: resp.status,
      headers: { 'content-type': 'text/html' },
    })
  }) as unknown as typeof fetch
}

describe('HttpClient', () => {
  it('returns a successful response', async () => {
    const mockFetch = createMockFetch([{ status: 200, body: '<html>hello</html>' }])
    const client = new HttpClient({
      rateLimiter: new RateLimiter({ minDelayMs: 0 }),
      fetchFn: mockFetch,
    })

    const result = await client.get('https://example.com/page')
    expect(result.ok).toBe(true)
    expect(result.status).toBe(200)
    expect(result.body).toBe('<html>hello</html>')
  })

  it('returns 4xx errors without retrying (except 429)', async () => {
    const mockFetch = createMockFetch([{ status: 404, body: 'Not Found' }])
    const client = new HttpClient({
      rateLimiter: new RateLimiter({ minDelayMs: 0 }),
      fetchFn: mockFetch,
    })

    const result = await client.get('https://example.com/missing')
    expect(result.ok).toBe(false)
    expect(result.status).toBe(404)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('retries on 500 errors', async () => {
    const mockFetch = createMockFetch([
      { status: 500, body: 'Server Error' },
      { status: 500, body: 'Server Error' },
      { status: 200, body: 'OK' },
    ])
    const client = new HttpClient({
      rateLimiter: new RateLimiter({ minDelayMs: 0 }),
      fetchFn: mockFetch,
    })

    const result = await client.get('https://example.com/flaky')
    expect(result.ok).toBe(true)
    expect(result.status).toBe(200)
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('retries on 429 rate limit errors', async () => {
    const mockFetch = createMockFetch([
      { status: 429, body: 'Rate Limited' },
      { status: 200, body: 'OK' },
    ])
    const client = new HttpClient({
      rateLimiter: new RateLimiter({ minDelayMs: 0 }),
      fetchFn: mockFetch,
    })

    const result = await client.get('https://example.com/limited')
    expect(result.ok).toBe(true)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('throws after exhausting retries on 5xx', async () => {
    const mockFetch = createMockFetch([
      { status: 500, body: 'Error' },
      { status: 500, body: 'Error' },
      { status: 500, body: 'Error' },
    ])
    const client = new HttpClient({
      rateLimiter: new RateLimiter({ minDelayMs: 0 }),
      fetchFn: mockFetch,
    })

    await expect(client.get('https://example.com/down')).rejects.toThrow('HTTP 500')
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('sets User-Agent header on requests', async () => {
    const mockFetch = vi.fn(async () => new Response('OK', { status: 200 })) as unknown as typeof fetch
    const client = new HttpClient({
      rateLimiter: new RateLimiter({ minDelayMs: 0 }),
      fetchFn: mockFetch,
    })

    await client.get('https://example.com')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        headers: expect.objectContaining({ 'User-Agent': 'SurfacedArt-RecruitTool/1.0' }),
      })
    )
  })
})
