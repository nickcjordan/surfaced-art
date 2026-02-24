import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import type { PrismaClient } from '../generated/prisma/client.js'
import { setupTestDatabase, teardownTestDatabase, cleanupDatabase } from './setup.js'
import { createTestUser, createTestArtist, createTestListing } from './factories.js'

describe('Database Schema & Constraints — integration', () => {
  let prisma: PrismaClient

  beforeAll(async () => {
    prisma = await setupTestDatabase()
  }, 60_000)

  afterAll(async () => {
    await teardownTestDatabase()
  }, 30_000)

  beforeEach(async () => {
    await cleanupDatabase(prisma)
  })

  describe('enum enforcement', () => {
    it('should reject invalid artist status', async () => {
      const user = await createTestUser(prisma)
      await expect(
        prisma.$executeRawUnsafe(
          `INSERT INTO "artist_profiles" (id, user_id, display_name, slug, bio, location, origin_zip, status)
           VALUES (gen_random_uuid(), $1, 'Test', 'test', 'bio', 'NYC', '10001', 'bogus')`,
          user.id
        )
      ).rejects.toThrow()
    })

    it('should reject invalid listing status', async () => {
      const artist = await createTestArtist(prisma)
      await expect(
        prisma.$executeRawUnsafe(
          `INSERT INTO "listings" (id, artist_id, title, description, medium, category, price, status,
            packed_length, packed_width, packed_height, packed_weight)
           VALUES (gen_random_uuid(), $1, 'Test', 'desc', 'Clay', 'ceramics', 10000, 'bogus',
            10, 10, 10, 5)`,
          artist.id
        )
      ).rejects.toThrow()
    })

    it('should reject invalid category', async () => {
      const artist = await createTestArtist(prisma)
      await expect(
        prisma.$executeRawUnsafe(
          `INSERT INTO "listings" (id, artist_id, title, description, medium, category, price, status,
            packed_length, packed_width, packed_height, packed_weight)
           VALUES (gen_random_uuid(), $1, 'Test', 'desc', 'Clay', 'bogus_category', 10000, 'available',
            10, 10, 10, 5)`,
          artist.id
        )
      ).rejects.toThrow()
    })

    it('should accept all valid CategoryType values', async () => {
      const validCategories = [
        'ceramics',
        'painting',
        'print',
        'jewelry',
        'illustration',
        'photography',
        'woodworking',
        'fibers',
        'mixed_media',
      ]
      const artist = await createTestArtist(prisma)

      for (const category of validCategories) {
        const listing = await prisma.listing.create({
          data: {
            artistId: artist.id,
            title: `Test ${category}`,
            description: 'Test',
            medium: 'Mixed',
            category: category as 'ceramics',
            price: 10000,
            packedLength: 10,
            packedWidth: 10,
            packedHeight: 10,
            packedWeight: 5,
          },
        })
        expect(listing.category).toBe(category)
      }
    })

    it('should accept all valid ListingStatusType values', async () => {
      const artist = await createTestArtist(prisma)
      const statuses = ['available', 'reserved_system', 'reserved_artist', 'sold'] as const

      for (const status of statuses) {
        const listing = await prisma.listing.create({
          data: {
            artistId: artist.id,
            title: `Test ${status}`,
            description: 'Test',
            medium: 'Mixed',
            category: 'ceramics',
            price: 10000,
            status,
            packedLength: 10,
            packedWidth: 10,
            packedHeight: 10,
            packedWeight: 5,
          },
        })
        expect(listing.status).toBe(status)
      }
    })
  })

  describe('unique constraints', () => {
    it('should enforce unique email on users', async () => {
      await createTestUser(prisma, { email: 'unique@test.com' })
      await expect(
        createTestUser(prisma, { email: 'unique@test.com' })
      ).rejects.toThrow()
    })

    it('should enforce unique cognitoId on users', async () => {
      const cognitoId = 'cognito-unique-test-id'
      await createTestUser(prisma, { cognitoId })
      await expect(
        createTestUser(prisma, { cognitoId })
      ).rejects.toThrow()
    })

    it('should enforce unique slug on artist profiles', async () => {
      await createTestArtist(prisma, { slug: 'unique-slug' })
      await expect(
        createTestArtist(prisma, { slug: 'unique-slug' })
      ).rejects.toThrow()
    })

    it('should enforce one artist profile per user', async () => {
      const user = await createTestUser(prisma)
      await createTestArtist(prisma, { userId: user.id })
      await expect(
        createTestArtist(prisma, { userId: user.id })
      ).rejects.toThrow()
    })

    it('should enforce unique artist-category pair', async () => {
      const artist = await createTestArtist(prisma, { categories: ['ceramics'] })
      await expect(
        prisma.artistCategory.create({
          data: { artistId: artist.id, category: 'ceramics' },
        })
      ).rejects.toThrow()
    })

    it('should enforce unique user-role pair', async () => {
      const user = await createTestUser(prisma)
      await prisma.userRole.create({
        data: { userId: user.id, role: 'buyer' },
      })
      await expect(
        prisma.userRole.create({
          data: { userId: user.id, role: 'buyer' },
        })
      ).rejects.toThrow()
    })

    it('should enforce unique waitlist email', async () => {
      await prisma.waitlist.create({ data: { email: 'waitlist@test.com' } })
      await expect(
        prisma.waitlist.create({ data: { email: 'waitlist@test.com' } })
      ).rejects.toThrow()
    })
  })

  describe('foreign key relationships', () => {
    it('should reject listing with non-existent artist', async () => {
      await expect(
        prisma.listing.create({
          data: {
            artistId: '00000000-0000-0000-0000-000000000000',
            title: 'Orphan',
            description: 'Test',
            medium: 'Clay',
            category: 'ceramics',
            price: 10000,
            packedLength: 10,
            packedWidth: 10,
            packedHeight: 10,
            packedWeight: 5,
          },
        })
      ).rejects.toThrow()
    })

    it('should reject artist category with non-existent artist', async () => {
      await expect(
        prisma.artistCategory.create({
          data: {
            artistId: '00000000-0000-0000-0000-000000000000',
            category: 'ceramics',
          },
        })
      ).rejects.toThrow()
    })

    it('should reject listing image with non-existent listing', async () => {
      await expect(
        prisma.listingImage.create({
          data: {
            listingId: '00000000-0000-0000-0000-000000000000',
            url: 'https://example.com/img.jpg',
            sortOrder: 0,
          },
        })
      ).rejects.toThrow()
    })

    it('should cascade delete listing images when listing is deleted', async () => {
      const listing = await createTestListing(prisma, { withImages: 3 })
      const imageCount = await prisma.listingImage.count({
        where: { listingId: listing.id },
      })
      expect(imageCount).toBe(3)

      await prisma.listing.delete({ where: { id: listing.id } })

      const remaining = await prisma.listingImage.count({
        where: { listingId: listing.id },
      })
      expect(remaining).toBe(0)
    })

    it('should cascade delete listings when artist is deleted', async () => {
      const artist = await createTestArtist(prisma)
      await createTestListing(prisma, { artistId: artist.id })
      await createTestListing(prisma, { artistId: artist.id })

      const listingCount = await prisma.listing.count({
        where: { artistId: artist.id },
      })
      expect(listingCount).toBe(2)

      await prisma.artistProfile.delete({ where: { id: artist.id } })

      const remaining = await prisma.listing.count({
        where: { artistId: artist.id },
      })
      expect(remaining).toBe(0)
    })

    it('should cascade delete artist profile when user is deleted', async () => {
      const artist = await createTestArtist(prisma)
      const userId = artist.userId

      await prisma.user.delete({ where: { id: userId } })

      const profile = await prisma.artistProfile.findUnique({
        where: { id: artist.id },
      })
      expect(profile).toBeNull()
    })
  })

  describe('required fields and defaults', () => {
    it('should reject listing without required packed dimensions', async () => {
      const artist = await createTestArtist(prisma)
      await expect(
        prisma.$executeRawUnsafe(
          `INSERT INTO "listings" (id, artist_id, title, description, medium, category, price)
           VALUES (gen_random_uuid(), $1, 'Test', 'desc', 'Clay', 'ceramics', 10000)`,
          artist.id
        )
      ).rejects.toThrow()
    })

    it('should default listing status to available', async () => {
      const listing = await createTestListing(prisma)
      expect(listing.status).toBe('available')
    })

    it('should default listing type to standard', async () => {
      const listing = await createTestListing(prisma)
      expect(listing.type).toBe('standard')
    })

    it('should default artist status to pending', async () => {
      const user = await createTestUser(prisma)
      const artist = await prisma.artistProfile.create({
        data: {
          userId: user.id,
          displayName: 'Default Status Artist',
          slug: 'default-status-artist',
          bio: 'Testing defaults',
          location: 'NYC',
          originZip: '10001',
        },
      })
      expect(artist.status).toBe('pending')
    })

    it('should default commissionsOpen to false', async () => {
      const user = await createTestUser(prisma)
      const artist = await prisma.artistProfile.create({
        data: {
          userId: user.id,
          displayName: 'Commissions Test',
          slug: 'commissions-test',
          bio: 'Testing commissions default',
          location: 'NYC',
          originZip: '10001',
        },
      })
      expect(artist.commissionsOpen).toBe(false)
    })

    it('should auto-generate UUIDs for primary keys', async () => {
      const user = await createTestUser(prisma)
      expect(user.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      )
    })

    it('should auto-set createdAt timestamp', async () => {
      const user = await createTestUser(prisma)
      expect(user.createdAt).toBeInstanceOf(Date)
      // Should be recent (within last minute)
      const ageMs = Date.now() - user.createdAt.getTime()
      expect(ageMs).toBeLessThan(60_000)
    })

    it('should allow nullable artwork dimensions', async () => {
      const artist = await createTestArtist(prisma)
      const listing = await prisma.listing.create({
        data: {
          artistId: artist.id,
          title: 'No artwork dimensions',
          description: 'Test',
          medium: 'Clay',
          category: 'ceramics',
          price: 10000,
          packedLength: 10,
          packedWidth: 10,
          packedHeight: 10,
          packedWeight: 5,
          // artworkLength, artworkWidth, artworkHeight intentionally omitted
        },
      })
      expect(listing.artworkLength).toBeNull()
      expect(listing.artworkWidth).toBeNull()
      expect(listing.artworkHeight).toBeNull()
    })
  })

  describe('monetary values stored as integers', () => {
    it('should store price as integer (cents)', async () => {
      const listing = await createTestListing(prisma, { price: 12500 })
      expect(listing.price).toBe(12500)
      expect(Number.isInteger(listing.price)).toBe(true)
    })

    it('should store and retrieve exact cent values', async () => {
      const listing = await createTestListing(prisma, { price: 99999 })
      const fetched = await prisma.listing.findUnique({
        where: { id: listing.id },
      })
      expect(fetched!.price).toBe(99999)
    })
  })
})
