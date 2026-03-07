/**
 * Per-domain rate limiter to ensure polite request spacing.
 */

export interface RateLimiterConfig {
  /** Minimum delay between requests to the same domain (ms). */
  minDelayMs: number
}

export class RateLimiter {
  private lastRequestByDomain = new Map<string, number>()

  constructor(private config: RateLimiterConfig) {}

  /**
   * Wait until it is safe to make a request to this domain,
   * then record the request timestamp.
   */
  async waitForSlot(domain: string): Promise<void> {
    const now = Date.now()
    const lastRequest = this.lastRequestByDomain.get(domain)

    if (lastRequest !== undefined) {
      const elapsed = now - lastRequest
      const remaining = this.config.minDelayMs - elapsed
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining))
      }
    }

    this.lastRequestByDomain.set(domain, Date.now())
  }

  /** Extract domain from a URL for rate limiting purposes. */
  static domainOf(url: string): string {
    try {
      return new URL(url).hostname
    } catch {
      return url
    }
  }
}
