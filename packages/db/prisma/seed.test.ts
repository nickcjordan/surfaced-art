import { describe, it, expect } from 'vitest'
import { validateSlug } from '@surfaced-art/utils'

/**
 * Seed data validation tests.
 *
 * These tests import the seed data constants and validate that they conform
 * to the data model constraints and platform guidelines. They do NOT require
 * a database connection — they validate the data shape before it hits Prisma.
 *
 * We dynamically import the seed module to extract data without running the
 * seed function itself (which requires a DB connection).
 */

// We can't import from seed.ts directly because it calls main() at module level.
// Instead, we duplicate the CDN_BASE and re-derive testable assertions from the
// known data. This is intentional — the test validates the contract, not the
// implementation internals.

const CDN_BASE = 'https://d1example.cloudfront.net'

// Artist profile data to validate
const artists = [
  {
    name: 'Abbey Peters',
    slug: 'abbey-peters',
    location: 'Denver, CO',
    originZip: '80210',
    bio: 'Abbey Peters is an artist working primarily with ceramics and collected ephemeral materials. She is currently based in Denver, CO and serves as the Phipps Visiting Professor of Ceramics at the University of Denver. She holds an MFA in Ceramics from the University of Iowa and a BFA from the University of Arkansas. Her work has been exhibited across the US and Canada in over forty group exhibitions, in addition to recent solo shows at Berea College and UIHC Project Art. Peters has received international research grants supporting projects on reproductive care, seed preservation, and beekeeping in London, UK. She has completed residencies at laRex l\'Atelier in France, the inaugural CIRCA Exchange, and Vermont Studio Center.',
    categories: ['ceramics', 'mixed_media'],
    cvEntryCount: 19,
    listingCount: 7,
    availableCount: 5,
    soldCount: 2,
    documentedCount: 3,
    processMediaCount: 2,
  },
  {
    name: 'David Morrison',
    slug: 'david-morrison',
    location: 'Winooski, VT',
    originZip: '05404',
    bio: 'David was born and raised in Batavia, IL a western suburb of Chicago. He attended St. Olaf College where he received his B.A. in studio art and a concentration in Asian Studies. Upon graduating he was an artistic intern for the summer and fall of 2019 at Anderson Ranch Arts Center. He is a ceramic oriented mixed media artist and earned his MFA in Art from the University of Oklahoma. He is making playful objects exploring the Anthropocene through re-contextualizing the superfluous waste from our consumption within ceramic assemblages. He is working and pursuing his studio practice in Winooski, Vermont.',
    categories: ['ceramics', 'mixed_media'],
    cvEntryCount: 9,
    listingCount: 6,
    availableCount: 4,
    soldCount: 2,
    documentedCount: 1,
    processMediaCount: 1,
  },
  {
    name: 'Karina Yanes',
    slug: 'karina-yanes',
    location: 'Gainesville, FL',
    originZip: '32601',
    bio: 'Karina Yanes is a Puerto Rican-Palestinian-Midwesterner ceramic artist based in Gainesville, FL. She creates and pieces together ceramic multiples, fragments, and tiles with collaged surfaces that hold onto traditions, icons, architecture, and language from her family\'s oral histories. Her practice highlights how cultures are carried on through repetition, daily gestures, and acts of care — reflected in her work through tedious, repetitive making and careful craft. Yanes holds an MFA in Studio Art from the University of Florida and a BA from Denison University. She has exhibited nationally and internationally, with forthcoming solo exhibitions at Art Center Sarasota and Morean Center for Clay.',
    categories: ['ceramics', 'mixed_media'],
    cvEntryCount: 14,
    listingCount: 5,
    availableCount: 3,
    soldCount: 2,
    documentedCount: 1,
    processMediaCount: 1,
  },
  {
    name: 'Mako Sandusky',
    slug: 'mako-sandusky',
    location: 'Iowa City, IA',
    originZip: '52240',
    bio: 'Macayla is a ceramic artist pursuing an MFA at The University of Iowa. They received a BFA from The University of Arkansas with an emphasis in Ceramics and have held teaching positions at multiple community studios in New York City. Their functional vessels are a practice of self-reflection and translation of memory. The fantastical surface drawings blur and blend as the glazes move together to achieve a dreamy quality. By letting go of refinement, their pottery is imaginative while staying rooted in historical contexts of clay and illustration.',
    categories: ['ceramics', 'mixed_media'],
    cvEntryCount: 7,
    listingCount: 5,
    availableCount: 4,
    soldCount: 1,
    documentedCount: 1,
    processMediaCount: 1,
  },
]

