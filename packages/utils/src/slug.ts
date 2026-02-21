/**
 * Slug generation utilities
 */

/**
 * Generate a URL-safe slug from a string
 * @param input - Input string (e.g., artist name or studio name)
 * @returns URL-safe slug
 */
export function generateSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove non-alphanumeric characters except hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Replace multiple hyphens with single hyphen
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-|-$/g, '')
}

/**
 * Validate that a slug is URL-safe
 * @param slug - Slug to validate
 * @returns true if slug is valid
 */
export function validateSlug(slug: string): boolean {
  // Only lowercase letters, numbers, and hyphens
  // Cannot start or end with hyphen
  // Cannot have consecutive hyphens
  const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/
  return slugRegex.test(slug) && slug.length >= 2 && slug.length <= 50
}
