import { Hono } from 'hono'
import type { PrismaClient, Prisma } from '@surfaced-art/db'
import { logger } from '@surfaced-art/utils'
import { adminUsersQuery, adminRoleGrantBody } from '@surfaced-art/types'
import type {
  AdminUserListItem,
  AdminUserDetailResponse,
  AdminRoleGrantResponse,
  AdminActionResponse,
  PaginatedResponse,
} from '@surfaced-art/types'
import type { AuthUser } from '../../middleware/auth'
import { notFound, forbidden, conflict, validationError, badRequest, internalError } from '../../errors'
import { logAdminAction } from '../../lib/audit'

export function createAdminUserRoutes(prisma: PrismaClient) {
  const app = new Hono<{ Variables: { user: AuthUser } }>()

  /**
   * GET /admin/users
   * Paginated user list with optional role/search filters.
   */
  app.get('/', async (c) => {
    const start = Date.now()

    const parsed = adminUsersQuery.safeParse({
      search: c.req.query('search'),
      role: c.req.query('role'),
      page: c.req.query('page'),
      limit: c.req.query('limit'),
    })

    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    const { search, role, page, limit } = parsed.data
    const skip = (page - 1) * limit

    const where: Prisma.UserWhereInput = {}

    if (role) {
      where.roles = { some: { role } }
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          roles: true,
          artistProfile: { select: { id: true } },
        },
      }),
      prisma.user.count({ where }),
    ])

    const data: AdminUserListItem[] = users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      roles: u.roles.map((r) => r.role),
      createdAt: u.createdAt.toISOString(),
      lastActiveAt: u.lastActiveAt?.toISOString() ?? null,
      hasArtistProfile: u.artistProfile !== null,
    }))

    const response: PaginatedResponse<AdminUserListItem> = {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }

    logger.info('Admin users listed', {
      page, limit, total,
      role: role ?? null,
      durationMs: Date.now() - start,
    })

    return c.json(response)
  })

  /**
   * GET /admin/users/:id
   * Full user detail with roles, artist profile, and stats.
   */
  app.get('/:id', async (c) => {
    const start = Date.now()
    const { id } = c.req.param()

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: true,
        artistProfile: { select: { id: true, displayName: true, slug: true, status: true } },
        _count: {
          select: {
            ordersAsBuyer: true,
            reviewsAsBuyer: true,
            saves: true,
            follows: true,
          },
        },
      },
    })

    if (!user) {
      return notFound(c, 'User not found')
    }

    const response: AdminUserDetailResponse = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      roles: user.roles.map((r) => ({
        role: r.role,
        grantedAt: r.grantedAt.toISOString(),
        grantedBy: r.grantedBy,
      })),
      createdAt: user.createdAt.toISOString(),
      lastActiveAt: user.lastActiveAt?.toISOString() ?? null,
      artistProfile: user.artistProfile
        ? {
            id: user.artistProfile.id,
            displayName: user.artistProfile.displayName,
            slug: user.artistProfile.slug,
            status: user.artistProfile.status,
          }
        : null,
      stats: {
        orderCount: user._count.ordersAsBuyer,
        reviewCount: user._count.reviewsAsBuyer,
        saveCount: user._count.saves,
        followCount: user._count.follows,
      },
    }

    logger.info('Admin user detail fetched', {
      userId: id,
      durationMs: Date.now() - start,
    })

    return c.json(response)
  })

  /**
   * POST /admin/users/:id/roles
   * Grant a role to a user. Cannot self-grant admin.
   */
  app.post('/:id/roles', async (c) => {
    const start = Date.now()
    const adminUser = c.get('user')
    const { id } = c.req.param()

    const body = await c.req.json().catch(() => ({}))
    const parsed = adminRoleGrantBody.safeParse(body)
    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    const { role } = parsed.data

    // Prevent self-granting admin
    if (id === adminUser.id && role === 'admin') {
      return forbidden(c, 'Cannot self-grant admin role')
    }

    try {
      const targetUser = await prisma.user.findUnique({ where: { id } })
      if (!targetUser) {
        return notFound(c, 'User not found')
      }

      // Check if role already exists
      const existing = await prisma.userRole.findUnique({
        where: { userId_role: { userId: id, role } },
      })
      if (existing) {
        return conflict(c, `User already has ${role} role`)
      }

      const newRole = await prisma.userRole.create({
        data: {
          userId: id,
          role,
          grantedBy: adminUser.id,
        },
      })

      // Audit log (fire-and-forget)
      void logAdminAction(prisma, {
        adminId: adminUser.id,
        action: 'role_grant',
        targetType: 'user',
        targetId: id,
        details: { role },
      })

      const response: AdminRoleGrantResponse = {
        message: `Role ${role} granted successfully`,
        role: {
          userId: id,
          role: newRole.role,
          grantedAt: newRole.grantedAt.toISOString(),
          grantedBy: adminUser.id,
        },
      }

      logger.info('Admin granted role', {
        targetUserId: id,
        role,
        grantedBy: adminUser.id,
        durationMs: Date.now() - start,
      })

      return c.json(response)
    } catch (err) {
      logger.error('Role grant failed', {
        targetUserId: id,
        role,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
      })
      return internalError(c)
    }
  })

  /**
   * DELETE /admin/users/:id/roles/:role
   * Revoke a role from a user. Cannot remove own admin role.
   */
  app.delete('/:id/roles/:role', async (c) => {
    const start = Date.now()
    const adminUser = c.get('user')
    const { id, role } = c.req.param()

    // Validate role path param against known roles
    const validRoles = ['buyer', 'artist', 'admin', 'curator', 'moderator'] as const
    type ValidRole = typeof validRoles[number]
    if (!validRoles.includes(role as ValidRole)) {
      return badRequest(c, `Invalid role: ${role}`)
    }
    const validatedRole = role as ValidRole

    // Prevent removing own admin role
    if (id === adminUser.id && validatedRole === 'admin') {
      return forbidden(c, 'Cannot remove your own admin role')
    }

    try {
      const targetUser = await prisma.user.findUnique({ where: { id } })
      if (!targetUser) {
        return notFound(c, 'User not found')
      }

      // Check if role exists
      const existing = await prisma.userRole.findUnique({
        where: { userId_role: { userId: id, role: validatedRole } },
      })
      if (!existing) {
        return notFound(c, `User does not have ${role} role`)
      }

      await prisma.userRole.delete({
        where: { userId_role: { userId: id, role: validatedRole } },
      })

      // Audit log (fire-and-forget)
      void logAdminAction(prisma, {
        adminId: adminUser.id,
        action: 'role_revoke',
        targetType: 'user',
        targetId: id,
        details: { role },
      })

      const response: AdminActionResponse = {
        message: `Role ${role} revoked successfully`,
      }

      logger.info('Admin revoked role', {
        targetUserId: id,
        role,
        revokedBy: adminUser.id,
        durationMs: Date.now() - start,
      })

      return c.json(response)
    } catch (err) {
      logger.error('Role revoke failed', {
        targetUserId: id,
        role,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
      })
      return internalError(c)
    }
  })

  return app
}
