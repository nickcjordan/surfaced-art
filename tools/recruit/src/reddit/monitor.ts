/**
 * Reddit keyword monitor orchestrator.
 *
 * Fetches posts from specified subreddits, filters by keywords/age/score,
 * deduplicates, and formats for console output.
 */

import type { HttpClient } from '../shared/http-client.js'
import type { RedditPost, OutputFormat } from '../shared/types.js'
import { formatOutput } from '../shared/output-formatter.js'
import {
  parseRedditListing,
  filterByKeywords,
  filterByAge,
  filterByScore,
  deduplicatePosts,
  buildSearchUrl,
  extractSnippet,
} from './reddit-lib.js'

export interface MonitorOptions {
  subreddits: string[]
  keywords: string[]
  maxAgeDays: number
  minScore: number
  limit: number
  outputFormat: OutputFormat
  verbose: boolean
}

export interface MonitorResult {
  posts: RedditPost[]
  subredditsSearched: number
  subredditsSkipped: number
}

function daysToTimeframe(days: number): string {
  if (days <= 1) return 'day'
  if (days <= 7) return 'week'
  if (days <= 30) return 'month'
  if (days <= 365) return 'year'
  return 'all'
}

export async function runMonitor(
  httpClient: HttpClient,
  options: MonitorOptions
): Promise<MonitorResult> {
  const allPosts: RedditPost[] = []
  let subredditsSkipped = 0

  for (const subreddit of options.subreddits) {
    const url = buildSearchUrl(
      subreddit,
      options.keywords,
      daysToTimeframe(options.maxAgeDays),
      options.limit
    )

    if (options.verbose) {
      console.warn(`Searching r/${subreddit}...`)
    }

    try {
      const result = await httpClient.get(url)

      if (!result.ok) {
        if (result.status === 429) {
          console.warn(`  Rate limited on r/${subreddit}, skipping`)
          subredditsSkipped++
          continue
        }
        if (result.status === 403) {
          console.warn(`  r/${subreddit} may be private or restricted (403)`)
          subredditsSkipped++
          continue
        }
        console.warn(`  r/${subreddit} returned HTTP ${result.status}, skipping`)
        subredditsSkipped++
        continue
      }

      let json: unknown
      try {
        json = JSON.parse(result.body)
      } catch {
        console.warn(`  r/${subreddit} returned invalid JSON, skipping`)
        subredditsSkipped++
        continue
      }

      const posts = parseRedditListing(json)
      if (options.verbose) {
        console.warn(`  Found ${posts.length} post(s) in r/${subreddit}`)
      }
      allPosts.push(...posts)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.warn(`  Error fetching r/${subreddit}: ${message}`)
      subredditsSkipped++
    }
  }

  // Apply filters
  let filtered = filterByKeywords(allPosts, options.keywords)
  filtered = filterByAge(filtered, options.maxAgeDays)
  filtered = filterByScore(filtered, options.minScore)
  filtered = deduplicatePosts(filtered)

  // Sort by score descending
  filtered.sort((a, b) => b.score - a.score)

  return {
    posts: filtered,
    subredditsSearched: options.subreddits.length - subredditsSkipped,
    subredditsSkipped,
  }
}

/**
 * Format monitor results for console output.
 */
export function formatMonitorResults(
  result: MonitorResult,
  keywords: string[],
  outputFormat: OutputFormat
): string {
  if (result.posts.length === 0) {
    return 'No matching posts found.'
  }

  // For table/csv, include a snippet column
  const enriched = result.posts.map((post) => ({
    subreddit: `r/${post.subreddit}`,
    score: post.score,
    title: post.title,
    author: `u/${post.author}`,
    comments: post.numComments,
    snippet: extractSnippet(post.selftext, keywords, 120),
    url: `https://reddit.com${post.permalink}`,
    date: new Date(post.createdUtc * 1000).toISOString().slice(0, 10),
  }))

  return formatOutput(
    enriched,
    [
      { key: 'subreddit', header: 'Subreddit', width: 16 },
      { key: 'score', header: 'Score', width: 6 },
      { key: 'title', header: 'Title', width: 50 },
      { key: 'author', header: 'Author', width: 20 },
      { key: 'date', header: 'Date', width: 10 },
      { key: 'comments', header: 'Comments', width: 8 },
    ],
    outputFormat
  )
}
