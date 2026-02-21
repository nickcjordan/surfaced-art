/**
 * Currency formatting utilities
 * All monetary values are stored as integers in cents
 */

/**
 * Format cents to a dollar string with currency symbol
 * @param cents - Amount in cents (e.g., 12500 for $125.00)
 * @param locale - Locale for formatting (default: 'en-US')
 * @param currency - Currency code (default: 'USD')
 * @returns Formatted currency string (e.g., "$125.00")
 */
export function formatCurrency(
  cents: number,
  locale: string = 'en-US',
  currency: string = 'USD'
): string {
  const dollars = cents / 100
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(dollars)
}

/**
 * Format cents to a simple dollar string without currency symbol
 * @param cents - Amount in cents
 * @returns Dollar amount as string (e.g., "125.00")
 */
export function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2)
}

/**
 * Convert dollars to cents
 * @param dollars - Amount in dollars
 * @returns Amount in cents (rounded to nearest cent)
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100)
}

/**
 * Calculate platform commission (30% of artwork price)
 * @param artworkPriceCents - Artwork price in cents
 * @returns Commission amount in cents
 */
export function calculateCommission(artworkPriceCents: number): number {
  return Math.round(artworkPriceCents * 0.3)
}

/**
 * Calculate artist payout (70% of artwork price)
 * @param artworkPriceCents - Artwork price in cents
 * @returns Payout amount in cents
 */
export function calculateArtistPayout(artworkPriceCents: number): number {
  return artworkPriceCents - calculateCommission(artworkPriceCents)
}
