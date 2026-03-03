import { Hono } from 'hono'
import type { PrismaClient, Prisma } from '@surfaced-art/db'
import { logger } from '@surfaced-art/utils'
import { adminWaitlistQuery } from '@surfaced-art/types'
import type {
  AdminWaitlistEntry,
  AdminActionResponse,
  PaginatedResponse,
} from '@surfaced-art/types'
import type { AuthUser } from '../../middleware/auth'
import { notFound, validationError } from '../../errors'
import { logAdminAction } from '../../lib/audit'

export function createAdminPlatformRoutes(prisma: PrismaClient) {
  const app = new Hono<{ Variables: { user: AuthUser } }>()

  /**
   * GET /admin/waitlist
   * Paginated waitlist entries with optional email search.
   */
  app.get('/waitlist', async (c) => {
    const start = Date.now()

    const parsed = adminWaitlistQuery.safeParse({
      search: c.req.query('search'),
      page: c.req.query('page'),
      limit: c.req.query('limit'),
    })

    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    const { search, page, limit } = parsed.data
    const skip = (page - 1) * limit

    const where: Prisma.WaitlistWhereInput = {}

    if (search) {
      where.email = { contains: search, mode: 'insensitive' }
    }

    const [entries, total] = await Promise.all([
      prisma.waitlist.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.waitlist.count({ where }),
    ])

    const data: AdminWaitlistEntry[] = entries.map((e) => ({
      id: e.id,
      email: e.email,
      createdAt: e.createdAt.toISOString(),
    }))

    const response: PaginatedResponse<AdminWaitlistEntry> = {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }

    logger.info('Admin waitlist listed', {
      page, limit, total,
      durationMs: Date.now() - start,
    })

    return c.json(response)
  })

  /**
   * DELETE /admin/waitlist/:id
   * Remove a waitlist entry (spam cleanup).
   */
  app.delete('/waitlist/:id', async (c) => {
    const start = Date.now()
    const adminUser = c.get('user')
    const { id } = c.req.param()

    const entry = await prisma.waitlist.findUnique({ where: { id } })
    if (!entry) {
      return notFound(c, 'Waitlist entry not found')
    }

    await prisma.waitlist.delete({ where: { id } })

    // Audit log (fire-and-forget)
    void logAdminAction(prisma, {
      adminId: adminUser.id,
      action: 'waitlist_delete',
      targetType: 'waitlist',
      targetId: id,
      details: { email: entry.email },
    })

    const response: AdminActionResponse = {
      message: 'Waitlist entry deleted successfully',
    }

    logger.info('Admin deleted waitlist entry', {
      waitlistId: id,
      email: entry.email,
      deletedBy: adminUser.id,
      durationMs: Date.now() - start,
    })

    return c.json(response)
  })

  return app
}
