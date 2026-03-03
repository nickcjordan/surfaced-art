import { Hono } from 'hono'
import type { PrismaClient, Prisma } from '@surfaced-art/db'
import { logger } from '@surfaced-art/utils'
import { adminAuditLogQuery } from '@surfaced-art/types'
import type {
  AdminAuditLogEntry,
  PaginatedResponse,
} from '@surfaced-art/types'
import type { AuthUser } from '../../middleware/auth'
import { validationError, notFound } from '../../errors'

export function createAdminAuditRoutes(prisma: PrismaClient) {
  const app = new Hono<{ Variables: { user: AuthUser } }>()

  /**
   * GET /admin/audit-log
   * Paginated audit log with filters for adminId, targetType, targetId, action, date range.
   */
  app.get('/', async (c) => {
    const start = Date.now()

    const parsed = adminAuditLogQuery.safeParse({
      adminId: c.req.query('adminId'),
      targetType: c.req.query('targetType'),
      targetId: c.req.query('targetId'),
      action: c.req.query('action'),
      dateFrom: c.req.query('dateFrom'),
      dateTo: c.req.query('dateTo'),
      page: c.req.query('page'),
      limit: c.req.query('limit'),
    })

    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    const { adminId, targetType, targetId, action, dateFrom, dateTo, page, limit } = parsed.data
    const skip = (page - 1) * limit

    const where: Prisma.AdminAuditLogWhereInput = {}

    if (adminId) where.adminId = adminId
    if (targetType) where.targetType = targetType
    if (targetId) where.targetId = targetId
    if (action) where.action = action

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }

    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: { select: { fullName: true } },
        },
      }),
      prisma.adminAuditLog.count({ where }),
    ])

    const data: AdminAuditLogEntry[] = logs.map((log) => ({
      id: log.id,
      adminId: log.adminId,
      adminName: log.admin.fullName,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      details: log.details as Record<string, unknown> | null,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt.toISOString(),
    }))

    const response: PaginatedResponse<AdminAuditLogEntry> = {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }

    logger.info('Admin audit log listed', {
      page, limit, total,
      durationMs: Date.now() - start,
    })

    return c.json(response)
  })

  /**
   * GET /admin/audit-log/user/:userId
   * Shortcut: all audit log entries where targetId matches the given user ID.
   */
  app.get('/user/:userId', async (c) => {
    const start = Date.now()
    const { userId } = c.req.param()

    // Validate userId is a valid UUID before using in query
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return notFound(c, 'User not found')
    }

    const parsed = adminAuditLogQuery.safeParse({
      page: c.req.query('page'),
      limit: c.req.query('limit'),
    })

    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    const { page, limit } = parsed.data
    const skip = (page - 1) * limit

    const where: Prisma.AdminAuditLogWhereInput = { targetId: userId }

    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: { select: { fullName: true } },
        },
      }),
      prisma.adminAuditLog.count({ where }),
    ])

    const data: AdminAuditLogEntry[] = logs.map((log) => ({
      id: log.id,
      adminId: log.adminId,
      adminName: log.admin.fullName,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      details: log.details as Record<string, unknown> | null,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt.toISOString(),
    }))

    const response: PaginatedResponse<AdminAuditLogEntry> = {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }

    logger.info('Admin audit log for user listed', {
      userId,
      page, limit, total,
      durationMs: Date.now() - start,
    })

    return c.json(response)
  })

  return app
}
