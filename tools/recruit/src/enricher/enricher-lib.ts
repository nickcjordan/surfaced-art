/**
 * Pure functions for the Notion pipeline enricher.
 * No side effects — all functions are testable without mocking.
 */

import type { PipelineEntry } from '../shared/types.js'

// ---------------------------------------------------------------------------
// Instagram URL normalization
// ---------------------------------------------------------------------------

/**
 * Validate and normalize an Instagram URL.
 * Returns null if the URL is not a valid Instagram profile link.
 */
export function normalizeInstagramUrl(raw: string): string | null {
  if (!raw) return null

  const trimmed = raw.trim()

  // Handle various Instagram URL formats
  const patterns = [
    /^https?:\/\/(www\.)?instagram\.com\/([a-zA-Z0-9_.]+)\/?/,
  ]

  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match?.[2]) {
      const username = match[2]
      // Exclude non-profile pages
      if (['p', 'reel', 'explore', 'accounts', 'about', 'legal'].includes(username)) {
        return null
      }
      return `https://instagram.com/${username}`
    }
  }

  // Handle bare username format (@username or just username)
  const usernameMatch = trimmed.match(/^@?([a-zA-Z0-9_.]{1,30})$/)
  if (usernameMatch?.[1]) {
    return `https://instagram.com/${usernameMatch[1]}`
  }

  return null
}

// ---------------------------------------------------------------------------
// Website validation
// ---------------------------------------------------------------------------

/** Domains that are NOT personal artist websites. */
const NON_WEBSITE_DOMAINS = [
  'instagram.com',
  'facebook.com',
  'twitter.com',
  'x.com',
  'tiktok.com',
  'youtube.com',
  'pinterest.com',
  'etsy.com',
  'amazon.com',
  'linkedin.com',
  'tumblr.com',
  'behance.net',
  'dribbble.com',
  'deviantart.com',
  'artstation.com',
  'society6.com',
  'redbubble.com',
  'saatchiart.com',
  'artsy.net',
]

/**
 * Check if a URL looks like a valid artist website (not social media or a marketplace).
 */
export function isLikelyArtistWebsite(url: string): boolean {
  if (!url) return false

  try {
    const hostname = new URL(url).hostname.toLowerCase()
    return !NON_WEBSITE_DOMAINS.some((d) => hostname.includes(d))
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Missing field detection
// ---------------------------------------------------------------------------

/**
 * Determine which enrichable fields are missing on a pipeline entry.
 */
export function findMissingFields(entry: PipelineEntry): string[] {
  const missing: string[] = []
  if (!entry.instagram) missing.push('instagram')
  if (!entry.website) missing.push('website')
  return missing
}

/**
 * Determine if an entry can be enriched (has at least one field to work from).
 */
export function canEnrich(entry: PipelineEntry): boolean {
  const missing = findMissingFields(entry)
  if (missing.length === 0) return false // Nothing to enrich

  // We can only enrich if the entry has a website (we scrape website → Instagram)
  return !!entry.website
}
