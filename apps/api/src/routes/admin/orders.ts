import { Hono } from 'hono'
import type { PrismaClient, Prisma } from '@surfaced-art/db'
import { logger } from '@surfaced-art/utils'
import { adminOrdersQuery, adminOrderRefundBody, adminOrderStatusUpdateBody } from '@surfaced-art/types'
import type {
  AdminOrderListItem,
  AdminOrderDetailResponse,
  AdminOrderRefundResponse,
  AdminActionResponse,
  PaginatedResponse,
} from '@surfaced-art/types'
import type { AuthUser } from '../../middleware/auth'
import { notFound, validationError, badRequest, internalError } from '../../errors'
import { logAdminAction } from '../../lib/audit'
import { getStripeClient } from '../../lib/stripe'

/**
 * Valid status transitions for orders.
 * Key = current status, Value = set of allowed next statuses.
 */
const VALID_TRANSITIONS: Record<string, Set<string>> = {
  pending: new Set(['paid', 'refunded']),
  paid: new Set(['shipped', 'disputed', 'refunded']),
  shipped: new Set(['delivered', 'disputed', 'refunded']),
  delivered: new Set(['complete', 'disputed', 'refunded']),
  disputed: new Set(['refunded', 'complete']),
  // Terminal states — no transitions allowed
  complete: new Set(),
  refunded: new Set(),
}

