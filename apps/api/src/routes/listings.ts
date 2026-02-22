import { Hono } from 'hono'
import type { PrismaClient } from '@surfaced-art/db'
import { validateUuid } from '@surfaced-art/utils'
import {
  Category,
  type ListingListItem,
  type ListingDetailResponse,
  type PaginatedResponse,
} from '@surfaced-art/types'

const validCategories = Object.values(Category)

/**
 * Transform Prisma listing fields to API response shape.
 * Converts Decimal dimension fields to numbers and normalizes expired reservations.
 */
function transformListingFields(listing: Record<string, unknown>) {
  const now = new Date()
  const isExpiredReservation =
    listing.status === 'reserved_system' &&
    listing.reservedUntil != null &&
    (listing.reservedUntil as Date) < now

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

    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {}

    if (category) {
      where.category = category
    }

    // Expired system reservations should be treated as available (checked on read)
    if (status === 'available') {
      where.OR = [
        { status: 'available' },
        {
          status: 'reserved_system',
          reservedUntil: { lt: new Date() },
        },
      ]
    } else {
      where.status = status
    }

    // Only show listings from approved artists
    where.artist = { status: 'approved' }

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
      }),
      prisma.listing.count({ where }),
    ])

    const data: ListingListItem[] = listingsData.map(
      (listing: Record<string, unknown> & { images: Record<string, unknown>[]; artist: Record<string, unknown> }) => {
        const base = transformListingFields(listing)
        const primaryImage = listing.images[0]
          ? {
              id: (listing.images[0] as Record<string, unknown>).id as string,
              listingId: (listing.images[0] as Record<string, unknown>).listingId as string,
              url: (listing.images[0] as Record<string, unknown>).url as string,
              isProcessPhoto: (listing.images[0] as Record<string, unknown>).isProcessPhoto as boolean,
              sortOrder: (listing.images[0] as Record<string, unknown>).sortOrder as number,
              createdAt: (listing.images[0] as Record<string, unknown>).createdAt as Date,
            }
          : null

        return {
          ...base,
          primaryImage,
          artist: {
            displayName: listing.artist.displayName as string,
            slug: listing.artist.slug as string,
            profileImageUrl: listing.artist.profileImageUrl as string | null,
            location: listing.artist.location as string,
          },
        } as ListingListItem
      }
    )

    const totalPages = Math.ceil(total / limit)

    const response: PaginatedResponse<ListingListItem> = {
      data,
      meta: { page, limit, total, totalPages },
    }

    return c.json(response)
  })

  /**
   * GET /listings/:id
   * Returns a single listing with all images and artist summary with categories.
   */
  listings.get('/:id', async (c) => {
    const id = c.req.param('id')

    if (!validateUuid(id)) {
      return c.json({ error: 'Invalid listing ID format' }, 400)
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
    })

    if (!listing || (listing as Record<string, unknown> & { artist: Record<string, unknown> }).artist.status !== 'approved') {
      return c.json({ error: 'Listing not found' }, 404)
    }

    const typedListing = listing as Record<string, unknown> & {
      images: Record<string, unknown>[]
      artist: Record<string, unknown> & { categories: Array<{ category: string }> }
    }

    const base = transformListingFields(typedListing)

    const response: ListingDetailResponse = {
      ...base,
      images: typedListing.images.map((img) => ({
        id: img.id as string,
        listingId: img.listingId as string,
        url: img.url as string,
        isProcessPhoto: img.isProcessPhoto as boolean,
        sortOrder: img.sortOrder as number,
        createdAt: img.createdAt as Date,
      })),
      artist: {
        displayName: typedListing.artist.displayName as string,
        slug: typedListing.artist.slug as string,
        profileImageUrl: typedListing.artist.profileImageUrl as string | null,
        location: typedListing.artist.location as string,
        categories: typedListing.artist.categories.map((cat) => cat.category),
      },
    } as ListingDetailResponse

    return c.json(response)
  })

  return listings
}
