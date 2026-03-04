/**
 * Pure functions for the Etsy category browser.
 * No side effects — all functions are testable without mocking.
 */

import type { EtsyShop } from '../shared/types.js'

// ---------------------------------------------------------------------------
// Etsy taxonomy mapping
// ---------------------------------------------------------------------------

/**
 * Map Surfaced Art categories to Etsy taxonomy IDs.
 *
 * These are the top-level category IDs from the Etsy taxonomy.
 * Use `GET /v3/application/seller-taxonomy/nodes` to discover more.
 *
 * @see https://developers.etsy.com/documentation/reference#operation/getSellerTaxonomyNodes
 */
export const CATEGORY_TO_TAXONOMY: Record<string, number[]> = {
  ceramics: [893], // Pottery
  painting: [817], // Painting
  print: [818], // Print
  jewelry: [68], // Jewelry
  illustration: [817, 818], // Painting + Print (Etsy doesn't separate illustration)
  photography: [775], // Photography
  woodworking: [333], // Woodworking
  fibers: [401], // Fiber Arts
  'mixed media': [817, 893], // Broad search
}

/**
 * Look up Etsy taxonomy IDs for a Surfaced Art category name.
 * Case-insensitive lookup.
 */
export function getTaxonomyIds(category: string): number[] | null {
  return CATEGORY_TO_TAXONOMY[category.toLowerCase()] ?? null
}

// ---------------------------------------------------------------------------
// Etsy API response parsing
// ---------------------------------------------------------------------------

interface EtsyListingRaw {
  listing_id?: number
  shop_id?: number
  title?: string
  price?: { amount?: number; divisor?: number; currency_code?: string }
  taxonomy_id?: number
  is_handmade?: boolean
}

interface EtsyShopRaw {
  shop_id?: number
  shop_name?: string
  user_id?: number
  title?: string
  announcement?: string
  url?: string
  num_favorers?: number
  listing_active_count?: number
  sale_message?: string
  about?: string
}

/**
 * Parse an Etsy listing from the API response.
 */
export function parseEtsyListing(
  raw: unknown
): { shopId: number; title: string; priceCents: number } | null {
  const listing = raw as EtsyListingRaw
  if (!listing?.shop_id || !listing?.title) return null

  const amount = listing.price?.amount ?? 0
  const divisor = listing.price?.divisor ?? 100
  const priceCents = Math.round((amount / divisor) * 100)

  return {
    shopId: listing.shop_id,
    title: listing.title,
    priceCents,
  }
}

/**
 * Parse an Etsy shop from the API response.
 */
export function parseEtsyShop(raw: unknown): EtsyShop | null {
  const shop = raw as EtsyShopRaw
  if (!shop?.shop_id || !shop?.shop_name) return null

  const aboutText = [shop.announcement, shop.about, shop.sale_message]
    .filter(Boolean)
    .join(' ')

  return {
    shopId: shop.shop_id,
    shopName: shop.shop_name,
    shopOwner: shop.title ?? shop.shop_name,
    shopUrl: shop.url ?? `https://www.etsy.com/shop/${shop.shop_name}`,
    listingTitles: [],
    priceRangeCents: { min: 0, max: 0 },
    instagram: extractInstagramFromText(aboutText),
    website: extractWebsiteFromText(aboutText),
    location: null,
    numFavorers: shop.num_favorers ?? 0,
  }
}

// ---------------------------------------------------------------------------
// Text extraction
// ---------------------------------------------------------------------------

/**
 * Extract an Instagram URL from shop about/announcement text.
 */
export function extractInstagramFromText(text: string): string | null {
  if (!text) return null

  // Match full Instagram URLs
  const urlMatch = text.match(
    /https?:\/\/(www\.)?instagram\.com\/([a-zA-Z0-9_.]+)\/?/
  )
  if (urlMatch?.[2]) {
    const username = urlMatch[2].replace(/\.+$/, '') // Strip trailing dots
    return `https://instagram.com/${username}`
  }

  // Match @username patterns that look like Instagram handles
  const atMatch = text.match(
    /(?:instagram|ig|insta)\s*[:|-]?\s*@?([a-zA-Z0-9_.]{1,30})/i
  )
  if (atMatch?.[1]) {
    const username = atMatch[1].replace(/\.+$/, '') // Strip trailing dots
    return `https://instagram.com/${username}`
  }

  return null
}

/**
 * Extract a website URL from shop about/announcement text.
 */
export function extractWebsiteFromText(text: string): string | null {
  if (!text) return null

  // Match URLs that are NOT social media or marketplace sites
  // eslint-disable-next-line no-useless-escape
  const urlPattern = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g
  const urls = text.match(urlPattern) ?? []

  const excludeDomains = [
    'instagram.com',
    'facebook.com',
    'twitter.com',
    'x.com',
    'tiktok.com',
    'youtube.com',
    'pinterest.com',
    'etsy.com',
    'amazon.com',
    'linkedin.com',
  ]

  for (const url of urls) {
    const lower = url.toLowerCase()
    if (!excludeDomains.some((d) => lower.includes(d))) {
      return url
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Grouping and filtering
// ---------------------------------------------------------------------------

/**
 * Group listings by shop ID and aggregate price range.
 */
export function groupListingsByShop(
  listings: Array<{ shopId: number; title: string; priceCents: number }>
): Map<number, { titles: string[]; minPrice: number; maxPrice: number }> {
  const map = new Map<
    number,
    { titles: string[]; minPrice: number; maxPrice: number }
  >()

  for (const listing of listings) {
    const existing = map.get(listing.shopId)
    if (existing) {
      existing.titles.push(listing.title)
      existing.minPrice = Math.min(existing.minPrice, listing.priceCents)
      existing.maxPrice = Math.max(existing.maxPrice, listing.priceCents)
    } else {
      map.set(listing.shopId, {
        titles: [listing.title],
        minPrice: listing.priceCents,
        maxPrice: listing.priceCents,
      })
    }
  }

  return map
}

/**
 * Heuristic: is this shop likely an individual artist (not a mass producer)?
 *
 * Checks:
 * - Less than 200 active listings
 * - Average price > $30 (3000 cents)
 * - Shop text mentions handmade/studio/artist keywords
 */
export function isLikelyArtist(shop: EtsyShop): boolean {
  // We don't have listing count in the shop data from our parsing,
  // so we use the number of listing titles we've seen as a proxy
  if (shop.listingTitles.length > 200) return false

  // Check price range
  if (shop.priceRangeCents.max > 0) {
    const avgPrice =
      (shop.priceRangeCents.min + shop.priceRangeCents.max) / 2
    if (avgPrice < 3000) return false // Average under $30
  }

  return true
}
