import { describe, it, expect } from 'vitest'
import {
  getTaxonomyIds,
  parseEtsyListing,
  parseEtsyShop,
  extractInstagramFromText,
  extractWebsiteFromText,
  groupListingsByShop,
  isLikelyArtist,
} from '../../src/etsy/etsy-lib.js'
import type { EtsyShop } from '../../src/shared/types.js'

// ---------------------------------------------------------------------------
// Sample data matching Etsy's actual API response structure
// ---------------------------------------------------------------------------

const SAMPLE_LISTING = {
  listing_id: 1234567890,
  shop_id: 9876543,
  title: 'Handmade Ceramic Mug - Ocean Blue Glaze',
  price: { amount: 4500, divisor: 100, currency_code: 'USD' },
  taxonomy_id: 893,
  is_handmade: true,
}

const SAMPLE_SHOP = {
  shop_id: 9876543,
  shop_name: 'JaneCeramicsStudio',
  user_id: 12345,
  title: "Jane's Ceramic Studio",
  announcement:
    'Handmade ceramics from my studio in Portland, OR. Follow me on Instagram: @janeceramics. Visit my website at https://janeceramics.com',
  url: 'https://www.etsy.com/shop/JaneCeramicsStudio',
  num_favorers: 1234,
  listing_active_count: 45,
  sale_message: 'Thanks for your purchase!',
  about: 'I make handmade ceramics in my home studio.',
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getTaxonomyIds', () => {
  it('returns taxonomy IDs for known categories', () => {
    expect(getTaxonomyIds('ceramics')).toEqual([893])
    expect(getTaxonomyIds('jewelry')).toEqual([68])
    expect(getTaxonomyIds('painting')).toEqual([817])
  })

  it('is case-insensitive', () => {
    expect(getTaxonomyIds('Ceramics')).toEqual([893])
    expect(getTaxonomyIds('JEWELRY')).toEqual([68])
  })

  it('returns multiple IDs for categories that span Etsy taxonomies', () => {
    expect(getTaxonomyIds('illustration')).toEqual([817, 818])
  })

  it('returns null for unknown categories', () => {
    expect(getTaxonomyIds('blockchain')).toBeNull()
  })
})

describe('parseEtsyListing', () => {
  it('parses a valid listing', () => {
    const result = parseEtsyListing(SAMPLE_LISTING)
    expect(result).toEqual({
      shopId: 9876543,
      title: 'Handmade Ceramic Mug - Ocean Blue Glaze',
      priceCents: 4500,
    })
  })

  it('returns null for missing shop_id', () => {
    expect(parseEtsyListing({ title: 'Test' })).toBeNull()
  })

  it('returns null for missing title', () => {
    expect(parseEtsyListing({ shop_id: 123 })).toBeNull()
  })

  it('handles missing price gracefully', () => {
    const result = parseEtsyListing({ shop_id: 123, title: 'Test' })
    expect(result?.priceCents).toBe(0)
  })
})

describe('parseEtsyShop', () => {
  it('parses a valid shop', () => {
    const result = parseEtsyShop(SAMPLE_SHOP)
    expect(result).not.toBeNull()
    expect(result!.shopName).toBe('JaneCeramicsStudio')
    expect(result!.shopOwner).toBe("Jane's Ceramic Studio")
    expect(result!.numFavorers).toBe(1234)
    expect(result!.instagram).toBe('https://instagram.com/janeceramics')
    expect(result!.website).toBe('https://janeceramics.com')
  })

  it('returns null for missing shop_id', () => {
    expect(parseEtsyShop({ shop_name: 'Test' })).toBeNull()
  })

  it('returns null for missing shop_name', () => {
    expect(parseEtsyShop({ shop_id: 123 })).toBeNull()
  })

  it('generates URL when not provided', () => {
    const result = parseEtsyShop({
      shop_id: 123,
      shop_name: 'TestShop',
    })
    expect(result!.shopUrl).toBe('https://www.etsy.com/shop/TestShop')
  })
})

