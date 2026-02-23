import { Hono } from 'hono'
import type { PrismaClient, Prisma, Listing, ListingImage, ArtistProfile, ArtistCategory } from '@surfaced-art/db'
import { validateUuid, logger } from '@surfaced-art/utils'
import {
  Category,
  ListingStatus,
  type ListingListItem,
  type ListingDetailResponse,
  type PaginatedResponse,
} from '@surfaced-art/types'

const validCategories = Object.values(Category)
const validStatuses = Object.values(ListingStatus)

/**
 * Transform Prisma listing fields to API response shape.
 * Converts Decimal dimension fields to numbers and normalizes expired reservations.
 *
 * @param listing - The Prisma listing record
 * @param now - Current timestamp, computed once per request for consistency across multiple listings
 */
function transformListingFields(listing: Listing, now: Date) {
  const isExpiredReservation =
    listing.status === 'reserved_system' &&
    listing.reservedUntil != null &&
    listing.reservedUntil < now

  return {
    id: listing.id,
    artistId: listing.artistId,
    type: listing.type,
    title: listing.title,
    description: listing.description,
    medium: listing.medium,
    category: listing.category,
    price: listing.price,
    status: isExpiredReservation ? ('available' as const) : listing.status,
    isDocumented: listing.isDocumented,
    quantityTotal: listing.quantityTotal,
    quantityRemaining: listing.quantityRemaining,
    artworkLength: listing.artworkLength != null ? Number(listing.artworkLength) : null,
    artworkWidth: listing.artworkWidth != null ? Number(listing.artworkWidth) : null,
    artworkHeight: listing.artworkHeight != null ? Number(listing.artworkHeight) : null,
    packedLength: Number(listing.packedLength),
    packedWidth: Number(listing.packedWidth),
    packedHeight: Number(listing.packedHeight),
    packedWeight: Number(listing.packedWeight),
    editionNumber: listing.editionNumber,
    editionTotal: listing.editionTotal,
    reservedUntil: isExpiredReservation ? null : listing.reservedUntil,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
  }
}

export function createListingRoutes(prisma: PrismaClient) {
  const listings = new Hono()

  /**
   * GET /listings
   * Returns paginated listings with filters for category and status.
   * Each listing includes primary image and lightweight artist summary.
   */
  listings.get('/', async (c) => {
    const start = Date.now()
    const page = Math.max(1, parseInt(c.req.query('page') ?? '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20', 10) || 20))
    const category = c.req.query('category')
    const status = c.req.query('status') ?? 'available'

    // Validate category
    if (category && !validCategories.includes(category as (typeof validCategories)[number])) {
      return c.json(
        { error: `Invalid category. Valid values: ${validCategories.join(', ')}` },
        400
      )
    }

    // Validate status
    if (!validStatuses.includes(status as (typeof validStatuses)[number])) {
      return c.json(
        { error: `Invalid status. Valid values: ${validStatuses.join(', ')}` },
        400
      )
    }

    const skip = (page - 1) * limit
    const now = new Date()

    // Build where clause
    const where: Prisma.ListingWhereInput = {
      // Only show listings from approved artists
      artist: { status: 'approved' },
    }

    if (category) {
      where.category = category as (typeof validCategories)[number]
    }

    // Expired system reservations should be treated as available (checked on read)
    if (status === 'available') {
      where.OR = [
        { status: 'available' },
        {
          status: 'reserved_system',
          reservedUntil: { lt: now },
        },
      ]
    } else {
      where.status = status as (typeof validStatuses)[number]
    }

    type ListingListPayload = Listing & {
      images: ListingImage[]
      artist: Pick<ArtistProfile, 'displayName' | 'slug' | 'profileImageUrl' | 'location' | 'status'>
    }

    const [listingsData, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          images: {
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
          artist: {
            select: {
              displayName: true,
              slug: true,
              profileImageUrl: true,
              location: true,
              status: true,
            },
          },
        },
      }) as Promise<ListingListPayload[]>,
      prisma.listing.count({ where }),
    ])

    const data: ListingListItem[] = listingsData.map((listing) => {
      const base = transformListingFields(listing, now)
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
        ...base,
        primaryImage,
        artist: {
          displayName: listing.artist.displayName,
          slug: listing.artist.slug,
          profileImageUrl: listing.artist.profileImageUrl,
          location: listing.artist.location,
        },
      } as ListingListItem
    })

    const totalPages = Math.ceil(total / limit)

    const response: PaginatedResponse<ListingListItem> = {
      data,
      meta: { page, limit, total, totalPages },
    }

    logger.info('Listings fetched', {
      page,
      limit,
      total,
      category: category ?? null,
      status,
      durationMs: Date.now() - start,
    })

    return c.json(response)
  })

  /**
   * GET /listings/:id
   * Returns a single listing with all images and artist summary with categories.
   */
  listings.get('/:id', async (c) => {
    const id = c.req.param('id')
    const start = Date.now()

    if (!validateUuid(id)) {
      logger.warn('Invalid listing ID format', { listingId: id })
      return c.json({ error: 'Invalid listing ID format' }, 400)
    }

    type ListingDetailPayload = Listing & {
      images: ListingImage[]
      artist: Pick<ArtistProfile, 'displayName' | 'slug' | 'profileImageUrl' | 'location' | 'status'> & {
        categories: ArtistCategory[]
      }
    }

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        artist: {
          select: {
            displayName: true,
            slug: true,
            profileImageUrl: true,
            location: true,
            status: true,
            categories: true,
          },
        },
      },
    }) as ListingDetailPayload | null

    if (!listing || listing.artist.status !== 'approved') {
      logger.warn('Listing not found', { listingId: id })
      return c.json({ error: 'Listing not found' }, 404)
    }

    const now = new Date()
    const base = transformListingFields(listing, now)

    const response: ListingDetailResponse = {
      ...base,
      images: listing.images.map((img) => ({
        id: img.id,
        listingId: img.listingId,
        url: img.url,
        isProcessPhoto: img.isProcessPhoto,
        sortOrder: img.sortOrder,
        createdAt: img.createdAt,
      })),
      artist: {
        displayName: listing.artist.displayName,
        slug: listing.artist.slug,
        profileImageUrl: listing.artist.profileImageUrl,
        location: listing.artist.location,
        categories: listing.artist.categories.map((cat) => cat.category),
      },
    }

    logger.info('Listing detail fetched', {
      listingId: listing.id,
      artistSlug: listing.artist.slug,
      durationMs: Date.now() - start,
    })

    return c.json(response)
  })

  return listings
}
