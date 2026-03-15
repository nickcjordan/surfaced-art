/** Minimum aspect ratio (2:3 w:h) — matches ListingCard's MIN_RATIO clamp. */
const MIN_RATIO = 2 / 3

/** Card info section adds roughly 80px of fixed height below the image. */
const CARD_INFO_HEIGHT = 80

/**
 * Estimate relative card height from image dimensions. Returns a unitless
 * number proportional to how tall the card will render at a given column
 * width (assumed equal across columns). When dimensions are unknown,
 * returns a square fallback (1:1).
 */
export function estimateCardHeight(
  imageWidth: number | null | undefined,
  imageHeight: number | null | undefined,
  columnWidth = 300,
): number {
  if (!imageWidth || !imageHeight) {
    // Square fallback — same as ListingCard's aspect-square default
    return columnWidth + CARD_INFO_HEIGHT
  }
  const ratio = Math.max(imageWidth / imageHeight, MIN_RATIO)
  return columnWidth / ratio + CARD_INFO_HEIGHT
}