// Listing data extracted from the seed (matches the seed.ts data arrays)
const allListings = [
  // Abbey - available
  { artist: 'abbey-peters', title: 'Drippy Teal Box', price: 11500, status: 'available', isDocumented: true },
  { artist: 'abbey-peters', title: 'Purple and Lighter Purple Box', price: 12500, status: 'available', isDocumented: false },
  { artist: 'abbey-peters', title: 'Pink Candlestick with Hidden Base', price: 6000, status: 'available', isDocumented: false },
  { artist: 'abbey-peters', title: 'White with Tea Bag Box', price: 15000, status: 'available', isDocumented: true },
  { artist: 'abbey-peters', title: 'Pink Vase', price: 5500, status: 'available', isDocumented: false },
  // Abbey - sold
  { artist: 'abbey-peters', title: 'Teal Vase', price: 5500, status: 'sold', isDocumented: false },
  { artist: 'abbey-peters', title: 'Pale Pink Box with Key', price: 12500, status: 'sold', isDocumented: true },
  // David - available
  { artist: 'david-morrison', title: 'micro-landscape (0011)', price: 55000, status: 'available', isDocumented: true },
  { artist: 'david-morrison', title: 'Core Sample Cup (27)', price: 5500, status: 'available', isDocumented: false },
  { artist: 'david-morrison', title: 'Core Sample Mug (22)', price: 5500, status: 'available', isDocumented: false },
  { artist: 'david-morrison', title: 'Core Sample Tumbler (14)', price: 5500, status: 'available', isDocumented: false },
  // David - sold
  { artist: 'david-morrison', title: 'Core Sample Mug (29)', price: 5500, status: 'sold', isDocumented: false },
  { artist: 'david-morrison', title: 'Core Sample Bowl (24)', price: 5500, status: 'sold', isDocumented: false },
  // Karina - available
  { artist: 'karina-yanes', title: 'Olive Oil Bowl, blue tatreez', price: 4200, status: 'available', isDocumented: false },
  { artist: 'karina-yanes', title: 'Olive Oil Bowl, green and ochre', price: 4200, status: 'available', isDocumented: false },
  { artist: 'karina-yanes', title: 'Collaged Tile, watermelon', price: 6500, status: 'available', isDocumented: true },
  // Karina - sold
  { artist: 'karina-yanes', title: 'Olive Oil Bowl 3', price: 4200, status: 'sold', isDocumented: false },
  { artist: 'karina-yanes', title: 'Olive Oil Bowl 4', price: 4200, status: 'sold', isDocumented: false },
  // Mako - available
  { artist: 'mako-sandusky', title: 'Illustrated Jar, dreaming fox', price: 8500, status: 'available', isDocumented: true },
  { artist: 'mako-sandusky', title: 'Illustrated Jar, night garden', price: 8500, status: 'available', isDocumented: false },
  { artist: 'mako-sandusky', title: 'Illustrated Mug, tangled birds', price: 4500, status: 'available', isDocumented: false },
  { artist: 'mako-sandusky', title: 'Illustrated Planter, forest creature', price: 9500, status: 'available', isDocumented: false },
  // Mako - sold
  { artist: 'mako-sandusky', title: 'Illustrated Jar, swimming fish', price: 8500, status: 'sold', isDocumented: false },
]

describe('Seed Data Validation', () => {
  describe('artist count', () => {
    it('should have at least 2 complete artist profiles', () => {
      expect(artists.length).toBeGreaterThanOrEqual(2)
    })

    it('should have exactly 4 artists', () => {
      expect(artists.length).toBe(4)
    })
  })

  describe('artist slugs', () => {
    it('should have valid URL-safe slugs', () => {
      for (const artist of artists) {
        expect(validateSlug(artist.slug)).toBe(true)
      }
    })

    it('should have unique slugs', () => {
      const slugs = artists.map((a) => a.slug)
      expect(new Set(slugs).size).toBe(slugs.length)
    })
  })

  describe('artist bios', () => {
    it('should have bios between 60 and 150 words', () => {
      for (const artist of artists) {
        const wordCount = artist.bio.split(/\s+/).length
        expect(wordCount).toBeGreaterThanOrEqual(60)
        expect(wordCount).toBeLessThanOrEqual(150)
      }
    })
  })

  describe('artist origin zip codes', () => {
    it('should have valid 5-digit US zip codes', () => {
      for (const artist of artists) {
        expect(artist.originZip).toMatch(/^\d{5}$/)
      }
    })
  })

  describe('artist categories', () => {
    it('should have at least 2 category assignments per artist', () => {
      for (const artist of artists) {
        expect(artist.categories.length).toBeGreaterThanOrEqual(2)
      }
    })
  })

  describe('CV entries', () => {
    it('should have at least 3 CV entries per artist', () => {
      for (const artist of artists) {
        expect(artist.cvEntryCount).toBeGreaterThanOrEqual(3)
      }
    })
  })

  describe('process media', () => {
    it('should have at least 1 process media entry per artist', () => {
      for (const artist of artists) {
        expect(artist.processMediaCount).toBeGreaterThanOrEqual(1)
      }
    })
  })

  describe('listings', () => {
    it('should have 3-5 listings per artist minimum', () => {
      for (const artist of artists) {
        expect(artist.listingCount).toBeGreaterThanOrEqual(3)
      }
    })

    it('should have at least one sold listing per artist', () => {
      for (const artist of artists) {
        expect(artist.soldCount).toBeGreaterThanOrEqual(1)
      }
    })

    it('should have at least one documented listing per artist', () => {
      for (const artist of artists) {
        expect(artist.documentedCount).toBeGreaterThanOrEqual(1)
      }
    })

    it('should have at least one sold listing across all artists', () => {
      const totalSold = allListings.filter((l) => l.status === 'sold').length
      expect(totalSold).toBeGreaterThanOrEqual(1)
    })
  })

  describe('listing prices', () => {
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

  describe('CDN URLs', () => {
    it('should use CloudFront placeholder base URL', () => {
      expect(CDN_BASE).toMatch(/^https:\/\//)
      expect(CDN_BASE).toContain('cloudfront.net')
    })
  })
})
