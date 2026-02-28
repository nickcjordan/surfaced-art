import { Hono } from 'hono'
import type { PrismaClient } from '@surfaced-art/db'
import type { CategoryType as PrismaCategoryType } from '@surfaced-art/db'
import type { CategoriesUpdateResponse, DashboardResponse, ProfileCompletionField, ProfileUpdateResponse } from '@surfaced-art/types'
import { categoriesUpdateBody, profileUpdateBody, sanitizeText } from '@surfaced-art/types'
import { logger } from '@surfaced-art/utils'
import { authMiddleware, requireRole, type AuthUser } from '../middleware/auth'
import { notFound, badRequest, validationError } from '../errors'

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
    const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN || '.cloudfront.net'
    for (const field of ['profileImageUrl', 'coverImageUrl'] as const) {
      const value = parsed.data[field]
      if (value && !value.includes(cloudfrontDomain)) {
        return badRequest(c, `${field} must be from the platform CDN`)
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

  return me
}
