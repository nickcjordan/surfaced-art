import type { MiddlewareHandler } from 'hono'

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimiterOptions {
  /** Maximum number of requests per window */
  maxRequests: number
  /** Time window in milliseconds */
  windowMs: number
}

/**
 * In-memory rate limit store. Each limiter instance gets its own Map.
 * Note: On Lambda, each instance has its own memory, so this is per-instance
 * rate limiting (defense-in-depth alongside API Gateway throttling).
 */
const allStores: Map<string, RateLimitEntry>[] = []

/**
 * Reset all rate limit stores — used by tests.
 */
export function resetAllLimiters(): void {
  for (const store of allStores) {
    store.clear()
  }
}

/**
 * Extract client IP from the request, accounting for API Gateway proxying.
 */
function getClientIp(c: Parameters<MiddlewareHandler>[0]): string {
  return (
    c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ||
    c.req.header('X-Real-IP') ||
    '127.0.0.1'
  )
}

/**
 * Rate limiter middleware.
 * Uses a sliding window counter per client IP.
 *
 * @param options.maxRequests - Max requests per window
 * @param options.windowMs - Window size in milliseconds
 */
export function rateLimiter(options: RateLimiterOptions): MiddlewareHandler {
  const { maxRequests, windowMs } = options
  const store = new Map<string, RateLimitEntry>()
  allStores.push(store)

  return async (c, next) => {
    const ip = getClientIp(c)
    const now = Date.now()

    let entry = store.get(ip)

    // Reset if window has expired
    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs }
      store.set(ip, entry)
    }

    entry.count++

    // Calculate remaining and reset time
    const remaining = Math.max(0, maxRequests - entry.count)
    const resetSeconds = Math.ceil((entry.resetAt - now) / 1000)

    if (entry.count > maxRequests) {
      c.header('X-RateLimit-Limit', String(maxRequests))
      c.header('X-RateLimit-Remaining', '0')
      c.header('X-RateLimit-Reset', String(entry.resetAt))
      c.header('Retry-After', String(resetSeconds))

      return c.json(
        { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } },
        429,
      )
    }

    // Proceed with rate limit headers
    await next()

    c.header('X-RateLimit-Limit', String(maxRequests))
    c.header('X-RateLimit-Remaining', String(remaining))
    c.header('X-RateLimit-Reset', String(entry.resetAt))

    return
  }
}
