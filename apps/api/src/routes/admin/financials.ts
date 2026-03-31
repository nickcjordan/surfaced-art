import { Hono } from 'hono'
import type { PrismaClient } from '@surfaced-art/db'
import type {
  AdminFinancialSummaryResponse,
  AdminArtistFinancialsResponse,
} from '@surfaced-art/types'
import { adminFinancialSummaryQuery, adminArtistFinancialsQuery } from '@surfaced-art/types'
import { logger } from '@surfaced-art/utils'
import type { AuthUser } from '../../middleware/auth'
import { validationError } from '../../errors'

/** Order statuses that count toward earned revenue */
const QUALIFYING_STATUSES = ['paid', 'shipped', 'delivered', 'complete'] as const

function buildDateFilter(from?: string, to?: string) {
  if (!from && !to) return undefined
  const filter: { gte?: Date; lte?: Date } = {}
  if (from) filter.gte = new Date(`${from}T00:00:00.000Z`)
  if (to) filter.lte = new Date(`${to}T23:59:59.999Z`)
  return filter
}

export function createAdminFinancialRoutes(prisma: PrismaClient) {
  const app = new Hono<{ Variables: { user: AuthUser } }>()

  /**
   * GET /admin/financials/summary
   * Returns total platform revenue, payouts, shipping, tax, and order count.
   */
  app.get('/summary', async (c) => {
    const parsed = adminFinancialSummaryQuery.safeParse(c.req.query())
    if (!parsed.success) return validationError(c, parsed.error)

    const { from, to } = parsed.data
    const dateFilter = buildDateFilter(from, to)

    const result = await prisma.order.aggregate({
      where: {
        status: { in: [...QUALIFYING_STATUSES] },
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      _sum: {
        artworkPrice: true,
        platformCommission: true,
        artistPayout: true,
        shippingCost: true,
        taxAmount: true,
      },
      _count: { id: true },
    })

    const response: AdminFinancialSummaryResponse = {
      totalGmv: result._sum.artworkPrice ?? 0,
      totalCommission: result._sum.platformCommission ?? 0,
      totalArtistPayouts: result._sum.artistPayout ?? 0,
      totalShipping: result._sum.shippingCost ?? 0,
      totalTax: result._sum.taxAmount ?? 0,
      orderCount: result._count.id,
    }

    logger.info('Admin financial summary requested', {
      from,
      to,
      orderCount: response.orderCount,
    })

    return c.json(response)
  })

  /**
   * GET /admin/financials/artists
   * Returns per-artist financial breakdown.
   */
  app.get('/artists', async (c) => {
    const parsed = adminArtistFinancialsQuery.safeParse(c.req.query())
    if (!parsed.success) return validationError(c, parsed.error)

    const { from, to } = parsed.data
    const dateFilter = buildDateFilter(from, to)

    const grouped = await prisma.order.groupBy({
      by: ['artistId'],
      where: {
        status: { in: [...QUALIFYING_STATUSES] },
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      _sum: {
        artworkPrice: true,
        platformCommission: true,
        artistPayout: true,
      },
      _count: { id: true },
      orderBy: { _sum: { artworkPrice: 'desc' } },
    })

    if (grouped.length === 0) {
      return c.json({ data: [] } satisfies AdminArtistFinancialsResponse)
    }

    // Fetch artist profile details for the artists that have orders
    const artistIds = grouped.map((g) => g.artistId)
    const profiles = await prisma.artistProfile.findMany({
      where: { id: { in: artistIds } },
      select: { id: true, displayName: true, slug: true },
    })

    const profileMap = new Map(profiles.map((p) => [p.id, p]))

    const data = grouped.map((g) => {
      const profile = profileMap.get(g.artistId)
      return {
        artistId: g.artistId,
        displayName: profile?.displayName ?? 'Unknown Artist',
        slug: profile?.slug ?? '',
        orderCount: g._count.id,
        totalArtworkRevenue: g._sum.artworkPrice ?? 0,
        totalCommission: g._sum.platformCommission ?? 0,
        totalArtistPayout: g._sum.artistPayout ?? 0,
      }
    })

    logger.info('Admin artist financials requested', {
      from,
      to,
      artistCount: data.length,
    })

    return c.json({ data } satisfies AdminArtistFinancialsResponse)
  })

  return app
}
