/**
 * Shared cheerio HTML parsing helpers.
 *
 * Provides common extraction patterns used across all scraper implementations.
 */

import * as cheerio from 'cheerio'
import type { ScrapedImage, ImageContext, SocialLink } from '../types.js'
import { resolveUrl, detectSocialPlatform, classifyNavLink, type NavLink } from './url.js'

/** Minimum image width to consider (filters out icons and UI elements). */
const MIN_IMAGE_WIDTH = 200

/**
 * Load HTML into a cheerio instance.
 */
export function loadHtml(html: string): cheerio.CheerioAPI {
  return cheerio.load(html)
}

/**
 * Extract all images from the page that meet quality thresholds.
 */
export function extractImages(
  $: cheerio.CheerioAPI,
  pageUrl: string,
  context: ImageContext = 'unknown'
): ScrapedImage[] {
  const images: ScrapedImage[] = []
  const seen = new Set<string>()

  $('img').each((_i, el) => {
    const $img = $(el)

    // Try srcset first (for responsive images), then src
    const src = $img.attr('src')
    const srcset = $img.attr('srcset') || $img.attr('data-srcset')
    const dataSrc = $img.attr('data-src') || $img.attr('data-lazy-src')

    const rawUrl = src || dataSrc
    if (!rawUrl) return

    // Skip data URIs and tiny inline images
    if (rawUrl.startsWith('data:')) return

    // Check width attribute (if available) to filter small images
    const widthAttr = $img.attr('width')
    if (widthAttr) {
      const w = parseInt(widthAttr, 10)
      if (!isNaN(w) && w < MIN_IMAGE_WIDTH) return
    }

    const resolved = resolveUrl(rawUrl, pageUrl)
    if (!resolved) return

    // Deduplicate by URL
    if (seen.has(resolved)) return
    seen.add(resolved)

    // If srcset available, try to get the largest variant
    let bestUrl = resolved
    if (srcset) {
      const largest = getLargestFromSrcset(srcset, pageUrl)
      if (largest) bestUrl = largest
    }

    images.push({
      url: bestUrl,
      alt: $img.attr('alt')?.trim() || null,
      context,
      sourcePageUrl: pageUrl,
    })
  })

  return images
}

/**
 * Parse a srcset attribute and return the URL of the largest image.
 */
function getLargestFromSrcset(srcset: string, baseUrl: string): string | null {
  const candidates = srcset
    .split(',')
    .map((entry) => {
      const parts = entry.trim().split(/\s+/)
      const url = parts[0]
      const descriptor = parts[1] || ''
      // Parse width descriptor like "800w"
      const widthMatch = descriptor.match(/^(\d+)w$/)
      const width = widthMatch ? parseInt(widthMatch[1]!, 10) : 0
      return { url, width }
    })
    .filter((c) => c.url)

  if (candidates.length === 0) return null

  // Sort by width descending and take the largest
  candidates.sort((a, b) => b.width - a.width)
  const best = candidates[0]!
  return best.url ? resolveUrl(best.url, baseUrl) : null
}

/**
 * Extract navigation links from the page and classify them.
 */
export function extractNavLinks($: cheerio.CheerioAPI, baseUrl: string): NavLink[] {
  const links: NavLink[] = []
  const seen = new Set<string>()

  // Look in nav elements, headers, and common nav class patterns
  const selectors = [
    'nav a',
    'header a',
    '[role="navigation"] a',
    '.nav a',
    '.navigation a',
    '.menu a',
    '.main-nav a',
    '.site-nav a',
  ]

  for (const selector of selectors) {
    $(selector).each((_i, el) => {
      const $a = $(el)
      const href = $a.attr('href')
      const text = $a.text().trim()

      if (!href || !text) return
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return

      const resolved = resolveUrl(href, baseUrl)
      if (!resolved || seen.has(resolved)) return
      seen.add(resolved)

      const classified = classifyNavLink(text, resolved)
      if (classified) {
        links.push({ ...classified, url: resolved })
      }
    })
  }

  // Sort by priority (lower = more important)
  return links.sort((a, b) => a.priority - b.priority)
}

/**
 * Extract social media links from the page.
 */
export function extractSocialLinks($: cheerio.CheerioAPI, baseUrl: string): SocialLink[] {
  const links: SocialLink[] = []
  const seen = new Set<string>()

  $('a[href]').each((_i, el) => {
    const href = $(el).attr('href')
    if (!href) return

    const resolved = resolveUrl(href, baseUrl)
    if (!resolved) return

    const platform = detectSocialPlatform(resolved)
    if (!platform || seen.has(platform)) return
    seen.add(platform)

    links.push({ platform, url: resolved })
  })

  return links
}

/**
 * Extract the longest paragraph from a page, often the artist bio.
 */
export function extractLongestParagraph($: cheerio.CheerioAPI): string | null {
  let longest = ''

  $('p').each((_i, el) => {
    const text = $(el).text().trim()
    if (text.length > longest.length) {
      longest = text
    }
  })

  // Must be at least 50 chars to be considered a real paragraph
  return longest.length >= 50 ? longest : null
}

/**
 * Extract email addresses from the page.
 */
export function extractEmails($: cheerio.CheerioAPI): string[] {
  const emails = new Set<string>()

  // From mailto links
  $('a[href^="mailto:"]').each((_i, el) => {
    const href = $(el).attr('href')
    if (!href) return
    const email = href.replace('mailto:', '').split('?')[0]?.trim().toLowerCase()
    if (email) emails.add(email)
  })

  // From text content (simple regex)
  const bodyText = $('body').text()
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  let match: RegExpExecArray | null
  while ((match = emailRegex.exec(bodyText)) !== null) {
    emails.add(match[0].toLowerCase())
  }

  return [...emails]
}
