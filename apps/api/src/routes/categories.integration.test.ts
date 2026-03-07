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

describe('GET /categories — integration', () => {
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

  it('should return all 4 categories even with no listings', async () => {
    const res = await app.request('/categories')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body).toHaveLength(4)

    const categoryNames = body.map((c: { category: string }) => c.category)
    expect(categoryNames).toContain('ceramics')
    expect(categoryNames).toContain('drawing_painting')
    expect(categoryNames).toContain('printmaking_photography')
    expect(categoryNames).toContain('mixed_media_3d')
  })

  it('should return count=0 for categories with no listings', async () => {
    const res = await app.request('/categories')
    const body = await res.json()

    for (const cat of body) {
      expect(cat.count).toBe(0)
    }
  })

  it('should count only available listings from approved artists', async () => {
    const artist = await createTestArtist(prisma, {
      status: 'approved',
      categories: ['ceramics'],
    })

    // Create available listings
    await createTestListing(prisma, {
      artistId: artist.id,
      category: 'ceramics',
      status: 'available',
    })
    await createTestListing(prisma, {
      artistId: artist.id,
      category: 'ceramics',
      status: 'available',
    })

    // Create a sold listing (should not be counted)
    await createTestListing(prisma, {
      artistId: artist.id,
      category: 'ceramics',
      status: 'sold',
    })

    const res = await app.request('/categories')
    const body = await res.json()

    const ceramics = body.find((c: { category: string }) => c.category === 'ceramics')
    expect(ceramics.count).toBe(2)
  })

  it('should not count listings from suspended artists', async () => {
    const suspended = await createTestArtist(prisma, {
      status: 'suspended',
      categories: ['drawing_painting'],
    })

    await createTestListing(prisma, {
      artistId: suspended.id,
      category: 'drawing_painting',
      status: 'available',
    })

    const res = await app.request('/categories')
    const body = await res.json()

    const painting = body.find((c: { category: string }) => c.category === 'drawing_painting')
    expect(painting.count).toBe(0)
  })

  it('should count expired system reservations as available', async () => {
    const artist = await createTestArtist(prisma, {
      status: 'approved',
      categories: ['mixed_media_3d'],
    })

    // Create a listing with expired reservation (treated as available)
    await prisma.listing.create({
      data: {
        artistId: artist.id,
        title: 'Expired reservation listing',
        description: 'Test',
        medium: 'Gold',
        category: 'mixed_media_3d',
        price: 50000,
        status: 'reserved_system',
        reservedUntil: new Date('2020-01-01'),
        packedLength: 6,
        packedWidth: 6,
        packedHeight: 3,
        packedWeight: 0.5,
      },
    })

    const res = await app.request('/categories')
    const body = await res.json()

    const jewelry = body.find((c: { category: string }) => c.category === 'mixed_media_3d')
    expect(jewelry.count).toBe(1)
  })

  it('should have consistent response shape', async () => {
    const res = await app.request('/categories')
    const body = await res.json()

    for (const cat of body) {
      expect(cat).toHaveProperty('category')
      expect(cat).toHaveProperty('count')
      expect(typeof cat.category).toBe('string')
      expect(typeof cat.count).toBe('number')
      expect(Number.isInteger(cat.count)).toBe(true)
    }
  })
})
