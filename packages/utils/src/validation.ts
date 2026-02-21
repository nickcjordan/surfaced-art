/**
 * Validation utilities
 */

/**
 * Validate email address format
 * @param email - Email address to validate
 * @returns true if valid email format
 */
export function validateEmail(email: string): boolean {
  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate that a rating is between 1 and 5
 * @param rating - Rating value to validate
 * @returns true if rating is valid (1-5)
 */
export function validateRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5
}

/**
 * Validate UUID format
 * @param id - String to validate as UUID
 * @returns true if valid UUID format
 */
export function validateUuid(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * Validate US zip code format
 * @param zip - Zip code to validate
 * @returns true if valid US zip code (5 digits or 5+4 format)
 */
export function validateZipCode(zip: string): boolean {
  const zipRegex = /^\d{5}(-\d{4})?$/
  return zipRegex.test(zip)
}

/**
 * Validate that a quantity is non-negative
 * @param quantity - Quantity to validate
 * @returns true if quantity >= 0
 */
export function validateQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity >= 0
}

/**
 * Validate that a price is positive (in cents)
 * @param priceCents - Price in cents to validate
 * @returns true if price > 0
 */
export function validatePrice(priceCents: number): boolean {
  return Number.isInteger(priceCents) && priceCents > 0
}
