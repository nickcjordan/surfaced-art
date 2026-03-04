/**
 * CDN helper functions for seed image URLs.
 *
 * Extracted from seed-data.ts to support a modular file layout.
 */

// CloudFront CDN base URL for seed images.
// In deployed environments, SEED_CDN_BASE is set by Terraform to the
// per-environment CloudFront distribution. Falls back to prod for local dev.
export const CDN_BASE = process.env.SEED_CDN_BASE?.trim() || 'https://dmfu4c7s6z2cc.cloudfront.net'

/** Default display width — largest variant the image processor generates. */
export const CDN_DEFAULT_WIDTH = 1200

/**
 * Builds a CDN URL for an image processor variant.
 *
 * @param s3KeyBase - S3 key without extension, e.g.
 *   'uploads/seed/artists/abbey-peters/cover'
 * @param width - Target width variant (default CDN_DEFAULT_WIDTH)
 */
export function cdnUrl(s3KeyBase: string, width: number = CDN_DEFAULT_WIDTH): string {
  return `${CDN_BASE}/${s3KeyBase}/${width}w.webp`
}

/**
 * Builds the S3 key base for a seed artist asset.
 * All seed images live under `uploads/seed/artists/{slug}/...`.
 */
export function seedKey(slug: string, path: string): string {
  return `uploads/seed/artists/${slug}/${path}`
}