export function createAdminOrderRoutes(prisma: PrismaClient) {
  const app = new Hono<{ Variables: { user: AuthUser } }>()

  /**
   * GET /admin/orders
   * Paginated order list with filters for status, buyer, artist, date range.
   */
  app.get('/', async (c) => {
    const start = Date.now()

    const parsed = adminOrdersQuery.safeParse({
      status: c.req.query('status'),
      buyerId: c.req.query('buyerId'),
      artistId: c.req.query('artistId'),
      dateFrom: c.req.query('dateFrom'),
      dateTo: c.req.query('dateTo'),
      page: c.req.query('page'),
      limit: c.req.query('limit'),
    })

    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    const { status, buyerId, artistId, dateFrom, dateTo, page, limit } = parsed.data
    const skip = (page - 1) * limit

    const where: Prisma.OrderWhereInput = {}

    if (status) {
      where.status = status as Prisma.OrderWhereInput['status']
    }

    if (buyerId) {
      where.buyerId = buyerId
    }

    if (artistId) {
      where.artistId = artistId
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          buyer: { select: { id: true, email: true, fullName: true } },
          artist: { select: { id: true, displayName: true, slug: true } },
          listing: { select: { id: true, title: true } },
        },
      }),
      prisma.order.count({ where }),
    ])

    const data: AdminOrderListItem[] = orders.map((order) => ({
      id: order.id,
      listingId: order.listingId,
      buyerId: order.buyerId,
      artistId: order.artistId,
      artworkPrice: order.artworkPrice,
      shippingCost: order.shippingCost,
      platformCommission: order.platformCommission,
      artistPayout: order.artistPayout,
      taxAmount: order.taxAmount,
      status: order.status,
      shippingCarrier: order.shippingCarrier,
      trackingNumber: order.trackingNumber,
      shippedAt: order.shippedAt ? order.shippedAt.toISOString() : null,
      deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      buyer: (order as unknown as { buyer: AdminOrderListItem['buyer'] }).buyer,
      artist: (order as unknown as { artist: AdminOrderListItem['artist'] }).artist,
      listing: (order as unknown as { listing: AdminOrderListItem['listing'] }).listing,
    }))

    const response: PaginatedResponse<AdminOrderListItem> = {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }

    logger.info('Admin orders listed', {
      page, limit, total,
      status: status ?? null,
      durationMs: Date.now() - start,
    })

    return c.json(response)
  })

  /**
   * GET /admin/orders/:id
   * Full order detail with buyer, artist, listing, review, and financial breakdown.
   */
  app.get('/:id', async (c) => {
    const start = Date.now()
    const { id } = c.req.param()

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        buyer: { select: { id: true, email: true, fullName: true } },
        artist: { select: { id: true, displayName: true, slug: true } },
        listing: { select: { id: true, title: true, price: true } },
        review: {
          select: { id: true, overallRating: true, headline: true, createdAt: true },
        },
      },
    })

    if (!order) {
      return notFound(c, 'Order not found')
    }

    const included = order as unknown as {
      buyer: AdminOrderDetailResponse['buyer']
      artist: AdminOrderDetailResponse['artist']
      listing: AdminOrderDetailResponse['listing']
      review: { id: string; overallRating: number; headline: string | null; createdAt: Date } | null
    }

    const response: AdminOrderDetailResponse = {
      id: order.id,
      listingId: order.listingId,
      buyerId: order.buyerId,
      artistId: order.artistId,
      stripePaymentIntentId: order.stripePaymentIntentId,
      artworkPrice: order.artworkPrice,
      shippingCost: order.shippingCost,
      platformCommission: order.platformCommission,
      artistPayout: order.artistPayout,
      taxAmount: order.taxAmount,
      status: order.status,
      shippingCarrier: order.shippingCarrier,
      trackingNumber: order.trackingNumber,
      daysToFulfill: order.daysToFulfill,
      shippedAt: order.shippedAt ? order.shippedAt.toISOString() : null,
      deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
      payoutReleasedAt: order.payoutReleasedAt ? order.payoutReleasedAt.toISOString() : null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      buyer: included.buyer,
      artist: included.artist,
      listing: included.listing,
      review: included.review
        ? {
            id: included.review.id,
            overallRating: included.review.overallRating,
            headline: included.review.headline,
            createdAt: included.review.createdAt.toISOString(),
          }
        : null,
    }

    logger.info('Admin order detail fetched', {
      orderId: id,
      durationMs: Date.now() - start,
    })

    return c.json(response)
  })

  /**
   * POST /admin/orders/:id/refund
   * Initiate a Stripe refund (full or partial).
   */
  app.post('/:id/refund', async (c) => {
    const start = Date.now()
    const adminUser = c.get('user')
    const { id } = c.req.param()

    const body = await c.req.json().catch(() => ({}))
    const parsed = adminOrderRefundBody.safeParse(body)
    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    const { reason, amount } = parsed.data

    try {
      const order = await prisma.order.findUnique({ where: { id } })
      if (!order) {
        return notFound(c, 'Order not found')
      }

      if (order.status === 'refunded') {
        return badRequest(c, 'Order has already been refunded')
      }

      const totalAmount = order.artworkPrice + order.shippingCost + order.taxAmount

      if (amount !== undefined && amount > totalAmount) {
        return badRequest(c, `Refund amount (${amount}) exceeds order total (${totalAmount})`)
      }

      const isFullRefund = amount === undefined

      const stripe = getStripeClient()
      const refundParams: { payment_intent: string; amount?: number; reason: string } = {
        payment_intent: order.stripePaymentIntentId,
        reason: 'requested_by_customer',
      }
      if (!isFullRefund) {
        refundParams.amount = amount
      }

      const stripeRefund = await stripe.refunds.create(refundParams)

      if (isFullRefund) {
        await prisma.order.update({
          where: { id },
          data: { status: 'refunded' },
        })
      }

      void logAdminAction(prisma, {
        adminId: adminUser.id,
        action: 'order_refund',
        targetType: 'order',
        targetId: id,
        details: {
          reason,
          amount: stripeRefund.amount,
          isFullRefund,
          stripeRefundId: stripeRefund.id,
        },
      })

      const response: AdminOrderRefundResponse = {
        message: isFullRefund ? 'Full refund initiated successfully' : 'Partial refund initiated successfully',
        refund: {
          stripeRefundId: stripeRefund.id,
          amount: stripeRefund.amount,
          status: stripeRefund.status ?? 'unknown',
        },
      }

      logger.info('Admin initiated order refund', {
        orderId: id,
        amount: stripeRefund.amount,
        isFullRefund,
        refundedBy: adminUser.id,
        durationMs: Date.now() - start,
      })

      return c.json(response)
    } catch (err) {
      logger.error('Order refund failed', {
        orderId: id,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
      })
      return internalError(c)
    }
  })

  /**
   * PUT /admin/orders/:id/status
   * Manual status update with transition validation.
   */
  app.put('/:id/status', async (c) => {
    const start = Date.now()
    const adminUser = c.get('user')
    const { id } = c.req.param()

    const body = await c.req.json().catch(() => ({}))
    const parsed = adminOrderStatusUpdateBody.safeParse(body)
    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    const { status: newStatus, reason } = parsed.data

    try {
      const order = await prisma.order.findUnique({ where: { id } })
      if (!order) {
        return notFound(c, 'Order not found')
      }

      const oldStatus = order.status
      const allowed = VALID_TRANSITIONS[oldStatus]
      if (!allowed || !allowed.has(newStatus)) {
        return badRequest(c, `Invalid status transition: ${oldStatus} → ${newStatus}`)
      }

      const updateData: Prisma.OrderUpdateInput = { status: newStatus }

      if (newStatus === 'shipped' && !order.shippedAt) {
        updateData.shippedAt = new Date()
      }
      if (newStatus === 'delivered' && !order.deliveredAt) {
        updateData.deliveredAt = new Date()
      }

      await prisma.order.update({
        where: { id },
        data: updateData,
      })

      void logAdminAction(prisma, {
        adminId: adminUser.id,
        action: 'order_status_update',
        targetType: 'order',
        targetId: id,
        details: { oldStatus, newStatus, reason },
      })

      const response: AdminActionResponse = {
        message: `Order status updated from ${oldStatus} to ${newStatus}`,
      }

      logger.info('Admin updated order status', {
        orderId: id,
        oldStatus,
        newStatus,
        updatedBy: adminUser.id,
        durationMs: Date.now() - start,
      })

      return c.json(response)
    } catch (err) {
      logger.error('Order status update failed', {
        orderId: id,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
      })
      return internalError(c)
    }
  })

  return app
}
