import { Hono } from 'hono'
import type { PrismaClient, Prisma } from '@surfaced-art/db'
import { logger, isReservedSlug } from '@surfaced-art/utils'
import { adminArtistsQuery, adminArtistUpdateBody, adminSuspendBody } from '@surfaced-art/types'
import type {
  AdminArtistListItem,
  AdminArtistDetailResponse,
  AdminActionResponse,
  PaginatedResponse,
} from '@surfaced-art/types'
import type { AuthUser } from '../../middleware/auth'
import { notFound, validationError, internalError } from '../../errors'
import { logAdminAction } from '../../lib/audit'
import { triggerRevalidation } from '../../lib/revalidation'

export function createAdminArtistRoutes(prisma: PrismaClient) {
  const app = new Hono<{ Variables: { user: AuthUser } }>()

  /**
   * GET /admin/artists
   * Paginated artist list with optional status/search filters.
   */
  app.get('/', async (c) => {
    const start = Date.now()

    const parsed = adminArtistsQuery.safeParse({
      status: c.req.query('status'),
      search: c.req.query('search'),
      page: c.req.query('page'),
      limit: c.req.query('limit'),
    })

    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    const { status, search, page, limit } = parsed.data
    const skip = (page - 1) * limit

    const where: Prisma.ArtistProfileWhereInput = {}

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [artists, total] = await Promise.all([
      prisma.artistProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { listings: true } },
        },
      }),
      prisma.artistProfile.count({ where }),
    ])

    const data: AdminArtistListItem[] = artists.map((a) => ({
      id: a.id,
      userId: a.userId,
      displayName: a.displayName,
      slug: a.slug,
      status: a.status,
      listingCount: a._count.listings,
      isDemo: a.isDemo,
      createdAt: a.createdAt.toISOString(),
    }))

    const response: PaginatedResponse<AdminArtistListItem> = {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }

    logger.info('Admin artists listed', {
      page, limit, total,
      status: status ?? null,
      durationMs: Date.now() - start,
    })

    return c.json(response)
  })

  /**
   * GET /admin/artists/:id
   * Full artist detail including admin-only fields.
   */
  app.get('/:id', async (c) => {
    const start = Date.now()
    const { id } = c.req.param()

    const artist = await prisma.artistProfile.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, fullName: true, roles: true } },
        categories: true,
        _count: { select: { listings: true, followers: true } },
      },
    })

    if (!artist) {
      return notFound(c, 'Artist not found')
    }

    // Get listing stats
    const [availableCount, soldCount] = await Promise.all([
      prisma.listing.count({ where: { artistId: id, status: 'available' } }),
      prisma.listing.count({ where: { artistId: id, status: 'sold' } }),
    ])

    const response: AdminArtistDetailResponse = {
      id: artist.id,
      userId: artist.userId,
      displayName: artist.displayName,
      slug: artist.slug,
      bio: artist.bio,
      location: artist.location,
      websiteUrl: artist.websiteUrl,
      instagramUrl: artist.instagramUrl,
      originZip: artist.originZip,
      status: artist.status,
      commissionsOpen: artist.commissionsOpen,
      coverImageUrl: artist.coverImageUrl,
      profileImageUrl: artist.profileImageUrl,
      applicationSource: artist.applicationSource,
      isDemo: artist.isDemo,
      hasStripeAccount: artist.stripeAccountId !== null,
      createdAt: artist.createdAt.toISOString(),
      updatedAt: artist.updatedAt.toISOString(),
      user: {
        email: artist.user.email,
        fullName: artist.user.fullName,
        roles: artist.user.roles.map((r) => r.role),
      },
      categories: artist.categories.map((cat) => cat.category),
      stats: {
        totalListings: artist._count.listings,
        availableListings: availableCount,
        soldListings: soldCount,
        followerCount: artist._count.followers,
      },
    }

    logger.info('Admin artist detail fetched', {
      artistId: id,
      durationMs: Date.now() - start,
    })

    return c.json(response)
  })

  /**
   * PUT /admin/artists/:id
   * Update artist profile fields. Triggers ISR revalidation.
   */
  app.put('/:id', async (c) => {
    const start = Date.now()
    const adminUser = c.get('user')
    const { id } = c.req.param()

    const body = await c.req.json().catch(() => ({}))
    const parsed = adminArtistUpdateBody.safeParse(body)
    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    try {
      const artist = await prisma.artistProfile.findUnique({ where: { id } })
      if (!artist) {
        return notFound(c, 'Artist not found')
      }

      // If slug is being changed, check reserved slugs and uniqueness
      if (parsed.data.slug && parsed.data.slug !== artist.slug) {
        if (isReservedSlug(parsed.data.slug)) {
          return c.json(
            { error: { code: 'VALIDATION_ERROR', message: 'This slug is reserved and cannot be used' } },
            400,
          )
        }

        const existing = await prisma.artistProfile.findUnique({
          where: { slug: parsed.data.slug },
          select: { id: true },
        })
        if (existing) {
          return c.json(
            { error: { code: 'CONFLICT', message: 'Slug already in use' } },
            409,
          )
        }
      }

      const updated = await prisma.artistProfile.update({
        where: { id },
        data: parsed.data,
      })

      // Audit log (fire-and-forget)
      void logAdminAction(prisma, {
        adminId: adminUser.id,
        action: 'artist_update',
        targetType: 'artist',
        targetId: id,
        details: { fields: Object.keys(parsed.data) },
      })

      // Trigger ISR revalidation
      triggerRevalidation({
        type: 'listing',
        id: id,
        artistSlug: updated.slug,
      })

      const response: AdminActionResponse = {
        message: 'Artist profile updated successfully',
      }

      logger.info('Admin updated artist', {
        artistId: id,
        fields: Object.keys(parsed.data),
        updatedBy: adminUser.id,
        durationMs: Date.now() - start,
      })

      return c.json(response)
    } catch (err) {
      logger.error('Artist update failed', {
        artistId: id,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
      })
      return internalError(c)
    }
  })

  /**
   * POST /admin/artists/:id/suspend
   * Suspend an artist — hides their listings from public view.
   */
  app.post('/:id/suspend', async (c) => {
    const start = Date.now()
    const adminUser = c.get('user')
    const { id } = c.req.param()

    const body = await c.req.json().catch(() => ({}))
    const parsed = adminSuspendBody.safeParse(body)
    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    try {
      const artist = await prisma.artistProfile.findUnique({ where: { id } })
      if (!artist) {
        return notFound(c, 'Artist not found')
      }

      await prisma.artistProfile.update({
        where: { id },
        data: { status: 'suspended' },
      })

      // Audit log (fire-and-forget)
      void logAdminAction(prisma, {
        adminId: adminUser.id,
        action: 'artist_suspend',
        targetType: 'artist',
        targetId: id,
        details: { reason: parsed.data.reason },
      })

      triggerRevalidation({
        type: 'listing',
        id: id,
        artistSlug: artist.slug,
      })

      const response: AdminActionResponse = {
        message: 'Artist suspended successfully',
      }

      logger.info('Admin suspended artist', {
        artistId: id,
        suspendedBy: adminUser.id,
        durationMs: Date.now() - start,
      })

      return c.json(response)
    } catch (err) {
      logger.error('Artist suspend failed', {
        artistId: id,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
      })
      return internalError(c)
    }
  })

  /**
   * POST /admin/artists/:id/unsuspend
   * Restore a suspended artist to approved status.
   */
  app.post('/:id/unsuspend', async (c) => {
    const start = Date.now()
    const adminUser = c.get('user')
    const { id } = c.req.param()

    try {
      const artist = await prisma.artistProfile.findUnique({ where: { id } })
      if (!artist) {
        return notFound(c, 'Artist not found')
      }

      await prisma.artistProfile.update({
        where: { id },
        data: { status: 'approved' },
      })

      // Audit log (fire-and-forget)
      void logAdminAction(prisma, {
        adminId: adminUser.id,
        action: 'artist_unsuspend',
        targetType: 'artist',
        targetId: id,
      })

      triggerRevalidation({
        type: 'listing',
        id: id,
        artistSlug: artist.slug,
      })

      const response: AdminActionResponse = {
        message: 'Artist unsuspended successfully',
      }

      logger.info('Admin unsuspended artist', {
        artistId: id,
        unsuspendedBy: adminUser.id,
        durationMs: Date.now() - start,
      })

      return c.json(response)
    } catch (err) {
      logger.error('Artist unsuspend failed', {
        artistId: id,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
      })
      return internalError(c)
    }
  })

  return app
}
