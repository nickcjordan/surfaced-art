import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { createArtistRoutes } from './artists'

// Mock artist data matching what Prisma would return
const mockApprovedArtist = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  userId: '550e8400-e29b-41d4-a716-446655440001',
  displayName: 'Abbey Peters',
  slug: 'abbey-peters',
  bio: 'A ceramic artist based in Portland.',
  location: 'Portland, OR',
  websiteUrl: 'https://abbeypeters.com',
  instagramUrl: 'https://instagram.com/abbeypeters',
  stripeAccountId: null,
  originZip: '97201',
  status: 'approved' as const,
  commissionsOpen: false,
  coverImageUrl: 'https://cdn.example.com/cover.jpg',
  profileImageUrl: 'https://cdn.example.com/profile.jpg',
  applicationSource: null,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  categories: [
    { id: 'cat-1', artistId: '550e8400-e29b-41d4-a716-446655440000', category: 'ceramics' },
    { id: 'cat-2', artistId: '550e8400-e29b-41d4-a716-446655440000', category: 'mixed_media' },
  ],
  cvEntries: [
    {
      id: 'cv-1',
      artistId: '550e8400-e29b-41d4-a716-446655440000',
      type: 'exhibition',
      title: 'Solo Show at Gallery X',
      institution: 'Gallery X',
      year: 2024,
      description: 'Solo exhibition featuring ceramic vessels.',
      sortOrder: 0,
    },
    {
      id: 'cv-2',
      artistId: '550e8400-e29b-41d4-a716-446655440000',
      type: 'education',
      title: 'MFA Ceramics',
      institution: 'Art Institute',
      year: 2020,
      description: null,
      sortOrder: 1,
    },
  ],
  processMedia: [
    {
      id: 'pm-1',
      artistId: '550e8400-e29b-41d4-a716-446655440000',
      type: 'photo',
      url: 'https://cdn.example.com/process1.jpg',
      videoAssetId: null,
      videoPlaybackId: null,
      videoProvider: null,
      sortOrder: 0,
      createdAt: new Date('2025-01-01T00:00:00Z'),
    },
  ],
  listings: [
    {
      id: 'listing-1',
      artistId: '550e8400-e29b-41d4-a716-446655440000',
      type: 'standard',
      title: 'Ceramic Vessel #1',
      description: 'A handmade ceramic vessel.',
      medium: 'Stoneware',
      category: 'ceramics',
      price: 12500,
      status: 'available',
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
          listingId: 'listing-1',
          url: 'https://cdn.example.com/listing1-front.jpg',
          isProcessPhoto: false,
          sortOrder: 0,
          createdAt: new Date('2025-02-01T00:00:00Z'),
        },
        {
          id: 'img-2',
          listingId: 'listing-1',
          url: 'https://cdn.example.com/listing1-back.jpg',
          isProcessPhoto: false,
          sortOrder: 1,
          createdAt: new Date('2025-02-01T00:00:00Z'),
        },
      ],
    },
    {
      id: 'listing-2',
      artistId: '550e8400-e29b-41d4-a716-446655440000',
      type: 'standard',
      title: 'Sold Piece',
      description: 'A previously sold piece.',
      medium: 'Porcelain',
      category: 'ceramics',
      price: 25000,
      status: 'sold',
      isDocumented: false,
      quantityTotal: 1,
      quantityRemaining: 0,
      artworkLength: null,
      artworkWidth: null,
      artworkHeight: null,
      packedLength: 10,
      packedWidth: 10,
      packedHeight: 14,
      packedWeight: 4,
      editionNumber: null,
      editionTotal: null,
      reservedUntil: null,
      createdAt: new Date('2025-01-15T00:00:00Z'),
      updatedAt: new Date('2025-01-20T00:00:00Z'),
      images: [],
    },
  ],
}

const mockPendingArtist = {
  ...mockApprovedArtist,
  id: '550e8400-e29b-41d4-a716-446655440002',
  slug: 'pending-artist',
  status: 'pending' as const,
}

function createMockPrisma(findUniqueResult: unknown = null, findManyResult: unknown[] = []) {
  return {
    artistProfile: {
      findUnique: vi.fn().mockResolvedValue(findUniqueResult),
      findMany: vi.fn().mockResolvedValue(findManyResult),
    },
  } as unknown as Parameters<typeof createArtistRoutes>[0]
}

function createTestApp(prisma: ReturnType<typeof createMockPrisma>) {
  const app = new Hono()
  app.route('/artists', createArtistRoutes(prisma))
  return app
}

describe('GET /artists/:slug', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>
  let app: ReturnType<typeof createTestApp>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('happy path', () => {
    beforeEach(() => {
      mockPrisma = createMockPrisma(mockApprovedArtist)
      app = createTestApp(mockPrisma)
    })

    it('should return 200 with full artist profile for a valid slug', async () => {
      const res = await app.request('/artists/abbey-peters')
      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data.displayName).toBe('Abbey Peters')
      expect(data.slug).toBe('abbey-peters')
      expect(data.bio).toBe('A ceramic artist based in Portland.')
      expect(data.location).toBe('Portland, OR')
    })

    it('should include categories as a flat string array', async () => {
      const res = await app.request('/artists/abbey-peters')
      const data = await res.json()

      expect(data.categories).toEqual(['ceramics', 'mixed_media'])
    })

    it('should include CV entries sorted by sort_order', async () => {
      const res = await app.request('/artists/abbey-peters')
      const data = await res.json()

      expect(data.cvEntries).toHaveLength(2)
      expect(data.cvEntries[0].title).toBe('Solo Show at Gallery X')
      expect(data.cvEntries[0].sortOrder).toBe(0)
      expect(data.cvEntries[1].title).toBe('MFA Ceramics')
      expect(data.cvEntries[1].sortOrder).toBe(1)
    })

    it('should include process media sorted by sort_order', async () => {
      const res = await app.request('/artists/abbey-peters')
      const data = await res.json()

      expect(data.processMedia).toHaveLength(1)
      expect(data.processMedia[0].url).toBe('https://cdn.example.com/process1.jpg')
      expect(data.processMedia[0].type).toBe('photo')
    })

    it('should include listings with images', async () => {
      const res = await app.request('/artists/abbey-peters')
      const data = await res.json()

      expect(data.listings).toHaveLength(2)

      // Available listing with images
      const available = data.listings.find((l: { status: string }) => l.status === 'available')
      expect(available.title).toBe('Ceramic Vessel #1')
      expect(available.price).toBe(12500)
      expect(available.images).toHaveLength(2)
      expect(available.images[0].sortOrder).toBe(0)

      // Sold listing
      const sold = data.listings.find((l: { status: string }) => l.status === 'sold')
      expect(sold.title).toBe('Sold Piece')
      expect(sold.images).toHaveLength(0)
    })

    it('should preserve zero-valued dimensions instead of coercing to null', async () => {
      const artistWithZeroDimensions = {
        ...mockApprovedArtist,
        listings: [
          {
            ...mockApprovedArtist.listings[0],
            artworkLength: 0,
            artworkWidth: 0,
            artworkHeight: 0,
          },
        ],
      }
      mockPrisma = createMockPrisma(artistWithZeroDimensions)
      app = createTestApp(mockPrisma)

      const res = await app.request('/artists/abbey-peters')
      const data = await res.json()

      expect(data.listings[0].artworkLength).toBe(0)
      expect(data.listings[0].artworkWidth).toBe(0)
      expect(data.listings[0].artworkHeight).toBe(0)
    })

    it('should omit private fields (userId, stripeAccountId, originZip, applicationSource)', async () => {
      const res = await app.request('/artists/abbey-peters')
      const data = await res.json()

      expect(data).not.toHaveProperty('userId')
      expect(data).not.toHaveProperty('stripeAccountId')
      expect(data).not.toHaveProperty('originZip')
      expect(data).not.toHaveProperty('applicationSource')
    })

    it('should call Prisma with correct query parameters', async () => {
      await app.request('/artists/abbey-peters')

      expect(mockPrisma.artistProfile.findUnique).toHaveBeenCalledWith({
        where: { slug: 'abbey-peters' },
        include: {
          categories: true,
          cvEntries: { orderBy: { sortOrder: 'asc' } },
          processMedia: { orderBy: { sortOrder: 'asc' } },
          listings: {
            include: {
              images: { orderBy: { sortOrder: 'asc' } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      })
    })
  })

  describe('404 for non-existent slug', () => {
    beforeEach(() => {
      mockPrisma = createMockPrisma(null)
      app = createTestApp(mockPrisma)
    })

    it('should return 404 when slug does not exist', async () => {
      const res = await app.request('/artists/nonexistent-artist')
      expect(res.status).toBe(404)

      const data = await res.json()
      expect(data.error.code).toBe('NOT_FOUND')
      expect(data.error.message).toBe('Artist not found')
    })
  })

  describe('404 for non-approved artists', () => {
    beforeEach(() => {
      mockPrisma = createMockPrisma(mockPendingArtist)
      app = createTestApp(mockPrisma)
    })

    it('should return 404 for pending artist', async () => {
      const res = await app.request('/artists/pending-artist')
      expect(res.status).toBe(404)

      const data = await res.json()
      expect(data.error.code).toBe('NOT_FOUND')
      expect(data.error.message).toBe('Artist not found')
    })

    it('should return 404 for suspended artist', async () => {
      const suspendedArtist = { ...mockApprovedArtist, status: 'suspended' }
      mockPrisma = createMockPrisma(suspendedArtist)
      app = createTestApp(mockPrisma)

      const res = await app.request('/artists/abbey-peters')
      expect(res.status).toBe(404)

      const data = await res.json()
      expect(data.error.code).toBe('NOT_FOUND')
      expect(data.error.message).toBe('Artist not found')
    })
  })
})

// Mock data for GET /artists list
const mockArtistListData = [
  {
    slug: 'abbey-peters',
    displayName: 'Abbey Peters',
    location: 'Portland, OR',
    profileImageUrl: 'https://cdn.example.com/profile1.jpg',
    coverImageUrl: 'https://cdn.example.com/cover1.jpg',
    categories: [
      { id: 'cat-1', artistId: '550e8400-e29b-41d4-a716-446655440000', category: 'ceramics' },
      { id: 'cat-2', artistId: '550e8400-e29b-41d4-a716-446655440000', category: 'mixed_media' },
    ],
  },
  {
    slug: 'david-morrison',
    displayName: 'David Morrison',
    location: 'Austin, TX',
    profileImageUrl: 'https://cdn.example.com/profile2.jpg',
    coverImageUrl: null,
    categories: [
      { id: 'cat-3', artistId: '550e8400-e29b-41d4-a716-446655440003', category: 'painting' },
    ],
  },
]

describe('GET /artists', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>
  let app: ReturnType<typeof createTestApp>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('happy path', () => {
    beforeEach(() => {
      mockPrisma = createMockPrisma(null, mockArtistListData)
      app = createTestApp(mockPrisma)
    })

    it('should return 200 with a list of featured artists', async () => {
      const res = await app.request('/artists')
      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data).toHaveLength(2)
      expect(data[0].displayName).toBe('Abbey Peters')
      expect(data[0].slug).toBe('abbey-peters')
      expect(data[1].displayName).toBe('David Morrison')
    })

    it('should flatten categories to string arrays', async () => {
      const res = await app.request('/artists')
      const data = await res.json()

      expect(data[0].categories).toEqual(['ceramics', 'mixed_media'])
      expect(data[1].categories).toEqual(['painting'])
    })

    it('should include coverImageUrl and profileImageUrl', async () => {
      const res = await app.request('/artists')
      const data = await res.json()

      expect(data[0].coverImageUrl).toBe('https://cdn.example.com/cover1.jpg')
      expect(data[0].profileImageUrl).toBe('https://cdn.example.com/profile1.jpg')
      expect(data[1].coverImageUrl).toBeNull()
    })

    it('should call Prisma with correct query for approved artists', async () => {
      await app.request('/artists')

      expect(mockPrisma.artistProfile.findMany).toHaveBeenCalledWith({
        where: { status: 'approved' },
        select: {
          slug: true,
          displayName: true,
          location: true,
          profileImageUrl: true,
          coverImageUrl: true,
          categories: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 4,
      })
    })

    it('should respect the limit query parameter', async () => {
      await app.request('/artists?limit=2')

      expect(mockPrisma.artistProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 2 })
      )
    })

    it('should cap limit at 20', async () => {
      await app.request('/artists?limit=100')

      expect(mockPrisma.artistProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 20 })
      )
    })
  })

  describe('empty results', () => {
    beforeEach(() => {
      mockPrisma = createMockPrisma(null, [])
      app = createTestApp(mockPrisma)
    })

    it('should return 200 with empty array when no artists exist', async () => {
      const res = await app.request('/artists')
      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data).toEqual([])
    })
  })
})
