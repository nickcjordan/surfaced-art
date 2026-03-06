import { Hono } from 'hono'
import type { PrismaClient } from '@surfaced-art/db'
import type { CategoryType as PrismaCategoryType } from '@surfaced-art/db'
import type { CategoriesUpdateResponse, CvEntryResponse, CvEntryListResponse, DashboardResponse, MyListingImageResponse, MyListingListItem, MyListingResponse, ProcessMediaResponse, ProcessMediaListResponse, ProfileCompletionField, ProfileUpdateResponse, StripeOnboardingResponse, StripeStatusResponse } from '@surfaced-art/types'
import { categoriesUpdateBody, cvEntryBody, cvEntryReorderBody, listingAvailabilityBody, listingCreateBody, listingImageBody, listingImageReorderBody, listingUpdateBody, myListingsQuery, processMediaPhotoBody, processMediaVideoBody, processMediaReorderBody, profileUpdateBody, sanitizeText } from '@surfaced-art/types'
import { logger } from '@surfaced-art/utils'
import { authMiddleware, requireRole, type AuthUser } from '../middleware/auth'
import { notFound, badRequest, validationError, conflict, internalError } from '../errors'
import { triggerRevalidation } from '../lib/revalidation'
import { getStripeClient } from '../lib/stripe'

function formatProcessMedia(entry: { id: string; type: string; url: string | null; videoPlaybackId: string | null; videoProvider: string | null; sortOrder: number; createdAt: Date }): ProcessMediaResponse {
  return {
    id: entry.id,
    type: entry.type as ProcessMediaResponse['type'],
    url: entry.url,
    videoPlaybackId: entry.videoPlaybackId,
    videoProvider: entry.videoProvider,
    sortOrder: entry.sortOrder,
    createdAt: entry.createdAt.toISOString(),
  }
}

function formatCvEntry(entry: { id: string; type: string; title: string; institution: string | null; year: number; description: string | null; sortOrder: number }): CvEntryResponse {
  return {
    id: entry.id,
    type: entry.type as CvEntryResponse['type'],
    title: entry.title,
    institution: entry.institution,
    year: entry.year,
    description: entry.description,
    sortOrder: entry.sortOrder,
  }
}

// Prisma Decimal has a toNumber() method; plain numbers pass through
function toNumber(val: unknown): number {
  if (val !== null && val !== undefined && typeof (val as { toNumber?: unknown }).toNumber === 'function') {
    return (val as { toNumber: () => number }).toNumber()
  }
  return val as number
}

function toNumberOrNull(val: unknown): number | null {
  if (val === null || val === undefined) return null
  return toNumber(val)
}

function formatListingImage(img: { id: string; url: string; isProcessPhoto: boolean; sortOrder: number; width: number | null; height: number | null; createdAt: Date }): MyListingImageResponse {
  return {
    id: img.id,
    url: img.url,
    isProcessPhoto: img.isProcessPhoto,
    sortOrder: img.sortOrder,
    width: img.width,
    height: img.height,
    createdAt: img.createdAt.toISOString(),
  }
}

function formatListingResponse(listing: {
  id: string; type: string; title: string; description: string; medium: string;
  category: string; price: number; status: string; isDocumented: boolean;
  quantityTotal: number; quantityRemaining: number;
  artworkLength: unknown; artworkWidth: unknown; artworkHeight: unknown;
  packedLength: unknown; packedWidth: unknown; packedHeight: unknown; packedWeight: unknown;
  editionNumber: number | null; editionTotal: number | null;
  reservedUntil: Date | null; createdAt: Date; updatedAt: Date;
  images: { id: string; url: string; isProcessPhoto: boolean; sortOrder: number; width: number | null; height: number | null; createdAt: Date }[];
}): MyListingResponse {
  return {
    id: listing.id,
    type: listing.type as MyListingResponse['type'],
    title: listing.title,
    description: listing.description,
    medium: listing.medium,
    category: listing.category as MyListingResponse['category'],
    price: listing.price,
    status: listing.status as MyListingResponse['status'],
    isDocumented: listing.isDocumented,
    quantityTotal: listing.quantityTotal,
    quantityRemaining: listing.quantityRemaining,
    artworkLength: toNumberOrNull(listing.artworkLength),
    artworkWidth: toNumberOrNull(listing.artworkWidth),
    artworkHeight: toNumberOrNull(listing.artworkHeight),
    packedLength: toNumber(listing.packedLength),
    packedWidth: toNumber(listing.packedWidth),
    packedHeight: toNumber(listing.packedHeight),
    packedWeight: toNumber(listing.packedWeight),
    editionNumber: listing.editionNumber,
    editionTotal: listing.editionTotal,
    reservedUntil: listing.reservedUntil?.toISOString() ?? null,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
    images: listing.images.map(formatListingImage),
  }
}

function formatListingListItem(listing: {
  id: string; type: string; title: string; medium: string; category: string;
  price: number; status: string; isDocumented: boolean;
  quantityTotal: number; quantityRemaining: number;
  createdAt: Date; updatedAt: Date;
  images: { id: string; url: string; isProcessPhoto: boolean; sortOrder: number; width: number | null; height: number | null; createdAt: Date }[];
}): MyListingListItem {
  const firstImage = listing.images[0]
  const primaryImage = firstImage ? formatListingImage(firstImage) : null
  return {
    id: listing.id,
    type: listing.type as MyListingListItem['type'],
    title: listing.title,
    medium: listing.medium,
    category: listing.category as MyListingListItem['category'],
    price: listing.price,
    status: listing.status as MyListingListItem['status'],
    isDocumented: listing.isDocumented,
    quantityTotal: listing.quantityTotal,
    quantityRemaining: listing.quantityRemaining,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
    primaryImage,
  }
}

