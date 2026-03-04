/**
 * Polite HTTP client with rate limiting, retry, User-Agent, and timeout.
 */

import { RateLimiter } from './rate-limiter.js'

const USER_AGENT = 'SurfacedArt-RecruitTool/1.0'
const DEFAULT_TIMEOUT_MS = 15_000
const MAX_RETRIES = 2
const INITIAL_BACKOFF_MS = 1_000

export interface HttpClientConfig {
  rateLimiter: RateLimiter
  /** Override the fetch function for testing. */
  fetchFn?: typeof fetch
}

export interface FetchResult {
  ok: boolean
  status: number
  body: string
  headers: Record<string, string>
}

export class HttpClient {
  private rateLimiter: RateLimiter
  private fetchFn: typeof fetch

  constructor(config: HttpClientConfig) {
    this.rateLimiter = config.rateLimiter
    this.fetchFn = config.fetchFn ?? fetch
  }

  async get(url: string): Promise<FetchResult> {
    const domain = RateLimiter.domainOf(url)
    await this.rateLimiter.waitForSlot(domain)

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1)
        await new Promise((resolve) => setTimeout(resolve, backoff))
      }

      try {
        const controller = new AbortController()
        const timeout = setTimeout(
          () => controller.abort(),
          DEFAULT_TIMEOUT_MS
        )

        const response = await this.fetchFn(url, {
          headers: { 'User-Agent': USER_AGENT },
          signal: controller.signal,
        })

        clearTimeout(timeout)

        const body = await response.text()
        const headers: Record<string, string> = {}
        response.headers.forEach((value, key) => {
          headers[key] = value
        })

        const result: FetchResult = {
          ok: response.ok,
          status: response.status,
          body,
          headers,
        }

        // Don't retry on client errors (4xx) except 429
        if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
          return result
        }

        // Retry on 429 and 5xx
        lastError = new Error(`HTTP ${response.status}`)
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
      }
    }

    throw lastError ?? new Error(`Failed to fetch ${url}`)
  }
}
