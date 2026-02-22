import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { createListingRoutes } from './listings'

// Mock listing data matching what Prisma would return (for list endpoint — includes only primary image)
const mockListingForList = {
  id: '550e8400-e29b-41d4-a716-446655440010',
  artistId: '550e8400-e29b-41d4-a716-446655440000',
  type: 'standard' as const,
  title: 'Ceramic Vessel #1',
  description: 'A handmade ceramic vessel.',
  medium: 'Stoneware',
  category: 'ceramics',
  price: 12500,
  status: 'available' as const,
  isDocumented: true,
  quantityTotal: 1,
  quantityRemaining: 1,
  artworkLength: 8,
  artworkWidth: 8,
  artworkHeight: 12,
  packedLength: 12,
  packedWidth: 12,
  packedHeight: 16,
  packedWeight: 5,
  editionNumber: null,
  editionTotal: null,
  reservedUntil: null,
  createdAt: new Date('2025-02-01T00:00:00Z'),
  updatedAt: new Date('2025-02-01T00:00:00Z'),
  images: [
    {
      id: 'img-1',
      listingId: '550e8400-e29b-41d4-a716-446655440010',
      url: 'https://cdn.example.com/listing1-front.jpg',
      isProcessPhoto: false,
      sortOrder: 0,
      createdAt: new Date('2025-02-01T00:00:00Z'),
    },
  ],
  artist: {
    displayName: 'Abbey Peters',
    slug: 'abbey-peters',
    profileImageUrl: 'https://cdn.example.com/profile.jpg',
    location: 'Portland, OR',
    status: 'approved' as const,
  },
}

// Mock listing for detail endpoint — includes all images and artist with categories
const mockListingForDetail = {
  ...mockListingForList,
  images: [
    {
      id: 'img-1',
      listingId: '550e8400-e29b-41d4-a716-446655440010',
      url: 'https://cdn.example.com/listing1-front.jpg',
      isProcessPhoto: false,
      sortOrder: 0,
      createdAt: new Date('2025-02-01T00:00:00Z'),
    },
    {
      id: 'img-2',
      listingId: '550e8400-e29b-41d4-a716-446655440010',
      url: 'https://cdn.example.com/listing1-back.jpg',
      isProcessPhoto: false,
      sortOrder: 1,
      createdAt: new Date('2025-02-01T00:00:00Z'),
    },
    {
      id: 'img-3',
      listingId: '550e8400-e29b-41d4-a716-446655440010',
      url: 'https://cdn.example.com/listing1-process.jpg',
      isProcessPhoto: true,
      sortOrder: 2,
      createdAt: new Date('2025-02-01T00:00:00Z'),
    },
  ],
  artist: {
    ...mockListingForList.artist,
    categories: [
      { id: 'cat-1', artistId: '550e8400-e29b-41d4-a716-446655440000', category: 'ceramics' },
      { id: 'cat-2', artistId: '550e8400-e29b-41d4-a716-446655440000', category: 'mixed_media' },
    ],
  },
}

const mockListingNoImages = {
  ...mockListingForList,
  id: '550e8400-e29b-41d4-a716-446655440011',
  title: 'No Image Piece',
  images: [],
}

const mockListingNullDimensions = {
  ...mockListingForList,
  id: '550e8400-e29b-41d4-a716-446655440012',
  title: 'Flat Print',
  artworkLength: 24,
  artworkWidth: 18,
  artworkHeight: null,
}

const mockExpiredReservation = {
  ...mockListingForList,
  id: '550e8400-e29b-41d4-a716-446655440013',
  status: 'reserved_system' as const,
  reservedUntil: new Date('2024-01-01T00:00:00Z'), // In the past
}

function createMockPrisma(overrides?: {
  findMany?: unknown
  count?: unknown
  findUnique?: unknown
}) {
  return {
    listing: {
      findMany: vi.fn().mockResolvedValue(overrides?.findMany ?? []),
      count: vi.fn().mockResolvedValue(overrides?.count ?? 0),
      findUnique: vi.fn().mockResolvedValue(overrides?.findUnique ?? null),
    },
  } as unknown as Parameters<typeof createListingRoutes>[0]
}

function createTestApp(prisma: ReturnType<typeof createMockPrisma>) {
  const app = new Hono()
  app.route('/listings', createListingRoutes(prisma))
  return app
}

