import { Hono } from 'hono'
import type { PrismaClient } from '@surfaced-art/db'
import { CategoryType } from '@surfaced-art/db'
import type { Tag } from '@surfaced-art/types'

const validCategories = new Set(Object.values(CategoryType))

export function createTagRoutes(prisma: PrismaClient) {
  const tags = new Hono()

  /**
   * GET /tags
   * Returns the platform tag vocabulary, ordered by category then sortOrder.
   * Optional ?category= filter to get tags for a specific category.
   */
  tags.get('/', async (c) => {
    const category = c.req.query('category')

    const where: Record<string, string> = {}
    if (category) {
      if (!validCategories.has(category as CategoryType)) {
        return c.json({ error: `Invalid category: ${category}` }, 400)
      }
      where.category = category
    }

    const results = await prisma.tag.findMany({
      where,
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    })

    const response: Tag[] = results.map((t) => ({
      id: t.id,
      slug: t.slug,
      label: t.label,
      category: t.category,
      sortOrder: t.sortOrder,
    }))

    return c.json(response)
  })

  return tags
}
