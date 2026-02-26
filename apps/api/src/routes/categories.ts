import { Hono } from 'hono'
import type { PrismaClient } from '@surfaced-art/db'
import { logger } from '@surfaced-art/utils'
import { Category, type CategoryWithCount } from '@surfaced-art/types'

const allCategories = Object.values(Category)

export function createCategoryRoutes(prisma: PrismaClient) {
  const categories = new Hono()

  /**
   * GET /categories
   * Returns all category enum values with a count of available listings in each.
   * Expired system reservations (reserved_until < now) are counted as available.
   */
  categories.get('/', async (c) => {
    const start = Date.now()
    const now = new Date()

    const [listingCounts, artistCounts] = await Promise.all([
      prisma.listing.groupBy({
        by: ['category'],
        _count: { id: true },
        where: {
          artist: { status: 'approved' },
          OR: [
            { status: 'available' },
            {
              status: 'reserved_system',
              reservedUntil: { lt: now },
            },
          ],
        },
      }),
      prisma.artistCategory.groupBy({
        by: ['category'],
        _count: { id: true },
        where: {
          artist: { status: 'approved' },
        },
      }),
    ])

    // Build lookup maps from the groupBy results
    const listingCountMap = new Map<string, number>()
    for (const row of listingCounts) {
      listingCountMap.set(row.category, row._count.id)
    }

    const artistCountMap = new Map<string, number>()
    for (const row of artistCounts) {
      artistCountMap.set(row.category, row._count.id)
    }

    // Return all categories in enum definition order, defaulting to 0
    const response: CategoryWithCount[] = allCategories.map((category) => ({
      category,
      count: listingCountMap.get(category) ?? 0,
      artistCount: artistCountMap.get(category) ?? 0,
    }))

    logger.info('Categories fetched', {
      categoriesWithListings: listingCounts.length,
      categoriesWithArtists: artistCounts.length,
      durationMs: Date.now() - start,
    })

    return c.json(response)
  })

  return categories
}
