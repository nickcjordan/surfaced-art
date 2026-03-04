/**
 * Pure functions for the Reddit keyword monitor.
 * No side effects — all functions are testable without mocking.
 */

import type { RedditPost } from '../shared/types.js'

// ---------------------------------------------------------------------------
// Default configuration
// ---------------------------------------------------------------------------

export const DEFAULT_SUBREDDITS = [
  'artbusiness',
  'artstore',
  'etsysellers',
  'crafts',
  'pottery',
  'ceramics',
  'jewelry',
]

export const DEFAULT_KEYWORDS = [
  'leaving Etsy',
  'Etsy alternative',
  'where to sell art',
  'curated platform',
  'art marketplace',
  'handmade marketplace',
  'sell my art online',
  'artist platform',
  'selling handmade',
  'frustrated with Etsy',
]

// ---------------------------------------------------------------------------
// Reddit JSON parsing
// ---------------------------------------------------------------------------

interface RedditListingChild {
  kind: string
  data: {
    title?: string
    author?: string
    subreddit?: string
    url?: string
    permalink?: string
    score?: number
    created_utc?: number
    selftext?: string
    num_comments?: number
  }
}

interface RedditListingResponse {
  kind: string
  data: {
    children: RedditListingChild[]
    after?: string | null
  }
}

/**
 * Parse Reddit's JSON listing format into typed RedditPost[].
 * Handles both search and subreddit listing responses.
 */
export function parseRedditListing(json: unknown): RedditPost[] {
  const response = json as RedditListingResponse
  if (!response?.data?.children || !Array.isArray(response.data.children)) {
    return []
  }

  return response.data.children
    .filter((child) => child.kind === 't3') // t3 = link/post
    .map((child) => ({
      title: child.data.title ?? '',
      author: child.data.author ?? '[deleted]',
      subreddit: child.data.subreddit ?? '',
      url: child.data.url ?? '',
      permalink: child.data.permalink ?? '',
      score: child.data.score ?? 0,
      createdUtc: child.data.created_utc ?? 0,
      selftext: child.data.selftext ?? '',
      numComments: child.data.num_comments ?? 0,
    }))
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

/**
 * Filter posts by keyword match in title or selftext (case-insensitive).
 */
export function filterByKeywords(
  posts: RedditPost[],
  keywords: string[]
): RedditPost[] {
  const lowerKeywords = keywords.map((k) => k.toLowerCase())
  return posts.filter((post) => {
    const text = `${post.title} ${post.selftext}`.toLowerCase()
    return lowerKeywords.some((kw) => text.includes(kw))
  })
}

/**
 * Filter posts by age — only posts within the last `maxAgeDays` days.
 */
export function filterByAge(
  posts: RedditPost[],
  maxAgeDays: number,
  nowUnix?: number
): RedditPost[] {
  const now = nowUnix ?? Math.floor(Date.now() / 1000)
  const cutoff = now - maxAgeDays * 86400
  return posts.filter((post) => post.createdUtc >= cutoff)
}

/**
 * Filter posts by minimum score.
 */
export function filterByScore(
  posts: RedditPost[],
  minScore: number
): RedditPost[] {
  return posts.filter((post) => post.score >= minScore)
}

/**
 * Deduplicate posts by permalink.
 */
export function deduplicatePosts(posts: RedditPost[]): RedditPost[] {
  const seen = new Set<string>()
  return posts.filter((post) => {
    if (seen.has(post.permalink)) return false
    seen.add(post.permalink)
    return true
  })
}

// ---------------------------------------------------------------------------
// URL building
// ---------------------------------------------------------------------------

/**
 * Build a Reddit search URL for a subreddit.
 *
 * @param subreddit - Subreddit name (without r/)
 * @param keywords - Keywords to search for (joined with OR)
 * @param timeframe - Reddit time filter: hour, day, week, month, year, all
 * @param limit - Max results (1-100)
 */
export function buildSearchUrl(
  subreddit: string,
  keywords: string[],
  timeframe: string,
  limit: number
): string {
  const query = keywords.map((k) => `"${k}"`).join(' OR ')
  const params = new URLSearchParams({
    q: query,
    sort: 'new',
    restrict_sr: 'on',
    t: timeframe,
    limit: String(Math.min(limit, 100)),
  })
  return `https://www.reddit.com/r/${subreddit}/search.json?${params.toString()}`
}

// ---------------------------------------------------------------------------
// Snippet extraction
// ---------------------------------------------------------------------------

/**
 * Extract a relevant snippet from the post body around the first keyword match.
 */
export function extractSnippet(
  selftext: string,
  keywords: string[],
  maxLength: number = 200
): string {
  if (!selftext) return ''

  const lowerText = selftext.toLowerCase()

  // Find the first keyword match position
  let matchPos = -1
  for (const kw of keywords) {
    const pos = lowerText.indexOf(kw.toLowerCase())
    if (pos !== -1 && (matchPos === -1 || pos < matchPos)) {
      matchPos = pos
    }
  }

  if (matchPos === -1) {
    // No match in selftext — return the beginning
    return selftext.length <= maxLength
      ? selftext
      : selftext.slice(0, maxLength) + '...'
  }

  // Center the snippet around the match
  const halfLen = Math.floor(maxLength / 2)
  let start = Math.max(0, matchPos - halfLen)
  let end = Math.min(selftext.length, matchPos + halfLen)

  // Adjust if near boundaries
  if (start === 0) end = Math.min(selftext.length, maxLength)
  if (end === selftext.length) start = Math.max(0, end - maxLength)

  let snippet = selftext.slice(start, end)
  if (start > 0) snippet = '...' + snippet
  if (end < selftext.length) snippet = snippet + '...'

  // Clean up newlines for single-line display
  return snippet.replace(/\n+/g, ' ').trim()
}
