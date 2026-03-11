import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Hono } from 'hono'
import { createAdminRoutes } from './index'
import { setVerifier, resetVerifier } from '../../middleware/auth'
import type { PrismaClient } from '@surfaced-art/db'

// Mock email module (required by applications sub-router)
vi.mock('@surfaced-art/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'msg-123' }),
  ArtistAcceptance: vi.fn(() => null),
  ArtistRejection: vi.fn(() => null),
}))

// Mock revalidation
vi.mock('../../lib/revalidation', () => ({
  triggerRevalidation: vi.fn(),
}))

// Mock stripe
const mockRefund = { id: 're_mock123', amount: 15000, status: 'succeeded' }
const mockStripeRefundsCreate = vi.fn().mockResolvedValue(mockRefund)
vi.mock('../../lib/stripe', () => ({
  getStripeClient: vi.fn(() => ({
    refunds: { create: mockStripeRefundsCreate },
  })),
}))

// ─── Test helpers ────────────────────────────────────────────────────

function createMockVerifier(sub = 'cognito-admin', email = 'admin@surfaced.art', name = 'Admin User') {
  return { verify: vi.fn().mockResolvedValue({ sub, email, name }) }
}

const ADMIN_USER_ID = 'admin-uuid-123'
const ORDER_ID = '00000000-0000-4000-8000-000000000001'
const BUYER_ID = '00000000-0000-4000-8000-000000000002'
const ARTIST_ID = '00000000-0000-4000-8000-000000000003'
const LISTING_ID = '00000000-0000-4000-8000-000000000004'

const mockAdminUser = {
  id: ADMIN_USER_ID,
  cognitoId: 'cognito-admin',
  email: 'admin@surfaced.art',
  fullName: 'Admin User',
  roles: [{ role: 'admin' }],
}

const mockOrder = {
  id: ORDER_ID,
  listingId: LISTING_ID,
  buyerId: BUYER_ID,
  artistId: ARTIST_ID,
  stripePaymentIntentId: 'pi_mock_123',
  artworkPrice: 15000,
  shippingCost: 1500,
  platformCommission: 4500,
  artistPayout: 10500,
  taxAmount: 750,
  status: 'paid',
  shippingCarrier: null,
  trackingNumber: null,
  daysToFulfill: null,
  shippedAt: null,
  deliveredAt: null,
  payoutReleasedAt: null,
  createdAt: new Date('2026-01-15'),
  updatedAt: new Date('2026-01-15'),
  buyer: { id: BUYER_ID, email: 'buyer@example.com', fullName: 'Jane Buyer' },
  artist: { id: ARTIST_ID, displayName: 'John Artist', slug: 'john-artist' },
  listing: { id: LISTING_ID, title: 'Beautiful Vase', price: 15000 },
  review: null,
}

function createMockPrisma(overrides?: {
  adminRoles?: string[]
  orders?: unknown[]
  orderCount?: number
  orderDetail?: unknown
}) {
  const adminRoles = overrides?.adminRoles ?? ['admin']
  const orders = overrides?.orders ?? [mockOrder]
  const orderCount = overrides?.orderCount ?? orders.length

  const userFindUnique = vi.fn().mockImplementation(({ where }: { where: { cognitoId?: string; id?: string } }) => {
    if (where.cognitoId === 'cognito-admin') {
      return Promise.resolve({ ...mockAdminUser, roles: adminRoles.map((r) => ({ role: r })) })
    }
    return Promise.resolve(null)
  })

  return {
    user: {
      findUnique: userFindUnique,
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
    order: {
      findMany: vi.fn().mockResolvedValue(orders),
      findUnique: vi.fn().mockImplementation(({ where }: { where: { id?: string } }) => {
        if (where.id === ORDER_ID) {
          return Promise.resolve(overrides?.orderDetail !== undefined ? overrides.orderDetail : mockOrder)
        }
        return Promise.resolve(null)
      }),
      count: vi.fn().mockResolvedValue(orderCount),
      update: vi.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) => {
        return Promise.resolve({ ...mockOrder, ...data })
      }),
    },
    listing: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
    },
    artistProfile: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
      update: vi.fn().mockResolvedValue({}),
    },
    artistApplication: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
      update: vi.fn().mockResolvedValue({}),
    },
    userRole: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
    },
    adminAuditLog: {
      create: vi.fn().mockResolvedValue({ id: 'audit-uuid-1' }),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
    $transaction: vi.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      return fn({
        artistApplication: { update: vi.fn().mockResolvedValue({}) },
        artistProfile: { findFirst: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue({}) },
        userRole: { create: vi.fn().mockResolvedValue({}) },
      })
    }),
  } as unknown as PrismaClient
}

