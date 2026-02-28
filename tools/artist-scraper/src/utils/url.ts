/**
 * URL normalization and link extraction utilities.
 */

/**
 * Normalize a URL by ensuring it has a protocol and removing trailing slashes.
 */
export function normalizeUrl(raw: string): string {
  let url = raw.trim()
  if (!url) return url

  // Add https:// if no protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`
  }

  // Remove trailing slash (but not for root path)
  try {
    const parsed = new URL(url)
    if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1)
    }
    return parsed.href
  } catch {
    return url
  }
}

/**
 * Extract the domain from a URL (without www prefix).
 */
export function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(normalizeUrl(url))
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

/**
 * Create a URL-safe slug from a string.
 * "Abbey Peters" → "abbey-peters"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

/**
 * Resolve a potentially relative URL against a base URL.
 */
export function resolveUrl(href: string, baseUrl: string): string | null {
  try {
    return new URL(href, baseUrl).href
  } catch {
    return null
  }
}

/**
 * Check if a URL is on the same domain as the base URL.
 */
export function isSameDomain(url: string, baseUrl: string): boolean {
  const urlDomain = extractDomain(url)
  const baseDomain = extractDomain(baseUrl)
  if (!urlDomain || !baseDomain) return false
  return urlDomain === baseDomain
}

/** Social platform patterns for link detection. */
const SOCIAL_PATTERNS: Array<{ platform: string; pattern: RegExp }> = [
  { platform: 'instagram', pattern: /instagram\.com\/[^/?#]+/i },
  { platform: 'twitter', pattern: /(?:twitter|x)\.com\/[^/?#]+/i },
  { platform: 'facebook', pattern: /facebook\.com\/[^/?#]+/i },
  { platform: 'tiktok', pattern: /tiktok\.com\/@[^/?#]+/i },
  { platform: 'youtube', pattern: /youtube\.com\/(?:@|channel\/|c\/)[^/?#]+/i },
  { platform: 'pinterest', pattern: /pinterest\.com\/[^/?#]+/i },
  { platform: 'linkedin', pattern: /linkedin\.com\/in\/[^/?#]+/i },
  { platform: 'etsy', pattern: /etsy\.com\/shop\/[^/?#]+/i },
]

/**
 * Detect the social platform of a URL, or null if not a known social link.
 */
export function detectSocialPlatform(url: string): string | null {
  for (const { platform, pattern } of SOCIAL_PATTERNS) {
    if (pattern.test(url)) {
      return platform
    }
  }
  return null
}

/** Patterns that match navigation pages worth visiting. */
const NAV_PAGE_PATTERNS: Array<{ label: RegExp; priority: number; hint: string }> = [
  { label: /\b(about|bio|artist)\b/i, priority: 1, hint: 'about' },
  { label: /\b(cv|resume|curriculum|vitae)\b/i, priority: 1, hint: 'cv' },
  { label: /\b(shop|store|buy|available|purchase)\b/i, priority: 1, hint: 'shop' },
  { label: /\b(work|portfolio|gallery|pieces|collection)\b/i, priority: 2, hint: 'work' },
  { label: /\b(process|studio|making)\b/i, priority: 2, hint: 'process' },
  { label: /\b(contact|info)\b/i, priority: 3, hint: 'contact' },
  { label: /\b(press|publications|media)\b/i, priority: 3, hint: 'press' },
  { label: /\b(exhibitions?|shows?)\b/i, priority: 3, hint: 'exhibitions' },
]

/** Result of classifying a navigation link. */
export interface NavLink {
  url: string
  text: string
  hint: string
  priority: number
}

/**
 * Classify a navigation link by its text content.
 * Returns null if the link doesn't match any interesting page pattern.
 */
export function classifyNavLink(text: string, url: string): NavLink | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  for (const { label, priority, hint } of NAV_PAGE_PATTERNS) {
    if (label.test(trimmed) || label.test(url)) {
      return { url, text: trimmed, hint, priority }
    }
  }
  return null
}
