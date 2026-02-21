/**
 * Dimension formatting utilities
 */

/**
 * Format dimensions as a string (L × W × H)
 * @param length - Length in inches
 * @param width - Width in inches
 * @param height - Height in inches (optional for 2D pieces)
 * @param unit - Unit label (default: 'in')
 * @returns Formatted dimension string (e.g., "12 × 8 × 4 in" or "12 × 8 in")
 */
export function formatDimensions(
  length: number | null | undefined,
  width: number | null | undefined,
  height?: number | null | undefined,
  unit: string = 'in'
): string {
  if (length == null || width == null) {
    return ''
  }

  const l = formatDimensionValue(length)
  const w = formatDimensionValue(width)

  if (height != null && height > 0) {
    const h = formatDimensionValue(height)
    return `${l} × ${w} × ${h} ${unit}`
  }

  return `${l} × ${w} ${unit}`
}

/**
 * Format a single dimension value
 * Removes unnecessary decimal places
 */
function formatDimensionValue(value: number): string {
  // If it's a whole number, don't show decimals
  if (Number.isInteger(value)) {
    return value.toString()
  }
  // Otherwise, show up to 2 decimal places, removing trailing zeros
  return parseFloat(value.toFixed(2)).toString()
}

/**
 * Format packed dimensions for shipping
 * @param length - Packed length in inches
 * @param width - Packed width in inches
 * @param height - Packed height in inches
 * @param weight - Packed weight in lbs
 * @returns Formatted string (e.g., "12 × 8 × 4 in, 5 lbs")
 */
export function formatPackedDimensions(
  length: number,
  width: number,
  height: number,
  weight: number
): string {
  const dims = formatDimensions(length, width, height)
  const w = formatDimensionValue(weight)
  return `${dims}, ${w} lbs`
}