function createTestApp(prisma: PrismaClient) {
  const app = new Hono()
  app.route('/admin', createAdminRoutes(prisma))
  return app
}

function getOrders(app: ReturnType<typeof createTestApp>, query = '', token?: string) {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request(`/admin/orders${query ? `?${query}` : ''}`, { headers })
}

function getOrderDetail(app: ReturnType<typeof createTestApp>, id: string, token?: string) {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request(`/admin/orders/${id}`, { headers })
}

function refundOrder(app: ReturnType<typeof createTestApp>, id: string, body: Record<string, unknown>, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request(`/admin/orders/${id}/refund`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

function updateOrderStatus(app: ReturnType<typeof createTestApp>, id: string, body: Record<string, unknown>, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request(`/admin/orders/${id}/status`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  })
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('GET /admin/orders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVerifier(createMockVerifier() as never)
  })
  afterEach(() => resetVerifier())

  it('should return 401 without auth token', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await getOrders(app)
    expect(res.status).toBe(401)
  })

  it('should return paginated order list', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await getOrders(app, '', 'valid-token')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].id).toBe(ORDER_ID)
    expect(body.data[0].buyer.email).toBe('buyer@example.com')
    expect(body.data[0].artist.displayName).toBe('John Artist')
    expect(body.data[0].listing.title).toBe('Beautiful Vase')
    expect(body.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 })
  })

  it('should filter by status', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    await getOrders(app, 'status=paid', 'valid-token')

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'paid' }),
      }),
    )
  })

  it('should filter by buyerId', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    await getOrders(app, `buyerId=${BUYER_ID}`, 'valid-token')

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ buyerId: BUYER_ID }),
      }),
    )
  })

  it('should filter by artistId', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    await getOrders(app, `artistId=${ARTIST_ID}`, 'valid-token')

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ artistId: ARTIST_ID }),
      }),
    )
  })

  it('should filter by date range', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    await getOrders(app, 'dateFrom=2026-01-01T00:00:00.000Z&dateTo=2026-02-01T00:00:00.000Z', 'valid-token')

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: {
            gte: new Date('2026-01-01T00:00:00.000Z'),
            lte: new Date('2026-02-01T00:00:00.000Z'),
          },
        }),
      }),
    )
  })
})

describe('GET /admin/orders/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVerifier(createMockVerifier() as never)
  })
  afterEach(() => resetVerifier())

  it('should return 404 when order not found', async () => {
    const prisma = createMockPrisma({ orderDetail: null })
    const app = createTestApp(prisma)
    const res = await getOrderDetail(app, ORDER_ID, 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should return full order detail with buyer, artist, listing, and review', async () => {
    const orderWithReview = {
      ...mockOrder,
      review: {
        id: 'review-uuid-1',
        overallRating: 4.5,
        headline: 'Great piece!',
        createdAt: new Date('2026-02-01'),
      },
    }
    const prisma = createMockPrisma({ orderDetail: orderWithReview })
    const app = createTestApp(prisma)
    const res = await getOrderDetail(app, ORDER_ID, 'valid-token')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.id).toBe(ORDER_ID)
    expect(body.stripePaymentIntentId).toBe('pi_mock_123')
    expect(body.artworkPrice).toBe(15000)
    expect(body.platformCommission).toBe(4500)
    expect(body.buyer.email).toBe('buyer@example.com')
    expect(body.artist.displayName).toBe('John Artist')
    expect(body.listing.title).toBe('Beautiful Vase')
    expect(body.review).toBeTruthy()
    expect(body.review.overallRating).toBe(4.5)
  })
})

