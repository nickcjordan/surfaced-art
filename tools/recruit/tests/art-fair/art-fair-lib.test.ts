import { describe, it, expect } from 'vitest'
import {
  normalizeArtistName,
  guessCategory,
  deduplicateLeads,
  findArtistWebsite,
  findInstagramUrl,
} from '../../src/art-fair/art-fair-lib.js'
import type { ArtistLead } from '../../src/shared/types.js'

describe('normalizeArtistName', () => {
  it('trims whitespace', () => {
    expect(normalizeArtistName('  Jane Smith  ')).toBe('Jane Smith')
  })

  it('collapses multiple spaces', () => {
    expect(normalizeArtistName('Jane    Smith')).toBe('Jane Smith')
  })

  it('converts to title case', () => {
    expect(normalizeArtistName('JANE SMITH')).toBe('Jane Smith')
    expect(normalizeArtistName('jane smith')).toBe('Jane Smith')
  })

  it('handles mixed case', () => {
    expect(normalizeArtistName('jAnE sMiTh')).toBe('Jane Smith')
  })
})

describe('guessCategory', () => {
  it('matches ceramics keywords', () => {
    expect(guessCategory('Ceramic Art')).toBe('Ceramics')
    expect(guessCategory('pottery')).toBe('Ceramics')
    expect(guessCategory('Stoneware & Porcelain')).toBe('Ceramics')
  })

  it('matches painting keywords', () => {
    expect(guessCategory('Oil Painting')).toBe('Painting')
    expect(guessCategory('Acrylic on canvas')).toBe('Painting')
  })

  it('matches print keywords', () => {
    expect(guessCategory('Linocut prints')).toBe('Print')
    expect(guessCategory('screenprint')).toBe('Print')
    expect(guessCategory('Printmaking')).toBe('Print')
  })

  it('matches jewelry keywords', () => {
    expect(guessCategory('Silver Jewelry')).toBe('Jewelry')
    expect(guessCategory('metalsmithing')).toBe('Jewelry')
  })

  it('matches photography keywords', () => {
    expect(guessCategory('Fine Art Photography')).toBe('Photography')
  })

  it('matches woodworking keywords', () => {
    expect(guessCategory('Wood Sculpture')).toBe('Woodworking')
    expect(guessCategory('Woodturning')).toBe('Woodworking')
  })

  it('matches fiber keywords', () => {
    expect(guessCategory('Textile Art')).toBe('Fibers')
    expect(guessCategory('Weaving')).toBe('Fibers')
  })

  it('matches mixed media keywords', () => {
    expect(guessCategory('Mixed Media Assemblage')).toBe('Mixed Media')
    expect(guessCategory('Glass Art')).toBe('Mixed Media')
  })

  it('returns null for unrecognized text', () => {
    expect(guessCategory('Digital NFT Art')).toBeNull()
    expect(guessCategory('')).toBeNull()
  })
})

describe('deduplicateLeads', () => {
  const leads: ArtistLead[] = [
    { name: 'Jane Smith', category: 'Ceramics', website: 'https://jane.com', instagram: null, source: 'art-fair', sourceDetail: 'Fair A', notes: null },
    { name: 'jane smith', category: 'Painting', website: null, instagram: null, source: 'art-fair', sourceDetail: 'Fair B', notes: null },
    { name: 'Bob Jones', category: null, website: null, instagram: null, source: 'art-fair', sourceDetail: 'Fair A', notes: null },
  ]

  it('removes duplicates by normalized name', () => {
    const result = deduplicateLeads(leads)
    expect(result).toHaveLength(2)
    expect(result[0]!.name).toBe('Jane Smith')
    expect(result[1]!.name).toBe('Bob Jones')
  })

  it('keeps the first occurrence (with more data)', () => {
    const result = deduplicateLeads(leads)
    expect(result[0]!.website).toBe('https://jane.com')
    expect(result[0]!.category).toBe('Ceramics')
  })
})

describe('findArtistWebsite', () => {
  it('finds a website URL, excluding fair domain', () => {
    const hrefs = [
      'https://artfair.com/artists/jane',
      'https://janesmith.com',
      'https://instagram.com/jane',
    ]
    expect(findArtistWebsite(hrefs, 'artfair.com')).toBe('https://janesmith.com')
  })

  it('excludes social media domains', () => {
    const hrefs = [
      'https://instagram.com/jane',
      'https://facebook.com/jane',
      'https://twitter.com/jane',
    ]
    expect(findArtistWebsite(hrefs, 'artfair.com')).toBeNull()
  })

  it('excludes marketplace domains', () => {
    const hrefs = ['https://etsy.com/shop/jane']
    expect(findArtistWebsite(hrefs, 'artfair.com')).toBeNull()
  })

  it('excludes non-http links', () => {
    const hrefs = ['mailto:jane@art.com', 'tel:1234567890', '#top']
    expect(findArtistWebsite(hrefs, 'artfair.com')).toBeNull()
  })

  it('returns null when no valid website found', () => {
    expect(findArtistWebsite([], 'artfair.com')).toBeNull()
  })
})

describe('findInstagramUrl', () => {
  it('finds an Instagram URL', () => {
    const hrefs = [
      'https://janesmith.com',
      'https://instagram.com/janeceramics',
      'https://facebook.com/jane',
    ]
    expect(findInstagramUrl(hrefs)).toBe('https://instagram.com/janeceramics')
  })

  it('matches www.instagram.com', () => {
    const hrefs = ['https://www.instagram.com/jane']
    expect(findInstagramUrl(hrefs)).toBe('https://www.instagram.com/jane')
  })

  it('returns null when no Instagram link found', () => {
    expect(findInstagramUrl(['https://janesmith.com'])).toBeNull()
    expect(findInstagramUrl([])).toBeNull()
  })
})