describe('GET /listings', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>
  let app: ReturnType<typeof createTestApp>

  describe('happy path', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockPrisma = createMockPrisma({
        findMany: [mockListingForList],
        count: 1,
      })
      app = createTestApp(mockPrisma)
    })

    it('should return paginated response with data and meta', async () => {
      const res = await app.request('/listings')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body).toHaveProperty('data')
      expect(body).toHaveProperty('meta')
      expect(body.meta).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      })
      expect(body.data).toHaveLength(1)
    })

    it('should include primaryImage and artist summary in each listing', async () => {
      const res = await app.request('/listings')
      const body = await res.json()
      const listing = body.data[0]

      expect(listing.primaryImage).toEqual({
        id: 'img-1',
        listingId: '550e8400-e29b-41d4-a716-446655440010',
        url: 'https://cdn.example.com/listing1-front.jpg',
        isProcessPhoto: false,
        sortOrder: 0,
        createdAt: '2025-02-01T00:00:00.000Z',
      })

      expect(listing.artist).toEqual({
        displayName: 'Abbey Peters',
        slug: 'abbey-peters',
        profileImageUrl: 'https://cdn.example.com/profile.jpg',
        location: 'Portland, OR',
      })
    })

    it('should not include full images array in list items', async () => {
      const res = await app.request('/listings')
      const body = await res.json()

      expect(body.data[0]).not.toHaveProperty('images')
    })
  })

  describe('pagination', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockPrisma = createMockPrisma({
        findMany: [],
        count: 50,
      })
      app = createTestApp(mockPrisma)
    })

    it('should respect page and limit query params', async () => {
      const res = await app.request('/listings?page=3&limit=5')
      expect(res.status).toBe(200)

      expect(mockPrisma.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
        })
      )

      const body = await res.json()
      expect(body.meta.page).toBe(3)
      expect(body.meta.limit).toBe(5)
      expect(body.meta.totalPages).toBe(10)
    })

    it('should default to page 1 and limit 20', async () => {
      await app.request('/listings')

      expect(mockPrisma.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        })
      )
    })

    it('should cap limit at 100', async () => {
      await app.request('/listings?limit=500')

      expect(mockPrisma.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      )
    })
  })

  describe('category filter', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockPrisma = createMockPrisma({
        findMany: [mockListingForList],
        count: 1,
      })
      app = createTestApp(mockPrisma)
    })

    it('should filter by valid category', async () => {
      const res = await app.request('/listings?category=ceramics')
      expect(res.status).toBe(200)

      expect(mockPrisma.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'ceramics',
          }),
        })
      )
    })

    it('should return 400 for invalid category', async () => {
      const res = await app.request('/listings?category=invalid_cat')
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.error).toContain('Invalid category')
    })
  })

  describe('status filter', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockPrisma = createMockPrisma({
        findMany: [],
        count: 0,
      })
      app = createTestApp(mockPrisma)
    })

    it('should default to filtering for available listings', async () => {
      await app.request('/listings')

      const call = mockPrisma.listing.findMany.mock.calls[0][0]
      expect(call.where.OR).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ status: 'available' }),
        ])
      )
    })

    it('should allow explicit status param', async () => {
      await app.request('/listings?status=sold')

      const call = mockPrisma.listing.findMany.mock.calls[0][0]
      expect(call.where.status).toBe('sold')
    })

    it('should return 400 for invalid status', async () => {
      const res = await app.request('/listings?status=bogus')
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.error).toContain('Invalid status')
    })
  })

  describe('empty results', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockPrisma = createMockPrisma({
        findMany: [],
        count: 0,
      })
      app = createTestApp(mockPrisma)
    })

    it('should return empty data array, not an error', async () => {
      const res = await app.request('/listings')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.data).toEqual([])
      expect(body.meta.total).toBe(0)
      expect(body.meta.totalPages).toBe(0)
    })
  })

  describe('no images', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockPrisma = createMockPrisma({
        findMany: [mockListingNoImages],
        count: 1,
      })
      app = createTestApp(mockPrisma)
    })

    it('should return null primaryImage when listing has no images', async () => {
      const res = await app.request('/listings')
      const body = await res.json()

      expect(body.data[0].primaryImage).toBeNull()
    })
  })

  describe('expired reservation', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockPrisma = createMockPrisma({
        findMany: [mockExpiredReservation],
        count: 1,
      })
      app = createTestApp(mockPrisma)
    })

    it('should treat expired reserved_system listing as available', async () => {
      const res = await app.request('/listings')
      const body = await res.json()

      expect(body.data[0].status).toBe('available')
      expect(body.data[0].reservedUntil).toBeNull()
    })
  })
})

