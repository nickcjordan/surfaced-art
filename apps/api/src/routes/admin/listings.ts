import { Hono } from 'hono'
import type { PrismaClient, Prisma, Listing, ListingImage } from '@surfaced-art/db'
import { logger } from '@surfaced-art/utils'
import { adminListingsQuery, adminListingUpdateBody, adminListingHideBody } from '@surfaced-art/types'
import type {
  AdminListingListItem,
  AdminListingDetailResponse,
  AdminActionResponse,
  PaginatedResponse,
} from '@surfaced-art/types'
import type { AuthUser } from '../../middleware/auth'
import { notFound, validationError, internalError } from '../../errors'
import { logAdminAction } from '../../lib/audit'
import { triggerRevalidation } from '../../lib/revalidation'

/**
 * Transform Prisma Decimal fields to plain numbers for API response.
 */
function transformDecimalFields(listing: Listing) {
  return {
    artworkLength: listing.artworkLength != null ? Number(listing.artworkLength) : null,
    artworkWidth: listing.artworkWidth != null ? Number(listing.artworkWidth) : null,
    artworkHeight: listing.artworkHeight != null ? Number(listing.artworkHeight) : null,
    packedLength: Number(listing.packedLength),
    packedWidth: Number(listing.packedWidth),
    packedHeight: Number(listing.packedHeight),
    packedWeight: Number(listing.packedWeight),
  }
}

