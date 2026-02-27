/**
 * Email-specific rate limiter.
 *
 * Sliding window counter that limits email sends per Lambda instance.
 * Prevents exceeding SES sending limits.
 */

interface RateLimitState {
  count: number
  windowStart: number
}

const DEFAULT_MAX_PER_SECOND = 10
const DEFAULT_WINDOW_MS = 1000

let state: RateLimitState = { count: 0, windowStart: Date.now() }
let maxPerWindow = DEFAULT_MAX_PER_SECOND
let windowMs = DEFAULT_WINDOW_MS

/**
 * Configure rate limit thresholds.
 */
export function configureRateLimit(options: {
  maxPerSecond?: number
  windowMs?: number
}): void {
  maxPerWindow = options.maxPerSecond ?? DEFAULT_MAX_PER_SECOND
  windowMs = options.windowMs ?? DEFAULT_WINDOW_MS
}

/**
 * Check if an email send is allowed under the current rate limit.
 * Returns true if allowed, false if rate limited.
 */
export function checkRateLimit(): boolean {
  const now = Date.now()
  if (now - state.windowStart >= windowMs) {
    state = { count: 0, windowStart: now }
  }
  state.count++
  return state.count <= maxPerWindow
}

/**
 * Reset rate limiter state. Used by tests.
 */
export function resetRateLimit(): void {
  state = { count: 0, windowStart: Date.now() }
}
