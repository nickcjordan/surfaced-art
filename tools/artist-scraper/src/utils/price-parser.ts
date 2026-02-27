/**
 * Parse price strings from artist websites into integer cents.
 *
 * Handles formats like "$125.00", "125", "$1,250.00", "USD 125", etc.
 * Returns null for unparseable strings or sold-out indicators.
 */

/** Words/phrases that indicate a sold-out item (case-insensitive). */
const SOLD_PATTERNS = [
  'sold',
  'sold out',
  'soldout',
  'unavailable',
  'no longer available',
]

export interface PriceParseResult {
  /** Price in cents, or null if not parseable. */
  cents: number | null
  /** Whether the price string indicates sold out. */
  isSoldOut: boolean
}

/**
 * Parse a price string into cents.
 *
 * @param raw - Raw price string from a webpage (e.g. "$125.00", "125", "Sold")
 * @returns Object with cents (null if unparseable) and isSoldOut flag
 */
export function parsePrice(raw: string): PriceParseResult {
  if (!raw || typeof raw !== 'string') {
    return { cents: null, isSoldOut: false }
  }

  const trimmed = raw.trim()
  if (!trimmed) {
    return { cents: null, isSoldOut: false }
  }

  // Check for sold-out indicators
  const lower = trimmed.toLowerCase()
  if (SOLD_PATTERNS.some((p) => lower.includes(p))) {
    return { cents: null, isSoldOut: true }
  }

  // Remove currency symbols, codes, and whitespace
  // Handles: $, €, £, USD, EUR, GBP, etc.
  let cleaned = trimmed
    .replace(/^[A-Z]{3}\s*/i, '') // Leading currency code: "USD 125"
    .replace(/\s*[A-Z]{3}$/i, '') // Trailing currency code: "125 USD"
    .replace(/[$€£¥₹]/g, '') // Currency symbols
    .trim()

  // Remove thousands separators (commas)
  cleaned = cleaned.replace(/,/g, '')

  // Try to extract a decimal number
  const match = cleaned.match(/^(\d+(?:\.\d{0,2})?)$/)
  if (!match || !match[1]) {
    return { cents: null, isSoldOut: false }
  }

  const dollars = parseFloat(match[1])
  if (isNaN(dollars) || dollars < 0) {
    return { cents: null, isSoldOut: false }
  }

  // Convert to cents (round to avoid floating point issues)
  return { cents: Math.round(dollars * 100), isSoldOut: false }
}
