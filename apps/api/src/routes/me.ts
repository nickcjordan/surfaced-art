import { Hono } from 'hono'
import type { PrismaClient } from '@surfaced-art/db'
import type { DashboardResponse, ProfileCompletionField } from '@surfaced-art/types'
import { logger } from '@surfaced-art/utils'
import { authMiddleware, requireRole, type AuthUser } from '../middleware/auth'
import { notFound } from '../errors'

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
      { label: 'Bio', complete: (artist.bio ?? '').trim().length > 0 },
      { label: 'Location', complete: (artist.location ?? '').trim().length > 0 },
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

  return me
}
