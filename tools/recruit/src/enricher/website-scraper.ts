/**
 * Website scraper for the pipeline enricher.
 *
 * Fetches an artist's website and extracts social media links
 * and contact information using Cheerio.
 */

import * as cheerio from 'cheerio'
import type { HttpClient } from '../shared/http-client.js'
import { normalizeInstagramUrl } from './enricher-lib.js'

export interface EnrichmentResult {
  instagram: string | null
  otherSocialLinks: Array<{ platform: string; url: string }>
}

const SOCIAL_PATTERNS: Array<{ platform: string; pattern: RegExp }> = [
  { platform: 'instagram', pattern: /instagram\.com/i },
  { platform: 'facebook', pattern: /facebook\.com/i },
  { platform: 'twitter', pattern: /twitter\.com|x\.com/i },
  { platform: 'tiktok', pattern: /tiktok\.com/i },
  { platform: 'youtube', pattern: /youtube\.com/i },
  { platform: 'pinterest', pattern: /pinterest\.com/i },
  { platform: 'linkedin', pattern: /linkedin\.com/i },
]

/**
 * Scrape an artist's website for social media links.
 */
export async function scrapeArtistWebsite(
  url: string,
  httpClient: HttpClient
): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {
    instagram: null,
    otherSocialLinks: [],
  }

  const response = await httpClient.get(url)
  if (!response.ok) {
    return result
  }

  const $ = cheerio.load(response.body)
  const seenPlatforms = new Set<string>()

  // Extract all links from the page
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href) return

    for (const { platform, pattern } of SOCIAL_PATTERNS) {
      if (pattern.test(href) && !seenPlatforms.has(platform)) {
        seenPlatforms.add(platform)

        if (platform === 'instagram') {
          result.instagram = normalizeInstagramUrl(href)
        } else {
          result.otherSocialLinks.push({ platform, url: href })
        }
      }
    }
  })

  return result
}
