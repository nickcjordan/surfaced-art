import { describe, it, expect } from 'vitest'
import {
  normalizeInstagramUrl,
  isLikelyArtistWebsite,
  findMissingFields,
  canEnrich,
} from '../../src/enricher/enricher-lib.js'
import type { PipelineEntry } from '../../src/shared/types.js'

describe('normalizeInstagramUrl', () => {
  it('normalizes a full Instagram URL', () => {
    expect(normalizeInstagramUrl('https://www.instagram.com/janeceramics/')).toBe(
      'https://instagram.com/janeceramics'
    )
  })

  it('normalizes without www', () => {
    expect(normalizeInstagramUrl('https://instagram.com/janeceramics')).toBe(
      'https://instagram.com/janeceramics'
    )
  })

  it('handles trailing slash', () => {
    expect(normalizeInstagramUrl('https://instagram.com/janeceramics/')).toBe(
      'https://instagram.com/janeceramics'
    )
  })

  it('handles http (non-https)', () => {
    expect(normalizeInstagramUrl('http://instagram.com/janeceramics')).toBe(
      'https://instagram.com/janeceramics'
    )
  })

  it('handles bare @username', () => {
    expect(normalizeInstagramUrl('@janeceramics')).toBe(
      'https://instagram.com/janeceramics'
    )
  })

  it('handles bare username without @', () => {
    expect(normalizeInstagramUrl('janeceramics')).toBe(
      'https://instagram.com/janeceramics'
    )
  })

  it('rejects Instagram post URLs', () => {
    expect(
      normalizeInstagramUrl('https://instagram.com/p/ABC123/')
    ).toBeNull()
  })

  it('rejects Instagram reel URLs', () => {
    expect(
      normalizeInstagramUrl('https://instagram.com/reel/ABC123/')
    ).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(normalizeInstagramUrl('')).toBeNull()
  })

  it('returns null for non-Instagram URLs', () => {
    expect(normalizeInstagramUrl('https://twitter.com/jane')).toBeNull()
  })
})

describe('isLikelyArtistWebsite', () => {
  it('returns true for personal domains', () => {
    expect(isLikelyArtistWebsite('https://janesmith.com')).toBe(true)
    expect(isLikelyArtistWebsite('https://www.bobjones.art')).toBe(true)
  })

  it('returns false for social media', () => {
    expect(isLikelyArtistWebsite('https://instagram.com/jane')).toBe(false)
    expect(isLikelyArtistWebsite('https://facebook.com/jane')).toBe(false)
    expect(isLikelyArtistWebsite('https://twitter.com/jane')).toBe(false)
    expect(isLikelyArtistWebsite('https://tiktok.com/@jane')).toBe(false)
  })

  it('returns false for marketplaces', () => {
    expect(isLikelyArtistWebsite('https://etsy.com/shop/jane')).toBe(false)
    expect(isLikelyArtistWebsite('https://society6.com/jane')).toBe(false)
    expect(isLikelyArtistWebsite('https://redbubble.com/jane')).toBe(false)
  })

  it('returns false for portfolio platforms', () => {
    expect(isLikelyArtistWebsite('https://behance.net/jane')).toBe(false)
    expect(isLikelyArtistWebsite('https://dribbble.com/jane')).toBe(false)
  })

  it('returns false for empty/invalid URLs', () => {
    expect(isLikelyArtistWebsite('')).toBe(false)
    expect(isLikelyArtistWebsite('not-a-url')).toBe(false)
  })
})

describe('findMissingFields', () => {
  const full: PipelineEntry = {
    id: '1',
    name: 'Jane',
    categories: ['Ceramics'],
    stage: 'Identified',
    source: 'Instagram Outreach',
    instagram: 'https://instagram.com/jane',
    website: 'https://jane.com',
    notes: null,
    foundingArtist: false,
  }

  it('returns empty array when all fields present', () => {
    expect(findMissingFields(full)).toEqual([])
  })

  it('identifies missing instagram', () => {
    const entry = { ...full, instagram: null }
    expect(findMissingFields(entry)).toEqual(['instagram'])
  })

  it('identifies missing website', () => {
    const entry = { ...full, website: null }
    expect(findMissingFields(entry)).toEqual(['website'])
  })

  it('identifies both missing', () => {
    const entry = { ...full, instagram: null, website: null }
    expect(findMissingFields(entry)).toEqual(['instagram', 'website'])
  })
})

describe('canEnrich', () => {
  const base: PipelineEntry = {
    id: '1',
    name: 'Jane',
    categories: [],
    stage: 'Identified',
    source: null,
    instagram: null,
    website: null,
    notes: null,
    foundingArtist: false,
  }

  it('returns true when website exists but instagram missing', () => {
    expect(canEnrich({ ...base, website: 'https://jane.com' })).toBe(true)
  })

  it('returns false when all fields present (nothing to enrich)', () => {
    expect(
      canEnrich({
        ...base,
        website: 'https://jane.com',
        instagram: 'https://instagram.com/jane',
      })
    ).toBe(false)
  })

  it('returns false when no website to scrape from', () => {
    expect(canEnrich({ ...base, instagram: null, website: null })).toBe(false)
  })
})
