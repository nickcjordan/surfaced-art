/**
 * Canonical site URL. Driven by NEXT_PUBLIC_SITE_URL so prod, dev, and
 * preview environments each get the correct domain without code changes.
 * Build fails immediately if the var is absent — no silent wrong defaults.
 */
if (!process.env.NEXT_PUBLIC_SITE_URL) {
  throw new Error('NEXT_PUBLIC_SITE_URL is required')
}
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL
