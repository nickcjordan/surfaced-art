import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { createSearchRoutes } from './search'

// Mock search results matching what $queryRaw would return
const mockListingResult = {
  id: '550e8400-e29b-41d4-a716-446655440010',
  title: 'Ceramic Vessel #1',
  medium: 'Stoneware',
  category: 'ceramics',
  price: 12500,
  status: 'available',
  primaryImageUrl: 'https://cdn.example.com/listing1-front.jpg',
  primaryImageWidth: null,
  primaryImageHeight: null,
  artistName: 'Abbey Peters',
  artistSlug: 'abbey-peters',
  rank: 0.075990885,
  totalCount: BigInt(1),
}

const mockArtistResult = {
  slug: 'abbey-peters',
  displayName: 'Abbey Peters',
  location: 'Portland, OR',
  profileImageUrl: 'https://cdn.example.com/profile.jpg',
  coverImageUrl: 'https://cdn.example.com/cover.jpg',
  categories: ['ceramics', 'mixed_media_3d'],
  rank: 0.06079271,
  totalCount: BigInt(1),
}

// Track which call to $queryRaw is which (listings first, artists second)
function createMockPrisma(overrides?: {
  listings?: unknown[]
  artists?: unknown[]
}) {
  let callCount = 0
  return {
    $queryRaw: vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) return Promise.resolve(overrides?.listings ?? [])
      return Promise.resolve(overrides?.artists ?? [])
    }),
  } as unknown as Parameters<typeof createSearchRoutes>[0]
}

function createTestApp(prisma: ReturnType<typeof createMockPrisma>) {
  const app = new Hono()
  app.route('/search', createSearchRoutes(prisma))
  return app
}

describe('GET /search', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>
  let app: ReturnType<typeof createTestApp>

  describe('happy path', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockPrisma = createMockPrisma({
        listings: [mockListingResult],
        artists: [mockArtistResult],
      })
      app = createTestApp(mockPrisma)
    })

    it('should return 200 with listings and artists for matching query', async () => {
      const res = await app.request('/search?q=ceramic')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.query).toBe('ceramic')
      expect(body.listings.data).toHaveLength(1)
      expect(body.listings.total).toBe(1)
      expect(body.listings.data[0].id).toBe(mockListingResult.id)
      expect(body.listings.data[0].title).toBe('Ceramic Vessel #1')
      expect(body.listings.data[0].price).toBe(12500)
      expect(body.listings.data[0].artistName).toBe('Abbey Peters')
      expect(body.listings.data[0].artistSlug).toBe('abbey-peters')
      expect(typeof body.listings.data[0].rank).toBe('number')

      expect(body.artists.data).toHaveLength(1)
      expect(body.artists.total).toBe(1)
      expect(body.artists.data[0].slug).toBe('abbey-peters')
      expect(body.artists.data[0].displayName).toBe('Abbey Peters')
      expect(body.artists.data[0].categories).toEqual(['ceramics', 'mixed_media_3d'])
      expect(typeof body.artists.data[0].rank).toBe('number')
    })

    it('should call $queryRaw twice (listings + artists)', async () => {
      await app.request('/search?q=ceramic')
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2)
    })
  })

  describe('empty results', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockPrisma = createMockPrisma({ listings: [], artists: [] })
      app = createTestApp(mockPrisma)
    })

    it('should return 200 with empty arrays for no-match query', async () => {
      const res = await app.request('/search?q=xyznonexistent')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.query).toBe('xyznonexistent')
      expect(body.listings.data).toEqual([])
      expect(body.listings.total).toBe(0)
      expect(body.artists.data).toEqual([])
      expect(body.artists.total).toBe(0)
    })
  })

  describe('validation errors', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockPrisma = createMockPrisma()
      app = createTestApp(mockPrisma)
    })

    it('should return 400 when q param is missing', async () => {
      const res = await app.request('/search')
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 when q is empty string', async () => {
      const res = await app.request('/search?q=')
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 when q exceeds 200 characters', async () => {
      const longQuery = 'x'.repeat(201)
      const res = await app.request(`/search?q=${longQuery}`)
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should not call $queryRaw on validation error', async () => {
      await app.request('/search')
      expect(mockPrisma.$queryRaw).not.toHaveBeenCalled()
    })
  })

  describe('pagination', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockPrisma = createMockPrisma({ listings: [], artists: [] })
      app = createTestApp(mockPrisma)
    })

    it('should accept page and limit query params', async () => {
      const res = await app.request('/search?q=test&page=2&limit=10')
      expect(res.status).toBe(200)
      // Verify the raw query was called (pagination is in the SQL)
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2)
    })
  })

  describe('sanitization', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockPrisma = createMockPrisma({ listings: [], artists: [] })
      app = createTestApp(mockPrisma)
    })

    it('should strip HTML tags from query', async () => {
      const res = await app.request('/search?q=%3Cb%3Eceramic%3C%2Fb%3E')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.query).toBe('ceramic')
    })
  })
})
