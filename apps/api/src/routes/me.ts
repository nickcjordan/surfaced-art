import { Hono } from 'hono'
import type { PrismaClient } from '@surfaced-art/db'
import type { CategoryType as PrismaCategoryType } from '@surfaced-art/db'
import type { CategoriesUpdateResponse, CvEntryResponse, CvEntryListResponse, DashboardResponse, ProcessMediaResponse, ProcessMediaListResponse, ProfileCompletionField, ProfileUpdateResponse } from '@surfaced-art/types'
import { categoriesUpdateBody, cvEntryBody, cvEntryReorderBody, processMediaPhotoBody, processMediaVideoBody, processMediaReorderBody, profileUpdateBody, sanitizeText } from '@surfaced-art/types'
import { logger } from '@surfaced-art/utils'
import { authMiddleware, requireRole, type AuthUser } from '../middleware/auth'
import { notFound, badRequest, validationError } from '../errors'

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

  return me
}
