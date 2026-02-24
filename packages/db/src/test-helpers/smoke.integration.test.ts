import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import type { PrismaClient } from '../generated/prisma/client.js'
import { setupTestDatabase, teardownTestDatabase, cleanupDatabase } from './setup.js'
import { createTestUser, createTestArtist, createTestListing } from './factories.js'

describe('Integration Test Smoke Test', () => {
  let prisma: PrismaClient

  beforeAll(async () => {
    prisma = await setupTestDatabase()
  })

  afterAll(async () => {
    await teardownTestDatabase()
  })

  beforeEach(async () => {
    await cleanupDatabase(prisma)
  })

  it('should create and read back a user', async () => {
    const user = await createTestUser(prisma, {
      email: 'smoke-test@example.com',
      fullName: 'Smoke Test User',
    })

    expect(user.id).toBeDefined()
    expect(user.email).toBe('smoke-test@example.com')
    expect(user.fullName).toBe('Smoke Test User')

    // Read it back
    const found = await prisma.user.findUnique({ where: { id: user.id } })
    expect(found).not.toBeNull()
    expect(found!.email).toBe('smoke-test@example.com')
  })

  it('should create an artist with categories', async () => {
    const artist = await createTestArtist(prisma, {
      displayName: 'Test Artist',
      slug: 'test-artist',
      categories: ['ceramics', 'painting'],
    })

    expect(artist.id).toBeDefined()
    expect(artist.displayName).toBe('Test Artist')
    expect(artist.slug).toBe('test-artist')
    expect(artist.status).toBe('approved')
    expect(artist.categories).toHaveLength(2)
    expect(artist.categories.map((c) => c.category).sort()).toEqual([
      'ceramics',
      'painting',
    ])
  })

  it('should create a listing with images', async () => {
    const listing = await createTestListing(prisma, {
      title: 'Test Vase',
      category: 'ceramics',
      price: 12500,
      withImages: 3,
    })

    expect(listing.id).toBeDefined()
    expect(listing.title).toBe('Test Vase')
    expect(listing.category).toBe('ceramics')
    expect(listing.price).toBe(12500)
    expect(listing.status).toBe('available')
    expect(listing.images).toHaveLength(3)
    expect(listing.artist).toBeDefined()
  })

  it('should isolate tests via cleanup', async () => {
    // After cleanup, the database should be empty
    const userCount = await prisma.user.count()
    expect(userCount).toBe(0)

    // Create a user
    await createTestUser(prisma)
    expect(await prisma.user.count()).toBe(1)
  })

  it('should enforce database constraints', async () => {
    // Unique email constraint
    await createTestUser(prisma, { email: 'unique@test.com' })

    await expect(
      createTestUser(prisma, { email: 'unique@test.com' })
    ).rejects.toThrow()
  })
})
