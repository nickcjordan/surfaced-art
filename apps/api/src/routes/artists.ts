import { Hono } from 'hono'
import type { PrismaClient, Prisma, CategoryType } from '@surfaced-art/db'
import { artistsQuery, artistSlugParam, type ArtistProfileResponse, type FeaturedArtistItem, type Tag } from '@surfaced-art/types'
import { logger } from '@surfaced-art/utils'
import { notFound, validationError } from '../errors'

export function createArtistRoutes(prisma: PrismaClient) {
  const artists = new Hono()

  /**
   * GET /artists
   * Returns a list of approved artists.
   * Query params:
   *   - limit: max number of artists to return (default 4, max 50)
   *   - category: filter by category (optional)
   */
  artists.get('/', async (c) => {
    const start = Date.now()

    const parsed = artistsQuery.safeParse({
      category: c.req.query('category'),
      limit: c.req.query('limit'),
    })

    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    const { category, limit } = parsed.data

    const where: Prisma.ArtistProfileWhereInput = {
      status: 'approved',
    }

    if (category) {
      where.categories = { some: { category: category as CategoryType } }
    }

    const artistsData = await prisma.artistProfile.findMany({
      where,
      select: {
        slug: true,
        displayName: true,
        location: true,
        profileImageUrl: true,
        coverImageUrl: true,
        categories: true,
        listings: {
          where: { status: 'available' },
          select: {
            images: {
              where: { isProcessPhoto: false },
              select: { url: true },
              orderBy: { sortOrder: 'asc' },
              take: 1,
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 4,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const data: FeaturedArtistItem[] = artistsData.map((artist) => ({
      slug: artist.slug,
      displayName: artist.displayName,
      location: artist.location,
      profileImageUrl: artist.profileImageUrl,
      coverImageUrl: artist.coverImageUrl,
      artworkImageUrls: artist.listings
        .map((l) => l.images[0]?.url)
        .filter((url): url is string => url != null),
      categories: artist.categories.map((c) => c.category),
    }))

    logger.info('Artists fetched', {
      count: data.length,
      limit,
      category: category ?? null,
      durationMs: Date.now() - start,
    })

    return c.json(data)
  })

  /**
   * GET /artists/:slug
   * Returns a full artist profile with categories, CV entries, process media, and listings
   */
  artists.get('/:slug', async (c) => {
    const start = Date.now()

    const parsed = artistSlugParam.safeParse({ slug: c.req.param('slug') })
    if (!parsed.success) {
      return validationError(c, parsed.error)
    }
    const { slug } = parsed.data

    const artist = await prisma.artistProfile.findUnique({
      where: { slug },
      include: {
        categories: true,
        tags: {
          include: { tag: true },
          orderBy: { tag: { sortOrder: 'asc' } },
        },
        cvEntries: {
          orderBy: { sortOrder: 'asc' },
        },
        processMedia: {
          orderBy: { sortOrder: 'asc' },
        },
        listings: {
          include: {
            images: {
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!artist || artist.status !== 'approved') {
      logger.warn('Artist not found', { slug })
      return notFound(c, 'Artist not found')
    }

    const response: ArtistProfileResponse = {
      id: artist.id,
      displayName: artist.displayName,
      slug: artist.slug,
      bio: artist.bio,
      location: artist.location,
      websiteUrl: artist.websiteUrl,
      instagramUrl: artist.instagramUrl,
      hasContactForm: !!(artist.contactEmail && artist.contactEnabled),
      status: artist.status,
      commissionsOpen: artist.commissionsOpen,
      coverImageUrl: artist.coverImageUrl,
      profileImageUrl: artist.profileImageUrl,
      accentColor: artist.accentColor,
      createdAt: artist.createdAt,
      updatedAt: artist.updatedAt,
      categories: artist.categories.map((c) => c.category),
      tags: artist.tags.map((at): Tag => ({
        id: at.tag.id,
        slug: at.tag.slug,
        label: at.tag.label,
        category: at.tag.category,
        sortOrder: at.tag.sortOrder,
      })),
      cvEntries: artist.cvEntries.map((entry) => ({
        id: entry.id,
        artistId: entry.artistId,
        type: entry.type,
        title: entry.title,
        institution: entry.institution,
        year: entry.year,
        description: entry.description,
        sortOrder: entry.sortOrder,
      })),
      processMedia: artist.processMedia.map((media) => ({
        id: media.id,
        artistId: media.artistId,
        type: media.type,
        url: media.url,
        videoAssetId: media.videoAssetId,
        videoPlaybackId: media.videoPlaybackId,
        videoProvider: media.videoProvider,
        sortOrder: media.sortOrder,
        createdAt: media.createdAt,
      })),
      listings: artist.listings.map((listing) => ({
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
        artworkLength: listing.artworkLength != null ? Number(listing.artworkLength) : null,
        artworkWidth: listing.artworkWidth != null ? Number(listing.artworkWidth) : null,
        artworkHeight: listing.artworkHeight != null ? Number(listing.artworkHeight) : null,
        packedLength: Number(listing.packedLength),
        packedWidth: Number(listing.packedWidth),
        packedHeight: Number(listing.packedHeight),
        packedWeight: Number(listing.packedWeight),
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
          width: img.width,
          height: img.height,
          createdAt: img.createdAt,
        })),
      })),
    }

    logger.info('Artist profile fetched', {
      slug,
      artistId: artist.id,
      listingCount: artist.listings.length,
      durationMs: Date.now() - start,
    })

    return c.json(response)
  })

  return artists
}
