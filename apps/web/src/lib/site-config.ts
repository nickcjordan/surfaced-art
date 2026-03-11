/**
 * Canonical site URL. Driven by NEXT_PUBLIC_SITE_URL so prod, dev, and
 * preview environments each get the correct domain without code changes.
 * Falls back to production URL for local builds.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://surfaced.art'
