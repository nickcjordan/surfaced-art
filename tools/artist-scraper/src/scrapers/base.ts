/**
 * Shared scraper utilities: HTTP fetch with retry, rate limiting, and robots.txt.
 */

import { logger } from '@surfaced-art/utils'

const USER_AGENT = 'SurfacedArt-ArtistTool/1.0 (contact@surfaced.art)'
const DEFAULT_TIMEOUT_MS = 15_000
const RATE_LIMIT_DELAY_MS = 500
const MAX_RETRIES = 2

/** Track last fetch time per domain for rate limiting. */
const lastFetchByDomain = new Map<string, number>()

/** Cache of robots.txt disallow rules per domain. */
const robotsCache = new Map<string, string[]>()

export interface FetchResult {
  ok: boolean
  status: number
  headers: Record<string, string>
  body: string
  url: string
}

/**
 * Delay execution for the given number of milliseconds.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Rate-limit fetch: wait at least RATE_LIMIT_DELAY_MS between requests to the same domain.
 */
async function rateLimitDelay(domain: string): Promise<void> {
  const last = lastFetchByDomain.get(domain) || 0
  const elapsed = Date.now() - last
  if (elapsed < RATE_LIMIT_DELAY_MS) {
    await delay(RATE_LIMIT_DELAY_MS - elapsed)
  }
  lastFetchByDomain.set(domain, Date.now())
}

/**
 * Extract domain from URL for rate limiting.
 */
function getDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return 'unknown'
  }
}

/**
 * Fetch a URL with retry, rate limiting, and timeout.
 */
export async function fetchPage(
  url: string,
  options?: {
    timeout?: number
    verbose?: boolean
    acceptJson?: boolean
  }
): Promise<FetchResult> {
  const domain = getDomain(url)
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT_MS

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await rateLimitDelay(domain)

    if (options?.verbose) {
      logger.info('Fetching', { url, attempt: attempt + 1 })
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const headers: Record<string, string> = {
        'User-Agent': USER_AGENT,
      }
      if (options?.acceptJson) {
        headers['Accept'] = 'application/json'
      }

      const response = await fetch(url, {
        headers,
        signal: controller.signal,
        redirect: 'follow',
      })

      clearTimeout(timeoutId)

      const body = await response.text()

      // Convert headers to a plain object (lowercase keys)
      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key.toLowerCase()] = value
      })

      return {
        ok: response.ok,
        status: response.status,
        headers: responseHeaders,
        body,
        url: response.url, // Final URL after redirects
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))

      if (options?.verbose) {
        logger.warn('Fetch failed, retrying', {
          url,
          attempt: attempt + 1,
          error: lastError.message,
        })
      }

      // Don't retry on abort (timeout)
      if (lastError.name === 'AbortError') {
        break
      }
    }
  }

  return {
    ok: false,
    status: 0,
    headers: {},
    body: '',
    url,
  }
}

/**
 * Fetch and parse robots.txt for a domain.
 * Returns an array of disallowed path prefixes for User-agent: *.
 */
export async function fetchRobotsTxt(baseUrl: string): Promise<string[]> {
  const domain = getDomain(baseUrl)
  if (robotsCache.has(domain)) {
    return robotsCache.get(domain)!
  }

  try {
    const robotsUrl = new URL('/robots.txt', baseUrl).href
    const result = await fetchPage(robotsUrl, { timeout: 5_000 })

    if (!result.ok) {
      robotsCache.set(domain, [])
      return []
    }

    const disallowPaths = parseRobotsTxt(result.body)
    robotsCache.set(domain, disallowPaths)
    return disallowPaths
  } catch {
    robotsCache.set(domain, [])
    return []
  }
}

/**
 * Parse robots.txt content and extract Disallow paths for User-agent: *.
 */
export function parseRobotsTxt(content: string): string[] {
  const lines = content.split('\n')
  const disallowed: string[] = []
  let inWildcardBlock = false

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (line.toLowerCase().startsWith('user-agent:')) {
      const agent = line.substring('user-agent:'.length).trim()
      inWildcardBlock = agent === '*'
      continue
    }

    if (inWildcardBlock && line.toLowerCase().startsWith('disallow:')) {
      const path = line.substring('disallow:'.length).trim()
      if (path) {
        disallowed.push(path)
      }
    }

    // End of block on blank line
    if (line === '' && inWildcardBlock) {
      // Don't reset — some robots.txt have empty lines within blocks
    }
  }

  return disallowed
}

/**
 * Check if a URL is allowed by robots.txt rules.
 */
export function isAllowedByRobots(url: string, disallowPaths: string[]): boolean {
  try {
    const pathname = new URL(url).pathname
    return !disallowPaths.some((prefix) => pathname.startsWith(prefix))
  } catch {
    return true
  }
}

/**
 * Create a new empty ScrapedArtistData template.
 */
export function createEmptyScrapedData(websiteUrl: string, instagramUrl?: string) {
  const { ScrapedArtistData } = {} as { ScrapedArtistData: never } // type-only import workaround
  void ScrapedArtistData

  return {
    scrapedAt: new Date().toISOString(),
    sourceUrls: [] as string[],
    platform: null as string | null,
    name: null,
    bio: null,
    artistStatement: null,
    location: null,
    email: null,
    websiteUrl,
    instagramUrl: instagramUrl ?? null,
    otherSocialLinks: [],
    profileImages: [],
    coverImages: [],
    processImages: [],
    cvEntries: [],
    listings: [],
    suggestedCategories: null,
    errors: [] as Array<{ url: string; error: string }>,
    warnings: [] as string[],
  }
}