export function createAdminListingRoutes(prisma: PrismaClient) {
  const app = new Hono<{ Variables: { user: AuthUser } }>()

  /**
   * GET /admin/listings
   * Paginated listing list with filters for status, artist, category, price, search.
   */
  app.get('/', async (c) => {
    const start = Date.now()

    const parsed = adminListingsQuery.safeParse({
      status: c.req.query('status'),
      artistId: c.req.query('artistId'),
      category: c.req.query('category'),
      priceMin: c.req.query('priceMin'),
      priceMax: c.req.query('priceMax'),
      search: c.req.query('search'),
      page: c.req.query('page'),
      limit: c.req.query('limit'),
    })

    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    const { status, artistId, category, priceMin, priceMax, search, page, limit } = parsed.data
    const skip = (page - 1) * limit

    const where: Prisma.ListingWhereInput = {}

    if (status) {
      where.status = status as Prisma.ListingWhereInput['status']
    }

    if (artistId) {
      where.artistId = artistId
    }

    if (category) {
      where.category = category as Prisma.ListingWhereInput['category']
    }

    if (priceMin !== undefined || priceMax !== undefined) {
      where.price = {}
      if (priceMin !== undefined) where.price.gte = priceMin
      if (priceMax !== undefined) where.price.lte = priceMax
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    type ListingWithRelations = Listing & {
      images: ListingImage[]
      artist: { displayName: string; slug: string }
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          artist: { select: { displayName: true, slug: true } },
        },
      }) as Promise<ListingWithRelations[]>,
      prisma.listing.count({ where }),
    ])

    const data: AdminListingListItem[] = listings.map((listing) => {
      const decimals = transformDecimalFields(listing)
      const primaryImage = listing.images[0]
        ? {
            id: listing.images[0].id,
            listingId: listing.images[0].listingId,
            url: listing.images[0].url,
            isProcessPhoto: listing.images[0].isProcessPhoto,
            sortOrder: listing.images[0].sortOrder,
            createdAt: listing.images[0].createdAt,
          }
        : null

      return {
        id: listing.id,
        artistId: listing.artistId,
        type: listing.type,
        title: listing.title,
        description: listing.description,
        medium: listing.medium,
        category: listing.category,
        price: listing.price,
        status: listing.status,
        isDocumented: listing.isDocumented,
        quantityTotal: listing.quantityTotal,
        quantityRemaining: listing.quantityRemaining,
        ...decimals,
        editionNumber: listing.editionNumber,
        editionTotal: listing.editionTotal,
        reservedUntil: listing.reservedUntil,
        createdAt: listing.createdAt,
        updatedAt: listing.updatedAt,
        primaryImage,
        artist: {
          displayName: listing.artist.displayName,
          slug: listing.artist.slug,
        },
      }
    })

    const response: PaginatedResponse<AdminListingListItem> = {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }

    logger.info('Admin listings listed', {
      page, limit, total,
      status: status ?? null,
      durationMs: Date.now() - start,
    })

    return c.json(response)
  })

  /**
   * GET /admin/listings/:id
   * Full listing detail with order and review counts.
   */
  app.get('/:id', async (c) => {
    const start = Date.now()
    const { id } = c.req.param()

    type ListingDetail = Listing & {
      images: ListingImage[]
      artist: { id: string; displayName: string; slug: string; status: string }
      _count: { orders: number; reviews: number }
    }

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        artist: { select: { id: true, displayName: true, slug: true, status: true } },
        _count: { select: { orders: true, reviews: true } },
      },
    }) as ListingDetail | null

    if (!listing) {
      return notFound(c, 'Listing not found')
    }

    const decimals = transformDecimalFields(listing)

    const response: AdminListingDetailResponse = {
      id: listing.id,
      artistId: listing.artistId,
      type: listing.type,
      title: listing.title,
      description: listing.description,
      medium: listing.medium,
      category: listing.category,
      price: listing.price,
      status: listing.status,
      isDocumented: listing.isDocumented,
      quantityTotal: listing.quantityTotal,
      quantityRemaining: listing.quantityRemaining,
      ...decimals,
      editionNumber: listing.editionNumber,
      editionTotal: listing.editionTotal,
      reservedUntil: listing.reservedUntil,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
      images: listing.images.map((img) => ({
        id: img.id,
        listingId: img.listingId,
        url: img.url,
        isProcessPhoto: img.isProcessPhoto,
        sortOrder: img.sortOrder,
        createdAt: img.createdAt,
      })),
      artist: {
        id: listing.artist.id,
        displayName: listing.artist.displayName,
        slug: listing.artist.slug,
        status: listing.artist.status as AdminListingDetailResponse['artist']['status'],
      },
      orderCount: listing._count.orders,
      reviewCount: listing._count.reviews,
    }

    logger.info('Admin listing detail fetched', {
      listingId: id,
      durationMs: Date.now() - start,
    })

    return c.json(response)
  })

  /**
   * PUT /admin/listings/:id
   * Update listing fields. Triggers ISR revalidation.
   */
  app.put('/:id', async (c) => {
    const start = Date.now()
    const adminUser = c.get('user')
    const { id } = c.req.param()

    const body = await c.req.json().catch(() => ({}))
    const parsed = adminListingUpdateBody.safeParse(body)
    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    try {
      const listing = await prisma.listing.findUnique({
        where: { id },
        include: { artist: { select: { slug: true } } },
      })
      if (!listing) {
        return notFound(c, 'Listing not found')
      }

      await prisma.listing.update({
        where: { id },
        data: parsed.data as Prisma.ListingUpdateInput,
      })

      // Audit log (fire-and-forget)
      void logAdminAction(prisma, {
        adminId: adminUser.id,
        action: 'listing_update',
        targetType: 'listing',
        targetId: id,
        details: { fields: Object.keys(parsed.data) },
      })

      // Trigger ISR revalidation
      triggerRevalidation({
        type: 'listing',
        id: id,
        category: listing.category,
        artistSlug: (listing as unknown as { artist: { slug: string } }).artist.slug,
      })

      const response: AdminActionResponse = {
        message: 'Listing updated successfully',
      }

      logger.info('Admin updated listing', {
        listingId: id,
        fields: Object.keys(parsed.data),
        updatedBy: adminUser.id,
        durationMs: Date.now() - start,
      })

      return c.json(response)
    } catch (err) {
      logger.error('Listing update failed', {
        listingId: id,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
      })
      return internalError(c)
    }
  })

  /**
   * POST /admin/listings/:id/hide
   * Hide a listing — sets status to 'hidden'.
   */
  app.post('/:id/hide', async (c) => {
    const start = Date.now()
    const adminUser = c.get('user')
    const { id } = c.req.param()

    const body = await c.req.json().catch(() => ({}))
    const parsed = adminListingHideBody.safeParse(body)
    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    try {
      const listing = await prisma.listing.findUnique({
        where: { id },
        include: { artist: { select: { slug: true } } },
      })
      if (!listing) {
        return notFound(c, 'Listing not found')
      }

      await prisma.listing.update({
        where: { id },
        data: { status: 'hidden' },
      })

      // Audit log (fire-and-forget)
      void logAdminAction(prisma, {
        adminId: adminUser.id,
        action: 'listing_hide',
        targetType: 'listing',
        targetId: id,
        details: { reason: parsed.data.reason },
      })

      triggerRevalidation({
        type: 'listing',
        id: id,
        category: listing.category,
        artistSlug: (listing as unknown as { artist: { slug: string } }).artist.slug,
      })

      const response: AdminActionResponse = {
        message: 'Listing hidden successfully',
      }

      logger.info('Admin hid listing', {
        listingId: id,
        hiddenBy: adminUser.id,
        durationMs: Date.now() - start,
      })

      return c.json(response)
    } catch (err) {
      logger.error('Listing hide failed', {
        listingId: id,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
      })
      return internalError(c)
    }
  })

  /**
   * POST /admin/listings/:id/unhide
   * Restore a hidden listing to 'available'.
   */
  app.post('/:id/unhide', async (c) => {
    const start = Date.now()
    const adminUser = c.get('user')
    const { id } = c.req.param()

    try {
      const listing = await prisma.listing.findUnique({
        where: { id },
        include: { artist: { select: { slug: true } } },
      })
      if (!listing) {
        return notFound(c, 'Listing not found')
      }

      await prisma.listing.update({
        where: { id },
        data: { status: 'available' },
      })

      // Audit log (fire-and-forget)
      void logAdminAction(prisma, {
        adminId: adminUser.id,
        action: 'listing_unhide',
        targetType: 'listing',
        targetId: id,
      })

      triggerRevalidation({
        type: 'listing',
        id: id,
        category: listing.category,
        artistSlug: (listing as unknown as { artist: { slug: string } }).artist.slug,
      })

      const response: AdminActionResponse = {
        message: 'Listing unhidden successfully',
      }

      logger.info('Admin unhid listing', {
        listingId: id,
        unhiddenBy: adminUser.id,
        durationMs: Date.now() - start,
      })

      return c.json(response)
    } catch (err) {
      logger.error('Listing unhide failed', {
        listingId: id,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
      })
      return internalError(c)
    }
  })

  return app
}