describe('POST /admin/orders/:id/refund', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVerifier(createMockVerifier() as never)
  })
  afterEach(() => resetVerifier())

  it('should return 404 when order not found', async () => {
    const prisma = createMockPrisma({ orderDetail: null })
    const app = createTestApp(prisma)
    const res = await refundOrder(app, ORDER_ID, { reason: 'Damaged item' }, 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should require a reason', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await refundOrder(app, ORDER_ID, {}, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should reject refund for already refunded order', async () => {
    const refundedOrder = { ...mockOrder, status: 'refunded' }
    const prisma = createMockPrisma({ orderDetail: refundedOrder })
    const app = createTestApp(prisma)
    const res = await refundOrder(app, ORDER_ID, { reason: 'Duplicate' }, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should initiate full refund via Stripe', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await refundOrder(app, ORDER_ID, { reason: 'Damaged item' }, 'valid-token')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.message).toContain('refund')
    expect(body.refund.stripeRefundId).toBe('re_mock123')
    expect(body.refund.amount).toBe(15000)

    expect(mockStripeRefundsCreate).toHaveBeenCalledWith({
      payment_intent: 'pi_mock_123',
      reason: 'requested_by_customer',
    })
  })

  it('should initiate partial refund when amount is provided', async () => {
    mockStripeRefundsCreate.mockResolvedValueOnce({ id: 're_partial', amount: 5000, status: 'succeeded' })
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await refundOrder(app, ORDER_ID, { reason: 'Partial damage', amount: 5000 }, 'valid-token')
    expect(res.status).toBe(200)

    expect(mockStripeRefundsCreate).toHaveBeenCalledWith({
      payment_intent: 'pi_mock_123',
      amount: 5000,
      reason: 'requested_by_customer',
    })
  })

  it('should reject partial refund exceeding total amount', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const totalAmount = mockOrder.artworkPrice + mockOrder.shippingCost + mockOrder.taxAmount
    const res = await refundOrder(app, ORDER_ID, { reason: 'Too much', amount: totalAmount + 1 }, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should update order status to refunded on full refund', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    await refundOrder(app, ORDER_ID, { reason: 'Damaged item' }, 'valid-token')

    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ORDER_ID },
        data: expect.objectContaining({ status: 'refunded' }),
      }),
    )
  })

  it('should write audit log on refund', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    await refundOrder(app, ORDER_ID, { reason: 'Damaged item' }, 'valid-token')

    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          adminId: ADMIN_USER_ID,
          action: 'order_refund',
          targetType: 'order',
          targetId: ORDER_ID,
        }),
      }),
    )
  })
})

describe('PUT /admin/orders/:id/status', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVerifier(createMockVerifier() as never)
  })
  afterEach(() => resetVerifier())

  it('should return 404 when order not found', async () => {
    const prisma = createMockPrisma({ orderDetail: null })
    const app = createTestApp(prisma)
    const res = await updateOrderStatus(app, ORDER_ID, { status: 'shipped', reason: 'Test' }, 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should require status and reason', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await updateOrderStatus(app, ORDER_ID, {}, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should allow valid status transition (paid -> shipped)', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await updateOrderStatus(app, ORDER_ID, { status: 'shipped', reason: 'Shipped via USPS' }, 'valid-token')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.message).toContain('status')
  })

  it('should reject invalid status transition (paid -> complete)', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await updateOrderStatus(app, ORDER_ID, { status: 'complete', reason: 'Skip ahead' }, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should reject transition from terminal status (refunded)', async () => {
    const refundedOrder = { ...mockOrder, status: 'refunded' }
    const prisma = createMockPrisma({ orderDetail: refundedOrder })
    const app = createTestApp(prisma)
    const res = await updateOrderStatus(app, ORDER_ID, { status: 'paid', reason: 'Undo' }, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should update order status in database', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    await updateOrderStatus(app, ORDER_ID, { status: 'shipped', reason: 'Shipped via USPS' }, 'valid-token')

    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ORDER_ID },
        data: expect.objectContaining({ status: 'shipped' }),
      }),
    )
  })

  it('should write audit log with old and new status', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    await updateOrderStatus(app, ORDER_ID, { status: 'shipped', reason: 'Shipped via USPS' }, 'valid-token')

    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          adminId: ADMIN_USER_ID,
          action: 'order_status_update',
          targetType: 'order',
          targetId: ORDER_ID,
          details: expect.objectContaining({
            oldStatus: 'paid',
            newStatus: 'shipped',
            reason: 'Shipped via USPS',
          }),
        }),
      }),
    )
  })
})
