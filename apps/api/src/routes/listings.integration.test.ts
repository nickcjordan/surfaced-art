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

describe('Listings API — integration', () => {
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

  describe('GET /listings/:id', () => {
    it('should return 200 with full listing detail', async () => {
      const listing = await createTestListing(prisma, {
        title: 'Blue Vase',
        category: 'ceramics',
        price: 12500,
        withImages: 3,
      })

      const res = await app.request(`/listings/${listing.id}`)
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.id).toBe(listing.id)
      expect(body.title).toBe('Blue Vase')
      expect(body.category).toBe('ceramics')
      expect(body.price).toBe(12500)
      expect(body.images).toHaveLength(3)
      expect(body.artist).toBeDefined()
      expect(body.artist.displayName).toBeTruthy()
      expect(body.artist.slug).toBeTruthy()
    })

    it('should return images sorted by sortOrder', async () => {
      const artist = await createTestArtist(prisma)
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
              { url: 'https://cdn.example.com/c.jpg', sortOrder: 2 },
              { url: 'https://cdn.example.com/a.jpg', sortOrder: 0 },
              { url: 'https://cdn.example.com/b.jpg', sortOrder: 1 },
            ],
          },
        },
      })

      const res = await app.request(`/listings/${listing.id}`)
      const body = await res.json()

      expect(body.images[0].url).toContain('a.jpg')
      expect(body.images[1].url).toContain('b.jpg')
      expect(body.images[2].url).toContain('c.jpg')
    })

    it('should return price as integer (cents)', async () => {
      const listing = await createTestListing(prisma, { price: 15050 })

      const res = await app.request(`/listings/${listing.id}`)
      const body = await res.json()

      expect(body.price).toBe(15050)
      expect(Number.isInteger(body.price)).toBe(true)
    })

    it('should include artist categories', async () => {
      const artist = await createTestArtist(prisma, {
        categories: ['ceramics', 'painting'],
      })
      const listing = await createTestListing(prisma, { artistId: artist.id })

      const res = await app.request(`/listings/${listing.id}`)
      const body = await res.json()

      expect(body.artist.categories).toEqual(
        expect.arrayContaining(['ceramics', 'painting'])
      )
    })

    it('should return 404 for non-existent listing', async () => {
      const res = await app.request(
        '/listings/00000000-0000-0000-0000-000000000000'
      )
      expect(res.status).toBe(404)
    })

    it('should return 400 for invalid UUID', async () => {
      const res = await app.request('/listings/not-a-uuid')
      expect(res.status).toBe(400)
    })

    it('should return 404 for listing from suspended artist', async () => {
      const artist = await createTestArtist(prisma, { status: 'suspended' })
      const listing = await createTestListing(prisma, { artistId: artist.id })

      const res = await app.request(`/listings/${listing.id}`)
      expect(res.status).toBe(404)
    })

    it('should normalize expired system reservation to available', async () => {
      const artist = await createTestArtist(prisma)
      const listing = await prisma.listing.create({
        data: {
          artistId: artist.id,
          title: 'Expired reservation',
          description: 'Test',
          medium: 'Clay',
          category: 'ceramics',
          price: 10000,
          status: 'reserved_system',
          reservedUntil: new Date('2020-01-01'),
          packedLength: 10,
          packedWidth: 10,
          packedHeight: 10,
          packedWeight: 5,
        },
      })

      const res = await app.request(`/listings/${listing.id}`)
      const body = await res.json()

      expect(body.status).toBe('available')
      expect(body.reservedUntil).toBeNull()
    })
  })

  describe('GET /listings', () => {
    it('should default to available status filter', async () => {
      const artist = await createTestArtist(prisma)
      await createTestListing(prisma, {
        artistId: artist.id,
        status: 'available',
      })
      await createTestListing(prisma, {
        artistId: artist.id,
        status: 'sold',
      })

      const res = await app.request('/listings')
      const body = await res.json()

      expect(body.data).toHaveLength(1)
      expect(body.data[0].status).toBe('available')
    })

    it('should filter by category', async () => {
      const artist = await createTestArtist(prisma)
      await createTestListing(prisma, {
        artistId: artist.id,
        category: 'ceramics',
      })
      await createTestListing(prisma, {
        artistId: artist.id,
        category: 'painting',
      })

      const res = await app.request('/listings?category=ceramics')
      const body = await res.json()

      expect(body.data).toHaveLength(1)
      expect(body.data[0].category).toBe('ceramics')
    })

    it('should return 400 for invalid category', async () => {
      const res = await app.request('/listings?category=bogus')
      expect(res.status).toBe(400)
    })

    it('should filter by status', async () => {
      const artist = await createTestArtist(prisma)
      await createTestListing(prisma, {
        artistId: artist.id,
        status: 'sold',
      })
      await createTestListing(prisma, {
        artistId: artist.id,
        status: 'available',
      })

      const res = await app.request('/listings?status=sold')
      const body = await res.json()

      expect(body.data).toHaveLength(1)
      expect(body.data[0].status).toBe('sold')
    })

    it('should include primary image in list response', async () => {
      await createTestListing(prisma, { withImages: 3 })

      const res = await app.request('/listings')
      const body = await res.json()

      expect(body.data[0].primaryImage).toBeDefined()
      expect(body.data[0].primaryImage.url).toBeTruthy()
    })

    it('should include artist summary in list response', async () => {
      await createTestListing(prisma)

      const res = await app.request('/listings')
      const body = await res.json()

      expect(body.data[0].artist.displayName).toBeTruthy()
      expect(body.data[0].artist.slug).toBeTruthy()
    })

    it('should not show listings from suspended artists', async () => {
      const suspended = await createTestArtist(prisma, { status: 'suspended' })
      await createTestListing(prisma, { artistId: suspended.id })

      const res = await app.request('/listings')
      const body = await res.json()

      expect(body.data).toHaveLength(0)
    })

    describe('pagination', () => {
      it('should return paginated response with metadata', async () => {
        const artist = await createTestArtist(prisma)
        for (let i = 0; i < 5; i++) {
          await createTestListing(prisma, { artistId: artist.id })
        }

        const res = await app.request('/listings?limit=2&page=1')
        const body = await res.json()

        expect(body.data).toHaveLength(2)
        expect(body.meta.page).toBe(1)
        expect(body.meta.limit).toBe(2)
        expect(body.meta.total).toBe(5)
        expect(body.meta.totalPages).toBe(3)
      })

      it('should return correct second page', async () => {
        const artist = await createTestArtist(prisma)
        for (let i = 0; i < 5; i++) {
          await createTestListing(prisma, { artistId: artist.id })
        }

        const res = await app.request('/listings?limit=2&page=2')
        const body = await res.json()

        expect(body.data).toHaveLength(2)
        expect(body.meta.page).toBe(2)
      })

      it('should return empty data for page beyond total', async () => {
        const res = await app.request('/listings?page=999')
        const body = await res.json()

        expect(body.data).toHaveLength(0)
        expect(body.meta.total).toBe(0)
        expect(res.status).toBe(200)
      })

      it('should default to page=1 and limit=20', async () => {
        const res = await app.request('/listings')
        const body = await res.json()

        expect(body.meta.page).toBe(1)
        expect(body.meta.limit).toBe(20)
      })
    })
  })
})
