/**
 * Detect which website platform an artist's site runs on.
 *
 * The detector fetches the target URL once and examines HTTP headers
 * and HTML content for platform fingerprints, then routes to the
 * appropriate scraper implementation.
 */

import type { DetectedPlatform } from '../types.js'

/**
 * Detect the platform from HTTP response headers and HTML body.
 *
 * @param headers - Response headers from the initial fetch
 * @param html - HTML body content
 * @param url - The URL that was fetched
 * @returns Detected platform with hints
 */
export function detectPlatform(
  headers: Record<string, string>,
  html: string,
  url: string
): DetectedPlatform {
  // Squarespace: "X-ServedBy: squarespace" or HTML fingerprints
  if (isSquarespace(headers, html)) {
    const hints: Record<string, string> = {}
    const siteIdMatch = html.match(/SQUARESPACE_CONTEXT\s*=\s*\{[^}]*"websiteId"\s*:\s*"([^"]+)"/)
    if (siteIdMatch?.[1]) {
      hints.siteId = siteIdMatch[1]
    }
    return { platform: 'squarespace', hints }
  }

  // Cargo: domain or meta tags
  if (isCargo(url, html)) {
    return { platform: 'cargo', hints: {} }
  }

  // WordPress: headers or HTML patterns
  if (isWordPress(headers, html)) {
    return { platform: 'wordpress', hints: {} }
  }

  // Shopify: HTML patterns
  if (isShopify(html)) {
    return { platform: 'shopify', hints: {} }
  }

  return { platform: 'generic', hints: {} }
}

function isSquarespace(headers: Record<string, string>, html: string): boolean {
  // Header check
  const servedBy = headers['x-servedby'] || headers['X-ServedBy'] || ''
  if (servedBy.toLowerCase().includes('squarespace')) return true

  const server = headers['server'] || headers['Server'] || ''
  if (server.toLowerCase().includes('squarespace')) return true

  // HTML checks
  if (html.includes('Static.SQUARESPACE_CONTEXT')) return true
  if (/["']https?:\/\/[^"']*\.squarespace-cdn\.com\b/.test(html)) return true
  if (html.includes('<!-- This is Squarespace.')) return true

  return false
}

function isCargo(url: string, html: string): boolean {
  try {
    const hostname = new URL(url).hostname
    if (hostname.endsWith('.cargo.site')) return true
  } catch {
    // Ignore parse errors
  }

  if (html.includes('Cargo Collective')) return true
  if (/["']https?:\/\/[^"']*\.cargo\.site\b/.test(html)) return true
  if (/["']https?:\/\/[^"']*\.cargocollective\.com\b/.test(html)) return true

  return false
}

function isWordPress(headers: Record<string, string>, html: string): boolean {
  const powered = headers['x-powered-by'] || headers['X-Powered-By'] || ''
  if (powered.toLowerCase().includes('wordpress')) return true

  if (html.includes('/wp-content/')) return true
  if (html.includes('/wp-includes/')) return true
  if (html.includes('wp-json')) return true
  if (/<meta[^>]+name=["']generator["'][^>]+content=["']WordPress/i.test(html)) return true

  return false
}

function isShopify(html: string): boolean {
  if (html.includes('Shopify.theme')) return true
  if (/["']https?:\/\/cdn\.shopify\.com\b/.test(html)) return true
  if (/["']https?:\/\/[^"']*\.myshopify\.com\b/.test(html)) return true
  return false
}