describe('extractInstagramFromText', () => {
  it('extracts full Instagram URL', () => {
    expect(
      extractInstagramFromText('Follow me at https://instagram.com/janeceramics')
    ).toBe('https://instagram.com/janeceramics')
  })

  it('extracts www Instagram URL', () => {
    expect(
      extractInstagramFromText(
        'Check out https://www.instagram.com/janeceramics/'
      )
    ).toBe('https://instagram.com/janeceramics')
  })

  it('extracts from "Instagram: @username" pattern', () => {
    expect(
      extractInstagramFromText('Instagram: @janeceramics')
    ).toBe('https://instagram.com/janeceramics')
  })

  it('extracts from "IG: username" pattern', () => {
    expect(extractInstagramFromText('IG: janeceramics')).toBe(
      'https://instagram.com/janeceramics'
    )
  })

  it('returns null when no Instagram found', () => {
    expect(extractInstagramFromText('No social links here')).toBeNull()
  })

  it('returns null for empty text', () => {
    expect(extractInstagramFromText('')).toBeNull()
  })
})

describe('extractWebsiteFromText', () => {
  it('extracts a website URL', () => {
    expect(
      extractWebsiteFromText('Visit my site at https://janeceramics.com for more')
    ).toBe('https://janeceramics.com')
  })

  it('skips social media URLs', () => {
    expect(
      extractWebsiteFromText(
        'Follow me at https://instagram.com/jane and https://facebook.com/jane'
      )
    ).toBeNull()
  })

  it('returns the first non-social URL', () => {
    expect(
      extractWebsiteFromText(
        'https://instagram.com/jane https://janeceramics.com https://janeart.com'
      )
    ).toBe('https://janeceramics.com')
  })

  it('returns null for empty text', () => {
    expect(extractWebsiteFromText('')).toBeNull()
  })
})

describe('groupListingsByShop', () => {
  it('groups listings by shop ID', () => {
    const listings = [
      { shopId: 1, title: 'Mug A', priceCents: 3500 },
      { shopId: 1, title: 'Bowl B', priceCents: 5500 },
      { shopId: 2, title: 'Ring C', priceCents: 8000 },
    ]

    const grouped = groupListingsByShop(listings)
    expect(grouped.size).toBe(2)

    const shop1 = grouped.get(1)!
    expect(shop1.titles).toEqual(['Mug A', 'Bowl B'])
    expect(shop1.minPrice).toBe(3500)
    expect(shop1.maxPrice).toBe(5500)

    const shop2 = grouped.get(2)!
    expect(shop2.titles).toEqual(['Ring C'])
    expect(shop2.minPrice).toBe(8000)
    expect(shop2.maxPrice).toBe(8000)
  })

  it('handles empty input', () => {
    expect(groupListingsByShop([]).size).toBe(0)
  })
})

describe('isLikelyArtist', () => {
  const baseShop: EtsyShop = {
    shopId: 1,
    shopName: 'ArtistShop',
    shopOwner: 'Jane',
    shopUrl: 'https://etsy.com/shop/ArtistShop',
    listingTitles: ['Mug A', 'Bowl B'],
    priceRangeCents: { min: 4000, max: 8000 },
    instagram: null,
    website: null,
    location: null,
    numFavorers: 100,
  }

  it('returns true for a typical artist shop', () => {
    expect(isLikelyArtist(baseShop)).toBe(true)
  })

  it('returns false for shops with too many listings', () => {
    const massProducer = {
      ...baseShop,
      listingTitles: Array(201).fill('Item'),
    }
    expect(isLikelyArtist(massProducer)).toBe(false)
  })

  it('returns false for shops with very low average prices', () => {
    const cheapShop = {
      ...baseShop,
      priceRangeCents: { min: 500, max: 1500 },
    }
    expect(isLikelyArtist(cheapShop)).toBe(false)
  })
})
