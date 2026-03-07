/**
 * Pure functions for the art fair roster scraper.
 * No side effects — all functions are testable without mocking.
 */

import type { ArtistLead } from '../shared/types.js'

// ---------------------------------------------------------------------------
// Category keyword mapping
// ---------------------------------------------------------------------------

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Ceramics: ['ceramic', 'pottery', 'porcelain', 'stoneware', 'earthenware', 'clay', 'raku'],
  Painting: ['painting', 'painter', 'oil paint', 'acrylic', 'watercolor', 'gouache', 'encaustic'],
  Print: ['printmaking', 'printmaker', 'linocut', 'screenprint', 'woodcut', 'etching', 'lithograph', 'monoprint', 'intaglio'],
  Jewelry: ['jewelry', 'jeweler', 'metalsmith', 'silversmith', 'goldsmith', 'metalwork'],
  Illustration: ['illustration', 'illustrator'],
  Photography: ['photography', 'photographer', 'photo', 'fine art photo'],
  Woodworking: ['woodworking', 'woodwork', 'woodturning', 'woodcarving', 'wood sculpture', 'furniture maker'],
  Fibers: ['fiber', 'fibre', 'textile', 'weaving', 'weaver', 'macrame', 'knit', 'crochet', 'quilting'],
  'Mixed Media': ['mixed media', 'assemblage', 'collage', 'glass', 'glassblowing', 'leather', 'sculpture', 'mosaic'],
}

// ---------------------------------------------------------------------------
// Name normalization
// ---------------------------------------------------------------------------

/**
 * Normalize an artist name for deduplication and display.
 * - Trims whitespace
 * - Collapses multiple spaces
 * - Converts to title case
 */
export function normalizeArtistName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .replace(
      /\w\S*/g,
      (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
}

// ---------------------------------------------------------------------------
// Category guessing
// ---------------------------------------------------------------------------

/**
 * Guess a Surfaced Art category from medium/description text.
 * Returns null if no match is found.
 */
export function guessCategory(mediumText: string): string | null {
  if (!mediumText) return null
  const lower = mediumText.toLowerCase()

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Deduplication
// ---------------------------------------------------------------------------

/**
 * Deduplicate leads by normalized name.
 * Keeps the first occurrence (which may have more data).
 */
export function deduplicateLeads(leads: ArtistLead[]): ArtistLead[] {
  const seen = new Set<string>()
  return leads.filter((lead) => {
    const key = lead.name.toLowerCase().trim()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ---------------------------------------------------------------------------
// Link extraction
// ---------------------------------------------------------------------------

/**
 * Find an artist's personal website URL from a list of hrefs.
 * Excludes the fair's own domain, social media, and marketplace sites.
 */
export function findArtistWebsite(
  hrefs: string[],
  fairDomain: string
): string | null {
  const excludedDomains = [
    fairDomain.toLowerCase(),
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
  ]

  for (const href of hrefs) {
    const lower = href.toLowerCase()
    if (!lower.startsWith('http')) continue

    try {
      const url = new URL(href)
      const hostname = url.hostname.toLowerCase()
      const isExcluded = excludedDomains.some(
        (domain) => hostname === domain || hostname.endsWith('.' + domain)
      )
      if (isExcluded) continue
      return href
    } catch {
      // Not a valid URL, skip
    }
  }

  return null
}

/**
 * Find an Instagram URL from a list of hrefs.
 */
export function findInstagramUrl(hrefs: string[]): string | null {
  for (const href of hrefs) {
    try {
      const url = new URL(href)
      if (
        url.hostname === 'instagram.com' ||
        url.hostname.endsWith('.instagram.com')
      ) {
        return href
      }
    } catch {
      // Not a valid URL, skip
    }
  }
  return null
}