describe('GET /listings/:id', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>
  let app: ReturnType<typeof createTestApp>

  describe('happy path', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockPrisma = createMockPrisma({
        findUnique: mockListingForDetail,
      })
      app = createTestApp(mockPrisma)
    })

    it('should return full listing detail with images and artist', async () => {
      const res = await app.request('/listings/550e8400-e29b-41d4-a716-446655440010')
      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data.title).toBe('Ceramic Vessel #1')
      expect(data.price).toBe(12500)
      expect(data.images).toHaveLength(3)
      expect(data.artist).toBeDefined()
    })

    it('should include all images sorted by sort_order', async () => {
      const res = await app.request('/listings/550e8400-e29b-41d4-a716-446655440010')
      const data = await res.json()

      expect(data.images[0].sortOrder).toBe(0)
      expect(data.images[1].sortOrder).toBe(1)
      expect(data.images[2].sortOrder).toBe(2)
      expect(data.images[2].isProcessPhoto).toBe(true)
    })

    it('should include artist categories as flat string array', async () => {
      const res = await app.request('/listings/550e8400-e29b-41d4-a716-446655440010')
      const data = await res.json()

      expect(data.artist.categories).toEqual(['ceramics', 'mixed_media'])
    })

    it('should include artist summary fields', async () => {
      const res = await app.request('/listings/550e8400-e29b-41d4-a716-446655440010')
      const data = await res.json()

      expect(data.artist.displayName).toBe('Abbey Peters')
      expect(data.artist.slug).toBe('abbey-peters')
      expect(data.artist.profileImageUrl).toBe('https://cdn.example.com/profile.jpg')
      expect(data.artist.location).toBe('Portland, OR')
    })

    it('should convert Decimal dimension fields to numbers', async () => {
      const res = await app.request('/listings/550e8400-e29b-41d4-a716-446655440010')
      const data = await res.json()

      expect(typeof data.artworkLength).toBe('number')
      expect(data.artworkLength).toBe(8)
      expect(typeof data.packedLength).toBe('number')
      expect(data.packedLength).toBe(12)
    })

    it('should call Prisma with correct query parameters', async () => {
      await app.request('/listings/550e8400-e29b-41d4-a716-446655440010')

      expect(mockPrisma.listing.findUnique).toHaveBeenCalledWith({
        where: { id: '550e8400-e29b-41d4-a716-446655440010' },
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          artist: {
            select: {
              displayName: true,
              slug: true,
              profileImageUrl: true,
              location: true,
              status: true,
              categories: true,
            },
          },
        },
      })
    })
  })

  describe('null dimensions', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockPrisma = createMockPrisma({
        findUnique: {
          ...mockListingForDetail,
          ...mockListingNullDimensions,
          artist: mockListingForDetail.artist,
        },
      })
      app = createTestApp(mockPrisma)
    })

    it('should preserve null artwork dimensions', async () => {
      const res = await app.request('/listings/550e8400-e29b-41d4-a716-446655440012')
      const data = await res.json()

      expect(data.artworkLength).toBe(24)
      expect(data.artworkWidth).toBe(18)
      expect(data.artworkHeight).toBeNull()
    })
  })

  describe('expired reservation on detail', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockPrisma = createMockPrisma({
        findUnique: {
          ...mockListingForDetail,
          status: 'reserved_system',
          reservedUntil: new Date('2024-01-01T00:00:00Z'),
        },
      })
      app = createTestApp(mockPrisma)
    })

    it('should treat expired reservation as available', async () => {
      const res = await app.request('/listings/550e8400-e29b-41d4-a716-446655440010')
      const data = await res.json()

      expect(data.status).toBe('available')
      expect(data.reservedUntil).toBeNull()
    })
  })

  describe('404 for non-existent listing', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockPrisma = createMockPrisma({ findUnique: null })
      app = createTestApp(mockPrisma)
    })

    it('should return 404 when listing does not exist', async () => {
      const res = await app.request('/listings/550e8400-e29b-41d4-a716-446655440099')
      expect(res.status).toBe(404)

      const data = await res.json()
      expect(data.error).toBe('Listing not found')
    })
  })

  describe('404 for listing from non-approved artist', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockPrisma = createMockPrisma({
        findUnique: {
          ...mockListingForDetail,
          artist: {
            ...mockListingForDetail.artist,
            status: 'pending',
          },
        },
      })
      app = createTestApp(mockPrisma)
    })

    it('should return 404 when artist is not approved', async () => {
      const res = await app.request('/listings/550e8400-e29b-41d4-a716-446655440010')
      expect(res.status).toBe(404)

      const data = await res.json()
      expect(data.error).toBe('Listing not found')
    })
  })

  describe('400 for invalid UUID', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockPrisma = createMockPrisma()
      app = createTestApp(mockPrisma)
    })

    it('should return 400 for invalid UUID format', async () => {
      const res = await app.request('/listings/not-a-valid-uuid')
      expect(res.status).toBe(400)

      const data = await res.json()
      expect(data.error).toBe('Invalid listing ID format')
    })

    it('should not call Prisma for invalid UUID', async () => {
      await app.request('/listings/not-a-valid-uuid')

      expect(mockPrisma.listing.findUnique).not.toHaveBeenCalled()
    })
  })
})