export function createMeRoutes(prisma: PrismaClient) {
  const me = new Hono<{ Variables: { user: AuthUser } }>()

  me.use('*', authMiddleware(prisma))
  me.use('*', requireRole('artist'))

  /**
   * GET /me/dashboard
   * Returns the authenticated artist's profile summary, completion status,
   * and listing counts.
   */
  me.get('/dashboard', async (c) => {
    const start = Date.now()
    const user = c.get('user')

    const artist = await prisma.artistProfile.findUnique({
      where: { userId: user.id },
      include: {
        categories: true,
        cvEntries: true,
      },
    })

    if (!artist) {
      return notFound(c, 'Artist profile not found')
    }

    const [totalListings, availableListings, soldListings] = await Promise.all([
      prisma.listing.count({ where: { artistId: artist.id } }),
      prisma.listing.count({ where: { artistId: artist.id, status: 'available' } }),
      prisma.listing.count({ where: { artistId: artist.id, status: 'sold' } }),
    ])

    const fields: ProfileCompletionField[] = [
      { label: 'Bio', complete: artist.bio.trim().length > 0 },
      { label: 'Location', complete: artist.location.trim().length > 0 },
      { label: 'Profile image', complete: artist.profileImageUrl !== null },
      { label: 'Cover image', complete: artist.coverImageUrl !== null },
      { label: 'At least 1 category', complete: artist.categories.length > 0 },
      { label: 'At least 1 CV entry', complete: artist.cvEntries.length > 0 },
    ]

    const completedCount = fields.filter((f) => f.complete).length
    const percentage = Math.round((completedCount / fields.length) * 100)

    const response: DashboardResponse = {
      profile: {
        id: artist.id,
        displayName: artist.displayName,
        slug: artist.slug,
        bio: artist.bio,
        location: artist.location,
        websiteUrl: artist.websiteUrl,
        instagramUrl: artist.instagramUrl,
        profileImageUrl: artist.profileImageUrl,
        coverImageUrl: artist.coverImageUrl,
        status: artist.status,
        stripeAccountId: artist.stripeAccountId,
        categories: artist.categories.map((c) => c.category),
      },
      completion: {
        percentage,
        fields,
      },
      stats: {
        totalListings,
        availableListings,
        soldListings,
        totalViews: 0, // Placeholder until analytics
      },
    }

    logger.info('Dashboard data fetched', {
      artistId: artist.id,
      completionPct: percentage,
      durationMs: Date.now() - start,
    })

    return c.json(response)
  })

  /**
   * PUT /me/profile
   * Update the authenticated artist's profile fields.
   * Supports partial updates — only provided fields are changed.
   */
  me.put('/profile', async (c) => {
    const user = c.get('user')

    const body = await c.req.json().catch(() => null)
    if (body === null) {
      return badRequest(c, 'Invalid JSON payload')
    }

    const parsed = profileUpdateBody.safeParse(body)
    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    // Validate image URLs belong to our CloudFront domain
    const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN
    if (!cloudfrontDomain) {
      logger.error('CLOUDFRONT_DOMAIN env var is not set')
      return c.json({ error: { code: 'INTERNAL_ERROR', message: 'Server configuration error' } }, 500)
    }
    for (const field of ['profileImageUrl', 'coverImageUrl'] as const) {
      const value = parsed.data[field]
      if (value) {
        let hostname: string
        try {
          hostname = new URL(value).hostname
        } catch {
          return badRequest(c, `${field} must be a valid URL from the platform CDN`)
        }
        if (hostname !== cloudfrontDomain) {
          return badRequest(c, `${field} must be from the platform CDN`)
        }
      }
    }

    const artist = await prisma.artistProfile.findUnique({
      where: { userId: user.id },
    })

    if (!artist) {
      return notFound(c, 'Artist profile not found')
    }

    // Build update data — only include fields that were provided
    const updateData: Record<string, unknown> = {}

    if (parsed.data.bio !== undefined) {
      updateData.bio = sanitizeText(parsed.data.bio)
    }
    if (parsed.data.location !== undefined) {
      updateData.location = sanitizeText(parsed.data.location)
    }
    if (parsed.data.websiteUrl !== undefined) {
      updateData.websiteUrl = parsed.data.websiteUrl || null
    }
    if (parsed.data.instagramUrl !== undefined) {
      updateData.instagramUrl = parsed.data.instagramUrl || null
    }
    if (parsed.data.profileImageUrl !== undefined) {
      updateData.profileImageUrl = parsed.data.profileImageUrl
    }
    if (parsed.data.coverImageUrl !== undefined) {
      updateData.coverImageUrl = parsed.data.coverImageUrl
    }

    const updated = await prisma.artistProfile.update({
      where: { id: artist.id },
      data: updateData,
    })

    const response: ProfileUpdateResponse = {
      id: updated.id,
      displayName: updated.displayName,
      slug: updated.slug,
      bio: updated.bio,
      location: updated.location,
      websiteUrl: updated.websiteUrl,
      instagramUrl: updated.instagramUrl,
      profileImageUrl: updated.profileImageUrl,
      coverImageUrl: updated.coverImageUrl,
      status: updated.status,
    }

    logger.info('Artist profile updated', {
      artistId: artist.id,
      fieldsUpdated: Object.keys(updateData),
    })

    return c.json(response)
  })

  /**
   * PUT /me/categories
   * Replace the authenticated artist's category assignments.
   * Uses replace-all semantics: deletes existing, inserts new in a transaction.
   */
  me.put('/categories', async (c) => {
    const user = c.get('user')

    const body = await c.req.json().catch(() => null)
    if (body === null) {
      return badRequest(c, 'Invalid JSON payload')
    }

    const parsed = categoriesUpdateBody.safeParse(body)
    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    const artist = await prisma.artistProfile.findUnique({
      where: { userId: user.id },
    })

    if (!artist) {
      return notFound(c, 'Artist profile not found')
    }

    // Deduplicate categories
    const uniqueCategories = [...new Set(parsed.data.categories)]

    const updatedCategories = await prisma.$transaction(async (tx) => {
      await tx.artistCategory.deleteMany({
        where: { artistId: artist.id },
      })

      await tx.artistCategory.createMany({
        data: uniqueCategories.map((category) => ({
          artistId: artist.id,
          category: category as PrismaCategoryType,
        })),
      })

      return tx.artistCategory.findMany({
        where: { artistId: artist.id },
      })
    })

    const response: CategoriesUpdateResponse = {
      categories: updatedCategories.map((c) => c.category),
    }

    logger.info('Artist categories updated', {
      artistId: artist.id,
      categories: uniqueCategories,
    })

    return c.json(response)
  })

  /**
   * GET /me/cv-entries
   * List all CV entries for the authenticated artist, ordered by sortOrder.
   */
  me.get('/cv-entries', async (c) => {
    const user = c.get('user')

    const artist = await prisma.artistProfile.findUnique({
      where: { userId: user.id },
    })

    if (!artist) {
      return notFound(c, 'Artist profile not found')
    }

    const entries = await prisma.artistCvEntry.findMany({
      where: { artistId: artist.id },
      orderBy: { sortOrder: 'asc' },
    })

    const response: CvEntryListResponse = {
      cvEntries: entries.map(formatCvEntry),
    }

    return c.json(response)
  })

  /**
   * POST /me/cv-entries
   * Create a new CV entry. Auto-assigns the next sortOrder.
   */
  me.post('/cv-entries', async (c) => {
    const user = c.get('user')

    const body = await c.req.json().catch(() => null)
    if (body === null) {
      return badRequest(c, 'Invalid JSON payload')
    }

    const parsed = cvEntryBody.safeParse(body)
    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    const artist = await prisma.artistProfile.findUnique({
      where: { userId: user.id },
    })

    if (!artist) {
      return notFound(c, 'Artist profile not found')
    }

    const count = await prisma.artistCvEntry.count({
      where: { artistId: artist.id },
    })

    const created = await prisma.artistCvEntry.create({
      data: {
        artistId: artist.id,
        type: parsed.data.type as CvEntryResponse['type'],
        title: sanitizeText(parsed.data.title),
        institution: parsed.data.institution ? sanitizeText(parsed.data.institution) : null,
        year: parsed.data.year,
        description: parsed.data.description ? sanitizeText(parsed.data.description) : null,
        sortOrder: count,
      },
    })

    logger.info('CV entry created', { artistId: artist.id, entryId: created.id })

    return c.json(formatCvEntry(created), 201)
  })

  /**
   * PUT /me/cv-entries/reorder
   * Reorder CV entries by providing an ordered array of IDs.
   * Must be registered before the :id route to avoid path conflicts.
   */
  me.put('/cv-entries/reorder', async (c) => {
    const user = c.get('user')

    const body = await c.req.json().catch(() => null)
    if (body === null) {
      return badRequest(c, 'Invalid JSON payload')
    }

    const parsed = cvEntryReorderBody.safeParse(body)
    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    const artist = await prisma.artistProfile.findUnique({
      where: { userId: user.id },
    })

    if (!artist) {
      return notFound(c, 'Artist profile not found')
    }

    // Verify all IDs belong to this artist
    const existingEntries = await prisma.artistCvEntry.findMany({
      where: { artistId: artist.id },
    })

    const ownedIds = new Set(existingEntries.map((e) => e.id))
    const invalidIds = parsed.data.orderedIds.filter((id) => !ownedIds.has(id))

    if (invalidIds.length > 0) {
      return badRequest(c, 'Some entry IDs do not belong to this artist')
    }

    if (parsed.data.orderedIds.length !== existingEntries.length) {
      return badRequest(c, 'Must provide all entry IDs for reordering')
    }

    // Update sortOrder in a transaction
    await prisma.$transaction(
      parsed.data.orderedIds.map((id, index) =>
        prisma.artistCvEntry.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    )

    const reordered = await prisma.artistCvEntry.findMany({
      where: { artistId: artist.id },
      orderBy: { sortOrder: 'asc' },
    })

    const response: CvEntryListResponse = {
      cvEntries: reordered.map(formatCvEntry),
    }

    logger.info('CV entries reordered', { artistId: artist.id })

    return c.json(response)
  })

  /**
   * PUT /me/cv-entries/:id
   * Update an existing CV entry. Validates ownership.
   */
  me.put('/cv-entries/:id', async (c) => {
    const user = c.get('user')
    const entryId = c.req.param('id')

    const body = await c.req.json().catch(() => null)
    if (body === null) {
      return badRequest(c, 'Invalid JSON payload')
    }

    const parsed = cvEntryBody.safeParse(body)
    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    const artist = await prisma.artistProfile.findUnique({
      where: { userId: user.id },
    })

    if (!artist) {
      return notFound(c, 'Artist profile not found')
    }

    const entry = await prisma.artistCvEntry.findUnique({
      where: { id: entryId },
    })

    if (!entry) {
      return notFound(c, 'CV entry not found')
    }

    if (entry.artistId !== artist.id) {
      return c.json(
        { error: { code: 'FORBIDDEN', message: 'You do not own this CV entry' } },
        403,
      )
    }

    const updated = await prisma.artistCvEntry.update({
      where: { id: entryId },
      data: {
        type: parsed.data.type as CvEntryResponse['type'],
        title: sanitizeText(parsed.data.title),
        institution: parsed.data.institution ? sanitizeText(parsed.data.institution) : null,
        year: parsed.data.year,
        description: parsed.data.description ? sanitizeText(parsed.data.description) : null,
      },
    })

    logger.info('CV entry updated', { artistId: artist.id, entryId })

    return c.json(formatCvEntry(updated))
  })

  /**
   * DELETE /me/cv-entries/:id
   * Delete a CV entry. Validates ownership.
   */
  me.delete('/cv-entries/:id', async (c) => {
    const user = c.get('user')
    const entryId = c.req.param('id')

    const artist = await prisma.artistProfile.findUnique({
      where: { userId: user.id },
    })

    if (!artist) {
      return notFound(c, 'Artist profile not found')
    }

    const entry = await prisma.artistCvEntry.findUnique({
      where: { id: entryId },
    })

    if (!entry) {
      return notFound(c, 'CV entry not found')
    }

    if (entry.artistId !== artist.id) {
      return c.json(
        { error: { code: 'FORBIDDEN', message: 'You do not own this CV entry' } },
        403,
      )
    }

    await prisma.artistCvEntry.delete({
      where: { id: entryId },
    })

    logger.info('CV entry deleted', { artistId: artist.id, entryId })

    return c.body(null, 204)
  })

  // ─── Process Media Endpoints ────────────────────────────────────────

  /**
   * GET /me/process-media
   * List all process media for the authenticated artist, ordered by sortOrder.
   */
  me.get('/process-media', async (c) => {
    const user = c.get('user')

    const artist = await prisma.artistProfile.findUnique({
      where: { userId: user.id },
    })

    if (!artist) {
      return notFound(c, 'Artist profile not found')
    }

    const entries = await prisma.artistProcessMedia.findMany({
      where: { artistId: artist.id },
      orderBy: { sortOrder: 'asc' },
    })

    const response: ProcessMediaListResponse = {
      processMedia: entries.map(formatProcessMedia),
    }

    return c.json(response)
  })

  /**
   * POST /me/process-media/photo
   * Create a new process media photo entry. Validates CloudFront URL.
   */
  me.post('/process-media/photo', async (c) => {
    const user = c.get('user')

    const body = await c.req.json().catch(() => null)
    if (body === null) {
      return badRequest(c, 'Invalid JSON payload')
    }

    const parsed = processMediaPhotoBody.safeParse(body)
    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    // Validate CloudFront URL via hostname parsing
    const photoCloudfrontDomain = process.env.CLOUDFRONT_DOMAIN
    if (!photoCloudfrontDomain) {
      logger.error('CLOUDFRONT_DOMAIN env var is not set')
      return c.json({ error: { code: 'INTERNAL_ERROR', message: 'Server configuration error' } }, 500)
    }
    let photoHostname: string
    try {
      photoHostname = new URL(parsed.data.url).hostname
    } catch {
      return badRequest(c, 'URL must be a valid URL from the platform CDN')
    }
    if (photoHostname !== photoCloudfrontDomain) {
      return badRequest(c, 'URL must be from the platform CDN')
    }

    const artist = await prisma.artistProfile.findUnique({
      where: { userId: user.id },
    })

    if (!artist) {
      return notFound(c, 'Artist profile not found')
    }

    const count = await prisma.artistProcessMedia.count({
      where: { artistId: artist.id },
    })

    const created = await prisma.artistProcessMedia.create({
      data: {
        artistId: artist.id,
        type: 'photo',
        url: parsed.data.url,
        sortOrder: count,
      },
    })

    logger.info('Process media photo created', { artistId: artist.id, entryId: created.id })

    return c.json(formatProcessMedia(created), 201)
  })

  /**
   * POST /me/process-media/video
   * Create a new process media video entry (Mux playback ID).
   */
  me.post('/process-media/video', async (c) => {
    const user = c.get('user')

    const body = await c.req.json().catch(() => null)
    if (body === null) {
      return badRequest(c, 'Invalid JSON payload')
    }

    const parsed = processMediaVideoBody.safeParse(body)
    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    const artist = await prisma.artistProfile.findUnique({
      where: { userId: user.id },
    })

    if (!artist) {
      return notFound(c, 'Artist profile not found')
    }

    const count = await prisma.artistProcessMedia.count({
      where: { artistId: artist.id },
    })

    const created = await prisma.artistProcessMedia.create({
      data: {
        artistId: artist.id,
        type: 'video',
        videoPlaybackId: parsed.data.videoPlaybackId,
        videoProvider: parsed.data.videoProvider,
        sortOrder: count,
      },
    })

    logger.info('Process media video created', { artistId: artist.id, entryId: created.id })

    return c.json(formatProcessMedia(created), 201)
  })

  /**
   * PUT /me/process-media/reorder
   * Reorder process media by providing an ordered array of IDs.
   * Must be registered before the :id route to avoid path conflicts.
   */
  me.put('/process-media/reorder', async (c) => {
    const user = c.get('user')

    const body = await c.req.json().catch(() => null)
    if (body === null) {
      return badRequest(c, 'Invalid JSON payload')
    }

    const parsed = processMediaReorderBody.safeParse(body)
    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    const artist = await prisma.artistProfile.findUnique({
      where: { userId: user.id },
    })

    if (!artist) {
      return notFound(c, 'Artist profile not found')
    }

    // Verify all IDs belong to this artist
    const existingEntries = await prisma.artistProcessMedia.findMany({
      where: { artistId: artist.id },
    })

    const ownedIds = new Set(existingEntries.map((e) => e.id))
    const invalidIds = parsed.data.orderedIds.filter((id) => !ownedIds.has(id))

    if (invalidIds.length > 0) {
      return badRequest(c, 'Some media IDs do not belong to this artist')
    }

    if (parsed.data.orderedIds.length !== existingEntries.length) {
      return badRequest(c, 'Must provide all media IDs for reordering')
    }

    // Update sortOrder in a transaction
    await prisma.$transaction(
      parsed.data.orderedIds.map((id, index) =>
        prisma.artistProcessMedia.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    )

    const reordered = await prisma.artistProcessMedia.findMany({
      where: { artistId: artist.id },
      orderBy: { sortOrder: 'asc' },
    })

    const response: ProcessMediaListResponse = {
      processMedia: reordered.map(formatProcessMedia),
    }

    logger.info('Process media reordered', { artistId: artist.id })

    return c.json(response)
  })

  /**
   * DELETE /me/process-media/:id
   * Delete a process media entry. Validates ownership.
   */
  me.delete('/process-media/:id', async (c) => {
    const user = c.get('user')
    const mediaId = c.req.param('id')

    const artist = await prisma.artistProfile.findUnique({
      where: { userId: user.id },
    })

    if (!artist) {
      return notFound(c, 'Artist profile not found')
    }

    const entry = await prisma.artistProcessMedia.findUnique({
      where: { id: mediaId },
    })

    if (!entry) {
      return notFound(c, 'Process media not found')
    }

    if (entry.artistId !== artist.id) {
      return c.json(
        { error: { code: 'FORBIDDEN', message: 'You do not own this process media' } },
        403,
      )
    }

    await prisma.artistProcessMedia.delete({
      where: { id: mediaId },
    })

    logger.info('Process media deleted', { artistId: artist.id, mediaId })

    return c.body(null, 204)
  })

  // ─── Listing Management Endpoints ──────────────────────────────────

  /**
   * GET /me/listings
   * Paginated list of the authenticated artist's listings.
   * Supports optional status and category filters.
   */
  me.get('/listings', async (c) => {
    const user = c.get('user')

    const queryParsed = myListingsQuery.safeParse(Object.fromEntries(new URL(c.req.url).searchParams))
    if (!queryParsed.success) {
      return validationError(c, queryParsed.error)
    }

    const { page, limit, status, category } = queryParsed.data

    const artist = await prisma.artistProfile.findUnique({
      where: { userId: user.id },
    })

    if (!artist) {
      return notFound(c, 'Artist profile not found')
    }

    const where: Record<string, unknown> = { artistId: artist.id }
    if (status) where.status = status
    if (category) where.category = category

    const [total, listings] = await Promise.all([
      prisma.listing.count({ where }),
      prisma.listing.findMany({
        where,
        include: { images: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    const data: MyListingListItem[] = listings.map((listing) => formatListingListItem(listing))

    return c.json({
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    })
  })

  /**
   * POST /me/listings
   * Create a new listing for the authenticated artist.
   */
  me.post('/listings', async (c) => {
    const user = c.get('user')

    const body = await c.req.json().catch(() => null)
    if (body === null) {
      return badRequest(c, 'Invalid JSON payload')
    }

    const parsed = listingCreateBody.safeParse(body)
    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    const artist = await prisma.artistProfile.findUnique({
      where: { userId: user.id },
    })

    if (!artist) {
      return notFound(c, 'Artist profile not found')
    }

    const { quantityTotal, ...rest } = parsed.data

    const created = await prisma.listing.create({
      data: {
        artistId: artist.id,
        title: sanitizeText(rest.title),
        description: sanitizeText(rest.description),
        medium: sanitizeText(rest.medium),
        category: rest.category as PrismaCategoryType,
        type: rest.type as 'standard' | 'commission',
        price: rest.price,
        status: 'available',
        quantityTotal,
        quantityRemaining: quantityTotal,
        artworkLength: rest.artworkLength ?? null,
        artworkWidth: rest.artworkWidth ?? null,
        artworkHeight: rest.artworkHeight ?? null,
        packedLength: rest.packedLength,
        packedWidth: rest.packedWidth,
        packedHeight: rest.packedHeight,
        packedWeight: rest.packedWeight,
        editionNumber: rest.editionNumber ?? null,
        editionTotal: rest.editionTotal ?? null,
      },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    })

    logger.info('Listing created', { artistId: artist.id, listingId: created.id })

    triggerRevalidation({ type: 'listing', id: created.id, category: created.category, artistSlug: artist.slug })

    return c.json(formatListingResponse(created), 201)
  })

  /**
   * GET /me/listings/:id
   * Single listing with images for the edit form.
   */
  me.get('/listings/:id', async (c) => {
    const user = c.get('user')
    const listingId = c.req.param('id')

    const artist = await prisma.artistProfile.findUnique({
      where: { userId: user.id },
    })

    if (!artist) {
      return notFound(c, 'Artist profile not found')
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    })

    if (!listing) {
      return notFound(c, 'Listing not found')
    }

    if (listing.artistId !== artist.id) {
      return c.json(
        { error: { code: 'FORBIDDEN', message: 'You do not own this listing' } },
        403,
      )
    }

    // Handle expired system reservation — persist to database
    if (listing.status === 'reserved_system' && listing.reservedUntil && listing.reservedUntil < new Date()) {
      const updated = await prisma.listing.update({
        where: { id: listingId },
        data: { status: 'available', reservedUntil: null },
        include: { images: { orderBy: { sortOrder: 'asc' } } },
      })
      return c.json(formatListingResponse(updated))
    }

    return c.json(formatListingResponse(listing))
  })

  /**
   * PUT /me/listings/:id
   * Partial update of a listing. Only provided fields are changed.
   */
  me.put('/listings/:id', async (c) => {
    const user = c.get('user')
    const listingId = c.req.param('id')

    const body = await c.req.json().catch(() => null)
    if (body === null) {
      return badRequest(c, 'Invalid JSON payload')
    }

    const parsed = listingUpdateBody.safeParse(body)
    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    const artist = await prisma.artistProfile.findUnique({
      where: { userId: user.id },
    })

    if (!artist) {
      return notFound(c, 'Artist profile not found')
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    })

    if (!listing) {
      return notFound(c, 'Listing not found')
    }

    if (listing.artistId !== artist.id) {
      return c.json(
        { error: { code: 'FORBIDDEN', message: 'You do not own this listing' } },
        403,
      )
    }

    // Build update data — only include fields that were provided
    const updateData: Record<string, unknown> = {}

    if (parsed.data.title !== undefined) updateData.title = sanitizeText(parsed.data.title)
    if (parsed.data.description !== undefined) updateData.description = sanitizeText(parsed.data.description)
    if (parsed.data.medium !== undefined) updateData.medium = sanitizeText(parsed.data.medium)
    if (parsed.data.category !== undefined) updateData.category = parsed.data.category
    if (parsed.data.type !== undefined) updateData.type = parsed.data.type
    if (parsed.data.price !== undefined) updateData.price = parsed.data.price
    if (parsed.data.quantityTotal !== undefined) {
      updateData.quantityTotal = parsed.data.quantityTotal
      if (listing.quantityRemaining > parsed.data.quantityTotal) {
        updateData.quantityRemaining = parsed.data.quantityTotal
      }
    }
    if (parsed.data.artworkLength !== undefined) updateData.artworkLength = parsed.data.artworkLength
    if (parsed.data.artworkWidth !== undefined) updateData.artworkWidth = parsed.data.artworkWidth
    if (parsed.data.artworkHeight !== undefined) updateData.artworkHeight = parsed.data.artworkHeight
    if (parsed.data.packedLength !== undefined) updateData.packedLength = parsed.data.packedLength
    if (parsed.data.packedWidth !== undefined) updateData.packedWidth = parsed.data.packedWidth
    if (parsed.data.packedHeight !== undefined) updateData.packedHeight = parsed.data.packedHeight
    if (parsed.data.packedWeight !== undefined) updateData.packedWeight = parsed.data.packedWeight
    if (parsed.data.editionNumber !== undefined) updateData.editionNumber = parsed.data.editionNumber
    if (parsed.data.editionTotal !== undefined) updateData.editionTotal = parsed.data.editionTotal

    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: updateData,
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    })

    logger.info('Listing updated', { artistId: artist.id, listingId, fieldsUpdated: Object.keys(updateData) })

    triggerRevalidation({ type: 'listing', id: listingId, category: updated.category, artistSlug: artist.slug })

    return c.json(formatListingResponse(updated))
  })

  /**
   * DELETE /me/listings/:id
   * Hard delete a listing. Rejects if listing has any orders.
   */
  me.delete('/listings/:id', async (c) => {
    const user = c.get('user')
    const listingId = c.req.param('id')

    const artist = await prisma.artistProfile.findUnique({
      where: { userId: user.id },
    })

    if (!artist) {
      return notFound(c, 'Artist profile not found')
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    })

    if (!listing) {
      return notFound(c, 'Listing not found')
    }

    if (listing.artistId !== artist.id) {
      return c.json(
        { error: { code: 'FORBIDDEN', message: 'You do not own this listing' } },
        403,
      )
    }

    // Check for existing orders — cannot delete if orders exist
    const orderCount = await prisma.order.count({
      where: { listingId },
    })

    if (orderCount > 0) {
      return conflict(c, 'Cannot delete a listing that has orders')
    }

    await prisma.listing.delete({
      where: { id: listingId },
    })

    logger.info('Listing deleted', { artistId: artist.id, listingId })

    triggerRevalidation({ type: 'listing', id: listingId, category: listing.category, artistSlug: artist.slug })

    return c.body(null, 204)
  })

  // ─── Listing Image Management ───────────────────────────────────────

  /**
   * POST /me/listings/:id/images
   * Add an image to a listing. Auto-assigns sortOrder.
   * Updates listing.isDocumented if process photo.
   */
  me.post('/listings/:id/images', async (c) => {
    const user = c.get('user')
    const listingId = c.req.param('id')

    let rawBody: unknown
    try {
      rawBody = await c.req.json()
    } catch {
      return badRequest(c, 'Invalid JSON body')
    }

    const parsed = listingImageBody.safeParse(rawBody)
    if (!parsed.success) {
      return c.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.issues } },
        400,
      )
    }

    // Validate CloudFront URL
    const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN
    if (!cloudfrontDomain) {
      logger.error('CLOUDFRONT_DOMAIN env var is not set')
      return c.json({ error: { code: 'INTERNAL_ERROR', message: 'Server configuration error' } }, 500)
    }
    let hostname: string
    try {
      hostname = new URL(parsed.data.url).hostname
    } catch {
      return badRequest(c, 'URL must be a valid URL from the platform CDN')
    }
    if (hostname !== cloudfrontDomain) {
      return badRequest(c, 'URL must be from the platform CDN')
    }

    const artist = await prisma.artistProfile.findUnique({
      where: { userId: user.id },
    })

    if (!artist) {
      return notFound(c, 'Artist profile not found')
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    })

    if (!listing) {
      return notFound(c, 'Listing not found')
    }

    if (listing.artistId !== artist.id) {
      return c.json(
        { error: { code: 'FORBIDDEN', message: 'You do not own this listing' } },
        403,
      )
    }

    // Auto-assign sortOrder based on existing image count
    const imageCount = await prisma.listingImage.count({
      where: { listingId },
    })

    const created = await prisma.listingImage.create({
      data: {
        listingId,
        url: parsed.data.url,
        isProcessPhoto: parsed.data.isProcessPhoto,
        sortOrder: imageCount,
        width: parsed.data.width ?? null,
        height: parsed.data.height ?? null,
      },
    })

    // Update listing.isDocumented if this is a process photo
    if (parsed.data.isProcessPhoto) {
      await prisma.listing.update({
        where: { id: listingId },
        data: { isDocumented: true },
      })
    }

    logger.info('Listing image created', { artistId: artist.id, listingId, imageId: created.id })

    triggerRevalidation({ type: 'listing', id: listingId, category: listing.category, artistSlug: artist.slug })

    return c.json(formatListingImage(created), 201)
  })

  /**
   * DELETE /me/listings/:id/images/:imageId
   * Remove an image from a listing.
   * Updates listing.isDocumented if last process photo is removed.
   */
  me.delete('/listings/:id/images/:imageId', async (c) => {
    const user = c.get('user')
    const listingId = c.req.param('id')
    const imageId = c.req.param('imageId')

    const artist = await prisma.artistProfile.findUnique({
      where: { userId: user.id },
    })

    if (!artist) {
      return notFound(c, 'Artist profile not found')
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    })

    if (!listing) {
      return notFound(c, 'Listing not found')
    }

    if (listing.artistId !== artist.id) {
      return c.json(
        { error: { code: 'FORBIDDEN', message: 'You do not own this listing' } },
        403,
      )
    }

    const image = await prisma.listingImage.findUnique({
      where: { id: imageId },
    })

    if (!image) {
      return notFound(c, 'Image not found')
    }

    if (image.listingId !== listingId) {
      return c.json(
        { error: { code: 'FORBIDDEN', message: 'Image does not belong to this listing' } },
        403,
      )
    }

    await prisma.listingImage.delete({
      where: { id: imageId },
    })

    // If deleted image was a process photo, check if any remain
    if (image.isProcessPhoto) {
      const remainingProcessPhotos = await prisma.listingImage.count({
        where: { listingId, isProcessPhoto: true },
      })

      if (remainingProcessPhotos === 0) {
        await prisma.listing.update({
          where: { id: listingId },
          data: { isDocumented: false },
        })
      }
    }

    logger.info('Listing image deleted', { artistId: artist.id, listingId, imageId })

    triggerRevalidation({ type: 'listing', id: listingId, category: listing.category, artistSlug: artist.slug })

    return c.body(null, 204)
  })

  /**
   * PUT /me/listings/:id/images/reorder
   * Reorder all images for a listing. Must include all image IDs.
   */
  me.put('/listings/:id/images/reorder', async (c) => {
    const user = c.get('user')
    const listingId = c.req.param('id')

    let rawBody: unknown
    try {
      rawBody = await c.req.json()
    } catch {
      return badRequest(c, 'Invalid JSON body')
    }

    const parsed = listingImageReorderBody.safeParse(rawBody)
    if (!parsed.success) {
      return c.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.issues } },
        400,
      )
    }

    const artist = await prisma.artistProfile.findUnique({
      where: { userId: user.id },
    })

    if (!artist) {
      return notFound(c, 'Artist profile not found')
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    })

    if (!listing) {
      return notFound(c, 'Listing not found')
    }

    if (listing.artistId !== artist.id) {
      return c.json(
        { error: { code: 'FORBIDDEN', message: 'You do not own this listing' } },
        403,
      )
    }

    // Verify all IDs belong to this listing
    const existingImages = await prisma.listingImage.findMany({
      where: { listingId },
    })

    const existingIds = new Set(existingImages.map((img: { id: string }) => img.id))
    const requestedIds = parsed.data.orderedIds

    // All provided IDs must exist in this listing and cover ALL images
    const allBelong = requestedIds.every((id: string) => existingIds.has(id))
    if (!allBelong || requestedIds.length !== existingIds.size) {
      return badRequest(c, 'orderedIds must contain all image IDs for this listing')
    }

    // Batch update sortOrder in a transaction
    await prisma.$transaction(
      requestedIds.map((id: string, index: number) =>
        prisma.listingImage.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    )

    // Fetch the reordered list
    const reordered = await prisma.listingImage.findMany({
      where: { listingId },
      orderBy: { sortOrder: 'asc' },
    })

    logger.info('Listing images reordered', { artistId: artist.id, listingId })

    return c.json({
      images: reordered.map((img: { id: string; url: string; isProcessPhoto: boolean; sortOrder: number; width: number | null; height: number | null; createdAt: Date }) => formatListingImage(img)),
    })
  })

  // ─── Listing Availability ───────────────────────────────────────────

  /**
   * PUT /me/listings/:id/availability
   * Toggle listing between available and reserved_artist.
   * Rejects if listing is sold or reserved_system.
   */
  me.put('/listings/:id/availability', async (c) => {
    const user = c.get('user')
    const listingId = c.req.param('id')

    let rawBody: unknown
    try {
      rawBody = await c.req.json()
    } catch {
      return badRequest(c, 'Invalid JSON body')
    }

    const parsed = listingAvailabilityBody.safeParse(rawBody)
    if (!parsed.success) {
      return c.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.issues } },
        400,
      )
    }

    const artist = await prisma.artistProfile.findUnique({
      where: { userId: user.id },
    })

    if (!artist) {
      return notFound(c, 'Artist profile not found')
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    })

    if (!listing) {
      return notFound(c, 'Listing not found')
    }

    if (listing.artistId !== artist.id) {
      return c.json(
        { error: { code: 'FORBIDDEN', message: 'You do not own this listing' } },
        403,
      )
    }

    // Cannot toggle sold or system-reserved listings
    if (listing.status === 'sold' || listing.status === 'reserved_system') {
      return conflict(c, `Cannot change availability of a ${listing.status} listing`)
    }

    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: { status: parsed.data.status },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    })

    logger.info('Listing availability toggled', { artistId: artist.id, listingId, status: parsed.data.status })

    triggerRevalidation({ type: 'listing', id: listingId, category: listing.category, artistSlug: artist.slug })

    return c.json(formatListingResponse(updated))
  })

  // ─── Stripe Connect Onboarding ──────────────────────────────────────

  me.post('/stripe/onboarding', authMiddleware(prisma), requireRole('artist'), async (c) => {
    const user = c.get('user') as AuthUser

    const frontendUrl = process.env.FRONTEND_URL
    if (!frontendUrl) {
      logger.error('FRONTEND_URL not configured')
      return internalError(c)
    }

    const artist = await prisma.artistProfile.findUnique({
      where: { userId: user.id },
    })
    if (!artist) {
      return notFound(c, 'Artist profile not found')
    }

    let stripeAccountId = artist.stripeAccountId

    try {
      const stripe = getStripeClient()
      // Create a new Stripe account if one doesn't exist yet
      if (!stripeAccountId) {
        const account = await stripe.accounts.create({
          type: 'standard',
          email: user.email,
        })
        stripeAccountId = account.id

        // Store the account ID immediately so the webhook can find this artist later
        await prisma.artistProfile.update({
          where: { id: artist.id },
          data: { stripeAccountId },
        })

        logger.info('Stripe Connect account created', { artistId: artist.id, stripeAccountId })
      }

      // Generate a new account link (works for both new and returning onboarding)
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        return_url: `${frontendUrl}/dashboard?stripe=complete`,
        refresh_url: `${frontendUrl}/dashboard?stripe=refresh`,
        type: 'account_onboarding',
      })

      return c.json({ url: accountLink.url } satisfies StripeOnboardingResponse)
    } catch (err) {
      logger.error('Stripe onboarding failed', { err, artistId: artist.id, stripeAccountId })
      return internalError(c)
    }
  })

  me.get('/stripe/status', authMiddleware(prisma), requireRole('artist'), async (c) => {
    const user = c.get('user') as AuthUser

    const artist = await prisma.artistProfile.findUnique({
      where: { userId: user.id },
    })
    if (!artist) {
      return notFound(c, 'Artist profile not found')
    }

    if (!artist.stripeAccountId) {
      return c.json({ status: 'not_started', stripeAccountId: null } satisfies StripeStatusResponse)
    }

    // Query Stripe to get the current onboarding status
    try {
      const stripe = getStripeClient()
      const account = await stripe.accounts.retrieve(artist.stripeAccountId)

      const status = account.charges_enabled ? 'complete' : 'pending'

      return c.json({
        status,
        stripeAccountId: artist.stripeAccountId,
      } satisfies StripeStatusResponse)
    } catch (err) {
      logger.error('Stripe status check failed', { err, artistId: artist.id, stripeAccountId: artist.stripeAccountId })
      return internalError(c)
    }
  })

  return me
}
