import { describe, it, expect, vi } from 'vitest'
import { validateSlug } from '@surfaced-art/utils'
import { artistConfigs, CDN_BASE, realArtistConfigs, demoArtistConfigs } from './seed-data'

/**
 * Seed data validation tests.
 *
 * These tests import the artist configs directly from seed-data.ts (the single
 * source of truth) and validate that they conform to the data model constraints
 * and platform guidelines. They do NOT require a database connection.
 */

describe('Seed Data Validation', () => {
  describe('artist count', () => {
    it('should have at least 2 complete artist profiles', () => {
      expect(artistConfigs.length).toBeGreaterThanOrEqual(2)
    })

    it('should have exactly 27 artists (3 real + 24 demo)', () => {
      expect(artistConfigs.length).toBe(27)
    })
  })

  describe('artist slugs', () => {
    it('should have valid URL-safe slugs', () => {
      for (const config of artistConfigs) {
        expect(validateSlug(config.profile.slug)).toBe(true)
      }
    })

    it('should have unique slugs', () => {
      const slugs = artistConfigs.map((c) => c.profile.slug)
      expect(new Set(slugs).size).toBe(slugs.length)
    })
  })

  describe('artist bios', () => {
    it('should have bios between 60 and 150 words', () => {
      for (const config of artistConfigs) {
        const wordCount = config.profile.bio.split(/\s+/).length
        expect(wordCount).toBeGreaterThanOrEqual(60)
        expect(wordCount).toBeLessThanOrEqual(150)
      }
    })
  })

  describe('artist origin zip codes', () => {
    it('should have valid 5-digit US zip codes', () => {
      for (const config of artistConfigs) {
        expect(config.profile.originZip).toMatch(/^\d{5}$/)
      }
    })
  })

  describe('artist categories', () => {
    it('should have at least 1 category assignment per artist', () => {
      for (const config of artistConfigs) {
        expect(config.categories.length).toBeGreaterThanOrEqual(1)
      }
    })
  })

  describe('CV entries', () => {
    it('should have at least 3 CV entries per artist', () => {
      for (const config of artistConfigs) {
        expect(config.cvEntries.length).toBeGreaterThanOrEqual(3)
      }
    })
  })

  describe('process media', () => {
    it('should have at least 1 process media entry for artists with images', () => {
      const artistsWithImages = artistConfigs.filter(
        (c) => c.profile.coverImageUrl !== null
      )
      for (const config of artistsWithImages) {
        expect(config.processMedia.length).toBeGreaterThanOrEqual(1)
      }
    })
  })

  describe('listings', () => {
    it('should have 3-5 listings per artist minimum', () => {
      for (const config of artistConfigs) {
        expect(config.listings.length).toBeGreaterThanOrEqual(3)
      }
    })

    it('should have at least one sold listing per artist', () => {
      for (const config of artistConfigs) {
        const soldCount = config.listings.filter((l) => l.status === 'sold').length
        expect(soldCount).toBeGreaterThanOrEqual(1)
      }
    })

    it('should have at least one documented listing per artist', () => {
      for (const config of artistConfigs) {
        const documentedCount = config.listings.filter((l) => l.isDocumented).length
        expect(documentedCount).toBeGreaterThanOrEqual(1)
      }
    })

    it('should have at least one sold listing across all artists', () => {
      const allListings = artistConfigs.flatMap((c) => c.listings)
      const totalSold = allListings.filter((l) => l.status === 'sold').length
      expect(totalSold).toBeGreaterThanOrEqual(1)
    })
  })

  describe('listing prices', () => {
    const allListings = artistConfigs.flatMap((c) => c.listings)

    it('should store prices as integers (cents)', () => {
      for (const listing of allListings) {
        expect(Number.isInteger(listing.price)).toBe(true)
      }
    })

    it('should have prices in realistic range ($42-$550)', () => {
      for (const listing of allListings) {
        // $42 (4200 cents) to $550 (55000 cents)
        expect(listing.price).toBeGreaterThanOrEqual(4200)
        expect(listing.price).toBeLessThanOrEqual(55000)
      }
    })
  })

  describe('user data', () => {
    it('should have unique emails', () => {
      const emails = artistConfigs.map((c) => c.user.email)
      expect(new Set(emails).size).toBe(emails.length)
    })

    it('should have unique cognitoIds', () => {
      const ids = artistConfigs.map((c) => c.user.cognitoId)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('should have cognitoIds prefixed with "seed-" (required by seed-safe.ts safety guard)', () => {
      for (const config of artistConfigs) {
        expect(config.user.cognitoId).toMatch(/^seed-/)
      }
    })
  })

  describe('isDemo flag', () => {
    it('should have isDemo=false for real artists', () => {
      const realArtists = artistConfigs.filter((c) => !c.profile.isDemo)
      expect(realArtists.length).toBe(3)
    })

    it('should have isDemo=true for demo artists', () => {
      const demoArtists = artistConfigs.filter((c) => c.profile.isDemo)
      expect(demoArtists.length).toBe(24)
    })

    it('should have every artist with an explicit isDemo value', () => {
      for (const config of artistConfigs) {
        expect(typeof config.profile.isDemo).toBe('boolean')
      }
    })
  })

  describe('SEED_MODE filtering', () => {
    it('should default to all artists when SEED_MODE is unset', () => {
      // artistConfigs is evaluated at import time without SEED_MODE
      expect(artistConfigs.length).toBe(
        realArtistConfigs.length + demoArtistConfigs.length
      )
    })

    it('should return only real artists when SEED_MODE=real', async () => {
      vi.stubEnv('SEED_MODE', 'real')
      vi.resetModules()
      try {
        const mod = await import('./seed-data')
        expect(mod.artistConfigs.length).toBe(realArtistConfigs.length)
        expect(mod.artistConfigs.every((c) => !c.profile.isDemo)).toBe(true)
      } finally {
        vi.unstubAllEnvs()
      }
    })

    it('should return only demo artists when SEED_MODE=demo', async () => {
      vi.stubEnv('SEED_MODE', 'demo')
      vi.resetModules()
      try {
        const mod = await import('./seed-data')
        expect(mod.artistConfigs.length).toBe(demoArtistConfigs.length)
        expect(mod.artistConfigs.every((c) => c.profile.isDemo)).toBe(true)
      } finally {
        vi.unstubAllEnvs()
      }
    })

    it('should return all artists when SEED_MODE=all', async () => {
      vi.stubEnv('SEED_MODE', 'all')
      vi.resetModules()
      try {
        const mod = await import('./seed-data')
        expect(mod.artistConfigs.length).toBe(
          realArtistConfigs.length + demoArtistConfigs.length
        )
      } finally {
        vi.unstubAllEnvs()
      }
    })

    it('should throw for invalid SEED_MODE values', async () => {
      vi.stubEnv('SEED_MODE', 'invalid')
      vi.resetModules()
      try {
        await expect(import('./seed-data')).rejects.toThrow('Invalid SEED_MODE')
      } finally {
        vi.unstubAllEnvs()
      }
    })
  })

  describe('CDN URLs', () => {
    it('should default to prod CloudFront base URL', () => {
      expect(CDN_BASE).toMatch(/^https:\/\//)
      expect(CDN_BASE).toContain('cloudfront.net')
    })

    it('should respect SEED_CDN_BASE env var override', async () => {
      const testCdnBase = 'https://d2agn4aoo0e7ji.cloudfront.net'
      vi.stubEnv('SEED_CDN_BASE', testCdnBase)
      vi.resetModules()
      try {
        // Re-import to force re-evaluation with the env var set
        const cdn = (await import('./seed-data/cdn.js')) as { CDN_BASE: string }
        expect(cdn.CDN_BASE).toBe(testCdnBase)
      } finally {
        vi.unstubAllEnvs()
      }
    })
  })
})
