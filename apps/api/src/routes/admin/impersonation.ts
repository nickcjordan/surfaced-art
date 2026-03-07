import { Hono } from 'hono'
import type { PrismaClient } from '@surfaced-art/db'
import { logger } from '@surfaced-art/utils'
import type { AdminUserDetailResponse } from '@surfaced-art/types'
import { myListingsQuery } from '@surfaced-art/types'
import type { AuthUser } from '../../middleware/auth'
import { notFound, validationError } from '../../errors'
import { logAdminAction } from '../../lib/audit'
import { fetchDashboard, fetchUserListings } from '../../lib/artist-queries'

export function createAdminImpersonationRoutes(prisma: PrismaClient) {
  const app = new Hono<{ Variables: { user: AuthUser } }>()

  /**
   * POST /admin/impersonate/:userId
   * Get user context — user detail + dashboard data (if artist).
   */
  app.post('/:userId', async (c) => {
    const start = Date.now()
    const adminUser = c.get('user')
    const { userId } = c.req.param()

    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    const userDetail: AdminUserDetailResponse = {
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

    const dashboard = user.artistProfile ? await fetchDashboard(prisma, userId) : null

    void logAdminAction(prisma, {
      adminId: adminUser.id,
      action: 'user.impersonate',
      targetType: 'user',
      targetId: userId,
    })

    logger.info('Admin impersonated user', {
      adminId: adminUser.id,
      targetUserId: userId,
      hasArtistProfile: user.artistProfile !== null,
      durationMs: Date.now() - start,
    })

    return c.json({ user: userDetail, dashboard })
  })

  /**
   * GET /admin/impersonate/:userId/dashboard
   * View artist dashboard as that user.
   */
  app.get('/:userId/dashboard', async (c) => {
    const start = Date.now()
    const adminUser = c.get('user')
    const { userId } = c.req.param()

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return notFound(c, 'User not found')
    }

    const dashboard = await fetchDashboard(prisma, userId)
    if (!dashboard) {
      return notFound(c, 'Artist profile not found')
    }

    void logAdminAction(prisma, {
      adminId: adminUser.id,
      action: 'user.impersonate',
      targetType: 'user',
      targetId: userId,
      details: { endpoint: 'dashboard' },
    })

    logger.info('Admin viewed user dashboard', {
      adminId: adminUser.id,
      targetUserId: userId,
      artistId: dashboard.profile.id,
      durationMs: Date.now() - start,
    })

    return c.json(dashboard)
  })

  /**
   * GET /admin/impersonate/:userId/listings
   * View user's listings with same query params as GET /me/listings.
   */
  app.get('/:userId/listings', async (c) => {
    const start = Date.now()
    const adminUser = c.get('user')
    const { userId } = c.req.param()

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return notFound(c, 'User not found')
    }

    const queryParsed = myListingsQuery.safeParse(Object.fromEntries(new URL(c.req.url).searchParams))
    if (!queryParsed.success) {
      return validationError(c, queryParsed.error)
    }

    const { page, limit, status, category } = queryParsed.data

    const result = await fetchUserListings(prisma, userId, { page, limit, status, category })
    if (!result) {
      return notFound(c, 'Artist profile not found')
    }

    void logAdminAction(prisma, {
      adminId: adminUser.id,
      action: 'user.impersonate',
      targetType: 'user',
      targetId: userId,
      details: { endpoint: 'listings' },
    })

    logger.info('Admin viewed user listings', {
      adminId: adminUser.id,
      targetUserId: userId,
      artistId: result.artistId,
      durationMs: Date.now() - start,
    })

    return c.json({ data: result.data, meta: result.meta })
  })

  return app
}
