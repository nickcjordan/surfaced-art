import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { createCategoryRoutes } from './categories'
import { Category } from '@surfaced-art/types'

const allCategories = Object.values(Category)

function createMockPrisma(overrides?: {
  groupBy?: unknown
}) {
  return {
    listing: {
      groupBy: vi.fn().mockResolvedValue(overrides?.groupBy ?? []),
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
        groupBy: [
          { category: 'ceramics', _count: { id: 5 } },
          { category: 'painting', _count: { id: 3 } },
          { category: 'photography', _count: { id: 1 } },
        ],
      })
      app = createTestApp(mockPrisma)
    })

    it('should return all 9 categories', async () => {
      const res = await app.request('/categories')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body).toHaveLength(9)
    })

    it('should include correct counts for categories with listings', async () => {
      const res = await app.request('/categories')
      const body = await res.json()

      const ceramics = body.find((c: { category: string }) => c.category === 'ceramics')
      expect(ceramics).toEqual({ category: 'ceramics', count: 5 })

      const painting = body.find((c: { category: string }) => c.category === 'painting')
      expect(painting).toEqual({ category: 'painting', count: 3 })

      const photography = body.find((c: { category: string }) => c.category === 'photography')
      expect(photography).toEqual({ category: 'photography', count: 1 })
    })

    it('should return count=0 for categories with no listings', async () => {
      const res = await app.request('/categories')
      const body = await res.json()

      const jewelry = body.find((c: { category: string }) => c.category === 'jewelry')
      expect(jewelry).toEqual({ category: 'jewelry', count: 0 })

      const woodworking = body.find((c: { category: string }) => c.category === 'woodworking')
      expect(woodworking).toEqual({ category: 'woodworking', count: 0 })
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
        expect(typeof item.category).toBe('string')
        expect(typeof item.count).toBe('number')
        expect(allCategories).toContain(item.category)
      }
    })
  })

  describe('expired reservations', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockPrisma = createMockPrisma({
        groupBy: [{ category: 'ceramics', _count: { id: 2 } }],
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

  describe('no listings at all', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockPrisma = createMockPrisma({ groupBy: [] })
      app = createTestApp(mockPrisma)
    })

    it('should still return all 9 categories with count=0', async () => {
      const res = await app.request('/categories')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body).toHaveLength(9)
      for (const item of body) {
        expect(item.count).toBe(0)
      }
    })
  })
})
