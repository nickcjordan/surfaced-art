import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { createCategoryRoutes } from './categories'
import { Category } from '@surfaced-art/types'

const allCategories = Object.values(Category)

function createMockPrisma(overrides?: {
  listingGroupBy?: unknown
  artistCategoryGroupBy?: unknown
}) {
  return {
    listing: {
      groupBy: vi.fn().mockResolvedValue(overrides?.listingGroupBy ?? []),
    },
    artistCategory: {
      groupBy: vi.fn().mockResolvedValue(overrides?.artistCategoryGroupBy ?? []),
    },
  } as unknown as Parameters<typeof createCategoryRoutes>[0]
}

function createTestApp(prisma: ReturnType<typeof createMockPrisma>) {
  const app = new Hono()
  app.route('/categories', createCategoryRoutes(prisma))
  return app
}

describe('GET /categories', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>
  let app: ReturnType<typeof createTestApp>

  describe('happy path', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockPrisma = createMockPrisma({
        listingGroupBy: [
          { category: 'ceramics', _count: { id: 5 } },
          { category: 'drawing_painting', _count: { id: 3 } },
          { category: 'printmaking_photography', _count: { id: 1 } },
        ],
        artistCategoryGroupBy: [
          { category: 'ceramics', _count: { id: 2 } },
          { category: 'drawing_painting', _count: { id: 1 } },
        ],
      })
      app = createTestApp(mockPrisma)
    })

    it('should return all 4 categories', async () => {
      const res = await app.request('/categories')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body).toHaveLength(4)
    })

    it('should include correct listing counts for categories with listings', async () => {
      const res = await app.request('/categories')
      const body = await res.json()

      const ceramics = body.find((c: { category: string }) => c.category === 'ceramics')
      expect(ceramics.count).toBe(5)

      const drawingPainting = body.find((c: { category: string }) => c.category === 'drawing_painting')
      expect(drawingPainting.count).toBe(3)

      const printmakingPhotography = body.find((c: { category: string }) => c.category === 'printmaking_photography')
      expect(printmakingPhotography.count).toBe(1)
    })

    it('should include correct artist counts', async () => {
      const res = await app.request('/categories')
      const body = await res.json()

      const ceramics = body.find((c: { category: string }) => c.category === 'ceramics')
      expect(ceramics.artistCount).toBe(2)

      const drawingPainting = body.find((c: { category: string }) => c.category === 'drawing_painting')
      expect(drawingPainting.artistCount).toBe(1)
    })

    it('should return count=0 and artistCount=0 for categories with no data', async () => {
      const res = await app.request('/categories')
      const body = await res.json()

      const mixedMedia3d = body.find((c: { category: string }) => c.category === 'mixed_media_3d')
      expect(mixedMedia3d).toEqual({ category: 'mixed_media_3d', count: 0, artistCount: 0 })
    })

    it('should return categories in enum definition order', async () => {
      const res = await app.request('/categories')
      const body = await res.json()

      const returnedCategories = body.map((c: { category: string }) => c.category)
      expect(returnedCategories).toEqual(allCategories)
    })

    it('should match CategoryWithCount shape', async () => {
      const res = await app.request('/categories')
      const body = await res.json()

      for (const item of body) {
        expect(item).toHaveProperty('category')
        expect(item).toHaveProperty('count')
        expect(item).toHaveProperty('artistCount')
        expect(typeof item.category).toBe('string')
        expect(typeof item.count).toBe('number')
        expect(typeof item.artistCount).toBe('number')
        expect(allCategories).toContain(item.category)
      }
    })
  })

  describe('expired reservations', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockPrisma = createMockPrisma({
        listingGroupBy: [{ category: 'ceramics', _count: { id: 2 } }],
        artistCategoryGroupBy: [],
      })
      app = createTestApp(mockPrisma)
    })

    it('should query with OR clause to include expired system reservations', async () => {
      await app.request('/categories')

      expect(mockPrisma.listing.groupBy).toHaveBeenCalledTimes(1)
      const callArgs = (mockPrisma.listing.groupBy as ReturnType<typeof vi.fn>).mock.calls[0][0]

      // Should have OR clause for available + expired reservations
      expect(callArgs.where.OR).toBeDefined()
      expect(callArgs.where.OR).toHaveLength(2)
      expect(callArgs.where.OR[0]).toEqual({ status: 'available' })
      expect(callArgs.where.OR[1]).toHaveProperty('status', 'reserved_system')
      expect(callArgs.where.OR[1].reservedUntil).toHaveProperty('lt')
    })

    it('should only count listings from approved artists', async () => {
      await app.request('/categories')

      const callArgs = (mockPrisma.listing.groupBy as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(callArgs.where.artist).toEqual({ status: 'approved' })
    })
  })

  describe('artist count query', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockPrisma = createMockPrisma({
        listingGroupBy: [],
        artistCategoryGroupBy: [{ category: 'ceramics', _count: { id: 3 } }],
      })
      app = createTestApp(mockPrisma)
    })

    it('should query artistCategory with approved artist filter', async () => {
      await app.request('/categories')

      expect(mockPrisma.artistCategory.groupBy).toHaveBeenCalledTimes(1)
      const callArgs = (mockPrisma.artistCategory.groupBy as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(callArgs.where.artist).toEqual({ status: 'approved' })
    })
  })

  describe('no listings at all', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockPrisma = createMockPrisma({ listingGroupBy: [], artistCategoryGroupBy: [] })
      app = createTestApp(mockPrisma)
    })

    it('should still return all 4 categories with count=0 and artistCount=0', async () => {
      const res = await app.request('/categories')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body).toHaveLength(4)
      for (const item of body) {
        expect(item.count).toBe(0)
        expect(item.artistCount).toBe(0)
      }
    })
  })
})
