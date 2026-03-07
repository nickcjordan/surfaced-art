import { describe, it, expect } from 'vitest'
import { RateLimiter } from '../../src/shared/rate-limiter.js'

describe('RateLimiter', () => {
  describe('domainOf', () => {
    it('extracts hostname from a valid URL', () => {
      expect(RateLimiter.domainOf('https://www.reddit.com/r/art')).toBe(
        'www.reddit.com'
      )
    })

    it('extracts hostname from URL with port', () => {
      expect(RateLimiter.domainOf('http://localhost:3000/api')).toBe(
        'localhost'
      )
    })

    it('returns the input string for invalid URLs', () => {
      expect(RateLimiter.domainOf('not-a-url')).toBe('not-a-url')
    })
  })

  describe('waitForSlot', () => {
    it('does not delay the first request to a domain', async () => {
      const limiter = new RateLimiter({ minDelayMs: 1000 })
      const start = Date.now()
      await limiter.waitForSlot('example.com')
      const elapsed = Date.now() - start
      expect(elapsed).toBeLessThan(50)
    })

    it('delays subsequent requests to the same domain', async () => {
      const limiter = new RateLimiter({ minDelayMs: 100 })
      await limiter.waitForSlot('example.com')
      const start = Date.now()
      await limiter.waitForSlot('example.com')
      const elapsed = Date.now() - start
      expect(elapsed).toBeGreaterThanOrEqual(80) // allow small timing variance
    })

    it('does not delay requests to different domains', async () => {
      const limiter = new RateLimiter({ minDelayMs: 1000 })
      await limiter.waitForSlot('a.com')
      const start = Date.now()
      await limiter.waitForSlot('b.com')
      const elapsed = Date.now() - start
      expect(elapsed).toBeLessThan(50)
    })
  })
})
