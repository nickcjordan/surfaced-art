import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import type { PrismaClient } from '@surfaced-art/db'
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupDatabase,
  createTestArtist,
  createTestListing,
} from '@surfaced-art/db/test-helpers'
import { createTestApp } from '../test-helpers/create-test-app.js'
import type { Hono } from 'hono'

describe('GET /artists/:slug — integration', () => {
  let prisma: PrismaClient
  let app: Hono

  beforeAll(async () => {
    prisma = await setupTestDatabase()
    app = createTestApp(prisma)
  })

  afterAll(async () => {
    await teardownTestDatabase()
  })

  beforeEach(async () => {
    await cleanupDatabase(prisma)
  })

  describe('happy path', () => {
    it('should return 200 with full artist profile', async () => {
      const artist = await createTestArtist(prisma, {
        displayName: 'Abbey Peters',
        slug: 'abbey-peters',
        categories: ['ceramics', 'mixed_media'],
      })

      // Add CV entries
      await prisma.artistCvEntry.createMany({
        data: [
          {
            artistId: artist.id,
            type: 'exhibition',
            title: 'Solo Show',
            institution: 'Gallery X',
            year: 2024,
            sortOrder: 0,
          },
          {
            artistId: artist.id,
            type: 'education',
            title: 'MFA Ceramics',
            institution: 'Art Institute',
            year: 2020,
            sortOrder: 1,
          },
        ],
      })

      // Add process media
      await prisma.artistProcessMedia.create({
        data: {
          artistId: artist.id,
          type: 'photo',
          url: 'https://cdn.example.com/process.jpg',
          sortOrder: 0,
        },
      })

      // Add listings
      await createTestListing(prisma, {
        artistId: artist.id,
        title: 'Ceramic Bowl',
        category: 'ceramics',
        status: 'available',
      })

      const res = await app.request('/artists/abbey-peters')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.displayName).toBe('Abbey Peters')
      expect(body.slug).toBe('abbey-peters')
      expect(body.bio).toBeTruthy()
      expect(body.categories).toEqual(
        expect.arrayContaining(['ceramics', 'mixed_media'])
      )
      expect(body.cvEntries).toHaveLength(2)
      expect(body.processMedia).toHaveLength(1)
      expect(body.listings).toHaveLength(1)
      expect(body.listings[0].title).toBe('Ceramic Bowl')
    })

    it('should include both available and sold listings', async () => {
      const artist = await createTestArtist(prisma, { slug: 'test-artist' })

      await createTestListing(prisma, {
        artistId: artist.id,
        status: 'available',
      })
      await createTestListing(prisma, {
        artistId: artist.id,
        status: 'sold',
      })

      const res = await app.request('/artists/test-artist')
      const body = await res.json()

      expect(body.listings).toHaveLength(2)
    })

    it('should return sorted CV entries by sortOrder', async () => {
      const artist = await createTestArtist(prisma, { slug: 'sorted-artist' })

      await prisma.artistCvEntry.createMany({
        data: [
          { artistId: artist.id, type: 'award', title: 'Second', year: 2023, sortOrder: 1 },
          { artistId: artist.id, type: 'exhibition', title: 'First', year: 2024, sortOrder: 0 },
        ],
      })

      const res = await app.request('/artists/sorted-artist')
      const body = await res.json()

      expect(body.cvEntries[0].title).toBe('First')
      expect(body.cvEntries[1].title).toBe('Second')
    })

    it('should return sorted images by sortOrder in listings', async () => {
      const artist = await createTestArtist(prisma, { slug: 'img-artist' })

      const listing = await prisma.listing.create({
        data: {
          artistId: artist.id,
          title: 'Test',
          description: 'Test',
          medium: 'Clay',
          category: 'ceramics',
          price: 10000,
          packedLength: 10,
          packedWidth: 10,
          packedHeight: 10,
          packedWeight: 5,
          images: {
            create: [
              { url: 'https://cdn.example.com/b.jpg', sortOrder: 1 },
              { url: 'https://cdn.example.com/a.jpg', sortOrder: 0 },
            ],
          },
        },
      })

      const res = await app.request('/artists/img-artist')
      const body = await res.json()

      const images = body.listings.find((l: { id: string }) => l.id === listing.id)?.images
      expect(images[0].url).toContain('a.jpg')
      expect(images[1].url).toContain('b.jpg')
    })
  })

  describe('edge cases', () => {
    it('should return 404 for non-existent slug', async () => {
      const res = await app.request('/artists/nonexistent-artist')
      expect(res.status).toBe(404)
    })

    it('should return 404 for suspended artist', async () => {
      await createTestArtist(prisma, {
        slug: 'suspended-artist',
        status: 'suspended',
      })

      const res = await app.request('/artists/suspended-artist')
      expect(res.status).toBe(404)
    })

    it('should return 404 for pending artist', async () => {
      await createTestArtist(prisma, {
        slug: 'pending-artist',
        status: 'pending',
      })

      const res = await app.request('/artists/pending-artist')
      expect(res.status).toBe(404)
    })

    it('should return empty arrays when artist has no related data', async () => {
      await createTestArtist(prisma, { slug: 'empty-artist' })

      const res = await app.request('/artists/empty-artist')
      const body = await res.json()

      expect(body.cvEntries).toEqual([])
      expect(body.processMedia).toEqual([])
      expect(body.listings).toEqual([])
    })

    it('should not reveal error details in 404 response', async () => {
      const res = await app.request('/artists/does-not-exist')
      const body = await res.json()

      expect(body.error).toBeTruthy()
      // Should not enumerate valid slugs or reveal internal details
      expect(JSON.stringify(body)).not.toContain('sql')
      expect(JSON.stringify(body)).not.toContain('prisma')
    })
  })
})
