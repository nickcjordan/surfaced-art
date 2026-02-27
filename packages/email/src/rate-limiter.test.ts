import { describe, it, expect, beforeEach, vi } from 'vitest'
import { checkRateLimit, configureRateLimit, resetRateLimit } from './rate-limiter.js'

describe('email rate limiter', () => {
  beforeEach(() => {
    resetRateLimit()
    configureRateLimit({ maxPerSecond: 10, windowMs: 1000 })
  })

  it('should allow requests within the limit', () => {
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit()).toBe(true)
    }
  })

  it('should reject requests exceeding the limit', () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit()
    }
    expect(checkRateLimit()).toBe(false)
  })

  it('should reset after the window expires', () => {
    // Fill up the window
    for (let i = 0; i < 10; i++) {
      checkRateLimit()
    }
    expect(checkRateLimit()).toBe(false)

    // Advance time past the window
    vi.useFakeTimers()
    vi.advanceTimersByTime(1001)

    expect(checkRateLimit()).toBe(true)

    vi.useRealTimers()
  })

  it('should respect custom configuration', () => {
    configureRateLimit({ maxPerSecond: 3, windowMs: 500 })

    expect(checkRateLimit()).toBe(true)
    expect(checkRateLimit()).toBe(true)
    expect(checkRateLimit()).toBe(true)
    expect(checkRateLimit()).toBe(false)
  })

  it('should clear state on resetRateLimit()', () => {
    // Fill up the window
    for (let i = 0; i < 10; i++) {
      checkRateLimit()
    }
    expect(checkRateLimit()).toBe(false)

    resetRateLimit()
    expect(checkRateLimit()).toBe(true)
  })
})
