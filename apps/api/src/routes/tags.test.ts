import { describe, it, expect, vi } from 'vitest'
import { Hono } from 'hono'
import { createTagRoutes } from './tags'
import type { PrismaClient } from '@surfaced-art/db'

function createMockPrisma(tags: unknown[] = []) {
  return {
    tag: {
      findMany: vi.fn().mockResolvedValue(tags),
    },
  } as unknown as PrismaClient
}

function createTestApp(prisma: PrismaClient) {
  const app = new Hono()
  app.route('/tags', createTagRoutes(prisma))
  return app
}

describe('GET /tags', () => {
  it('should return all tags ordered by category and sortOrder', async () => {
    const tags = [
      { id: 'tag-1', slug: 'oil', label: 'Oil', category: 'drawing_painting', sortOrder: 1 },
      { id: 'tag-2', slug: 'acrylic', label: 'Acrylic', category: 'drawing_painting', sortOrder: 2 },
      { id: 'tag-3', slug: 'stoneware', label: 'Stoneware', category: 'ceramics', sortOrder: 1 },
      { id: 'tag-4', slug: 'abstract', label: 'Abstract', category: null, sortOrder: 1 },
    ]
    const prisma = createMockPrisma(tags)
    const app = createTestApp(prisma)

    const res = await app.request('/tags')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body).toHaveLength(4)
    expect(body[0].slug).toBe('oil')
    expect(body[3].category).toBeNull()
  })

  it('should return empty array when no tags exist', async () => {
    const prisma = createMockPrisma([])
    const app = createTestApp(prisma)

    const res = await app.request('/tags')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body).toEqual([])
  })

  it('should filter tags by category when query param is provided', async () => {
    const tags = [
      { id: 'tag-1', slug: 'oil', label: 'Oil', category: 'drawing_painting', sortOrder: 1 },
    ]
    const prisma = createMockPrisma(tags)
    const app = createTestApp(prisma)

    const res = await app.request('/tags?category=drawing_painting')
    expect(res.status).toBe(200)

    // Verify findMany was called with category filter
    expect(prisma.tag.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { category: 'drawing_painting' },
      })
    )
  })

  it('should return tags without category filter when no query param', async () => {
    const prisma = createMockPrisma([])
    const app = createTestApp(prisma)

    await app.request('/tags')

    expect(prisma.tag.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
      })
    )
  })
})
