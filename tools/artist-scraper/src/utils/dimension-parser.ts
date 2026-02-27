/**
 * Parse dimension strings from artist websites into structured data.
 *
 * Handles formats like:
 * - "8 x 10 x 2 inches"
 * - "8" x 10" x 2""  (with inch marks)
 * - "8 × 10 × 2 in"  (unicode ×)
 * - "20 x 25 cm"
 * - "8 (L) x 10 (W) x 2 (H) in"
 * - "4.5 x 5.5 x 4"
 */

import type { ParsedDimensions } from '../types.js'

/** Regex to detect a unit suffix. */
const UNIT_PATTERNS: Array<{ regex: RegExp; unit: string }> = [
  { regex: /\b(inches|inch|in)\b/i, unit: 'in' },
  { regex: /["″"]\s*$/, unit: 'in' },
  { regex: /\b(centimeters|centimeter|cm)\b/i, unit: 'cm' },
  { regex: /\b(millimeters|millimeter|mm)\b/i, unit: 'mm' },
]

/**
 * Separators between dimensions: "x", "×", "X", "by"
 * Surrounded by optional whitespace.
 */
const SEPARATOR = /\s*[x×X]\s*|\s+by\s+/

/**
 * Parse a dimension string into structured dimensions.
 *
 * @param raw - Raw dimension string from a webpage
 * @returns Parsed dimensions, or null if unparseable
 */
export function parseDimensions(raw: string): ParsedDimensions | null {
  if (!raw || typeof raw !== 'string') {
    return null
  }

  const trimmed = raw.trim()
  if (!trimmed) {
    return null
  }

  // Detect unit
  let unit = 'in' // default to inches (most common for US artists)
  for (const { regex, unit: u } of UNIT_PATTERNS) {
    if (regex.test(trimmed)) {
      unit = u
      break
    }
  }

  // Remove unit text, labels like (L) (W) (H), and inch marks to isolate numbers
  const cleaned = trimmed
    .replace(/\b(inches|inch|in|centimeters|centimeter|cm|millimeters|millimeter|mm)\b/gi, '')
    .replace(/["″"]/g, '')
    .replace(/\([LlWwHhDd]\)/g, '') // Remove (L), (W), (H), (D) labels
    .trim()

  // Split on separators
  const parts = cleaned.split(SEPARATOR).map((p) => p.trim()).filter(Boolean)
  if (parts.length === 0) {
    return null
  }

  // Parse each part as a number
  const numbers = parts.map((p) => {
    const n = parseFloat(p)
    return isNaN(n) ? null : n
  })

  // Need at least one valid number
  if (numbers.every((n) => n === null)) {
    return null
  }

  if (numbers.length === 1) {
    // Single dimension — could be diameter or a single measurement
    return {
      length: numbers[0] ?? null,
      width: null,
      height: null,
      unit,
    }
  }

  if (numbers.length === 2) {
    // Two dimensions: L x W (no height)
    return {
      length: numbers[0] ?? null,
      width: numbers[1] ?? null,
      height: null,
      unit,
    }
  }

  // Three or more dimensions: L x W x H
  return {
    length: numbers[0] ?? null,
    width: numbers[1] ?? null,
    height: numbers[2] ?? null,
    unit,
  }
}
