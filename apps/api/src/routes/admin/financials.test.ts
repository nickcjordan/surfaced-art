import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { createAdminRoutes } from './index'
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
vi.mock('../../lib/stripe', () => ({
  getStripeClient: vi.fn(() => ({
    refunds: { create: vi.fn() },
  })),
}))

// ─── Test helpers ────────────────────────────────────────────────────

function createAuthEnv(sub = 'cognito-admin', email = 'admin@surfaced.art', name = 'Admin User') {
  return {
    requestContext: {
      authorizer: {
        jwt: {
          claims: { sub, email, name },
        },
      },
    },
  }
}

const ADMIN_USER_ID = 'admin-uuid-123'
const ARTIST_PROFILE_ID_1 = '00000000-0000-4000-8000-000000000010'
const ARTIST_PROFILE_ID_2 = '00000000-0000-4000-8000-000000000020'

const mockAdminUser = {
  id: ADMIN_USER_ID,
  cognitoId: 'cognito-admin',
  email: 'admin@surfaced.art',
  fullName: 'Admin User',
  roles: [{ role: 'admin' }],
}

const mockNonAdminUser = {
  id: 'user-uuid-456',
  cognitoId: 'cognito-user',
  email: 'user@example.com',
  fullName: 'Regular User',
  roles: [{ role: 'buyer' }],
}

// ─── Setup ──────────────────────────────────────────────────────────

let app: Hono
let prisma: PrismaClient

beforeEach(() => {
  vi.clearAllMocks()

  prisma = {
    user: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    order: {
      aggregate: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    artistProfile: {
      findMany: vi.fn(),
    },
  } as unknown as PrismaClient

  vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdminUser as never)
  vi.mocked(prisma.user.upsert).mockResolvedValue(mockAdminUser as never)

  const adminRoutes = createAdminRoutes(prisma)
  app = new Hono()
  app.route('/admin', adminRoutes)
})

// ─── GET /admin/financials/summary ──────────────────────────────────

describe('GET /admin/financials/summary', () => {
  it('should return 403 for non-admin users', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockNonAdminUser as never)
    vi.mocked(prisma.user.upsert).mockResolvedValue(mockNonAdminUser as never)

    const res = await app.request('/admin/financials/summary', {
      method: 'GET',
    }, createAuthEnv('cognito-user'))

    expect(res.status).toBe(403)
  })

  it('should return financial summary for all orders', async () => {
    vi.mocked(prisma.order.aggregate).mockResolvedValue({
      _sum: {
        artworkPrice: 300000,
        platformCommission: 90000,
        artistPayout: 210000,
        shippingCost: 15000,
        taxAmount: 7500,
      },
      _count: { id: 5 },
    } as never)

    const res = await app.request('/admin/financials/summary', {
      method: 'GET',
    }, createAuthEnv())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.totalGmv).toBe(300000)
    expect(body.totalCommission).toBe(90000)
    expect(body.totalArtistPayouts).toBe(210000)
    expect(body.totalShipping).toBe(15000)
    expect(body.totalTax).toBe(7500)
    expect(body.orderCount).toBe(5)
  })

  it('should return zeros when no qualifying orders exist', async () => {
    vi.mocked(prisma.order.aggregate).mockResolvedValue({
      _sum: {
        artworkPrice: null,
        platformCommission: null,
        artistPayout: null,
        shippingCost: null,
        taxAmount: null,
      },
      _count: { id: 0 },
    } as never)

    const res = await app.request('/admin/financials/summary', {
      method: 'GET',
    }, createAuthEnv())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.totalGmv).toBe(0)
    expect(body.totalCommission).toBe(0)
    expect(body.totalArtistPayouts).toBe(0)
    expect(body.totalShipping).toBe(0)
    expect(body.totalTax).toBe(0)
    expect(body.orderCount).toBe(0)
  })

  it('should filter by date range when from/to provided', async () => {
    vi.mocked(prisma.order.aggregate).mockResolvedValue({
      _sum: {
        artworkPrice: 50000,
        platformCommission: 15000,
        artistPayout: 35000,
        shippingCost: 2000,
        taxAmount: 1000,
      },
      _count: { id: 1 },
    } as never)

    const res = await app.request('/admin/financials/summary?from=2026-01-01&to=2026-01-31', {
      method: 'GET',
    }, createAuthEnv())

    expect(res.status).toBe(200)

    // Verify the aggregate was called with a date filter
    const aggregateCall = vi.mocked(prisma.order.aggregate).mock.calls[0][0]
    expect(aggregateCall?.where?.createdAt).toBeDefined()
  })

  it('should only include qualifying order statuses', async () => {
    vi.mocked(prisma.order.aggregate).mockResolvedValue({
      _sum: {
        artworkPrice: 100000,
        platformCommission: 30000,
        artistPayout: 70000,
        shippingCost: 5000,
        taxAmount: 2500,
      },
      _count: { id: 2 },
    } as never)

    await app.request('/admin/financials/summary', {
      method: 'GET',
    }, createAuthEnv())

    const aggregateCall = vi.mocked(prisma.order.aggregate).mock.calls[0][0]
    expect(aggregateCall?.where?.status?.in).toEqual(
      expect.arrayContaining(['paid', 'shipped', 'delivered', 'complete'])
    )
    expect(aggregateCall?.where?.status?.in).not.toContain('pending')
    expect(aggregateCall?.where?.status?.in).not.toContain('refunded')
    expect(aggregateCall?.where?.status?.in).not.toContain('disputed')
  })
})

// ─── GET /admin/financials/artists ──────────────────────────────────

describe('GET /admin/financials/artists', () => {
  it('should return 403 for non-admin users', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockNonAdminUser as never)
    vi.mocked(prisma.user.upsert).mockResolvedValue(mockNonAdminUser as never)

    const res = await app.request('/admin/financials/artists', {
      method: 'GET',
    }, createAuthEnv('cognito-user'))

    expect(res.status).toBe(403)
  })

  it('should return per-artist financial breakdown', async () => {
    vi.mocked(prisma.order.groupBy).mockResolvedValue([
      {
        artistId: ARTIST_PROFILE_ID_1,
        _count: { id: 3 },
        _sum: {
          artworkPrice: 200000,
          platformCommission: 60000,
          artistPayout: 140000,
        },
      },
      {
        artistId: ARTIST_PROFILE_ID_2,
        _count: { id: 1 },
        _sum: {
          artworkPrice: 50000,
          platformCommission: 15000,
          artistPayout: 35000,
        },
      },
    ] as never)

    vi.mocked(prisma.artistProfile.findMany).mockResolvedValue([
      { id: ARTIST_PROFILE_ID_1, displayName: 'Jane Artist', slug: 'jane-artist' },
      { id: ARTIST_PROFILE_ID_2, displayName: 'Bob Painter', slug: 'bob-painter' },
    ] as never)

    const res = await app.request('/admin/financials/artists', {
      method: 'GET',
    }, createAuthEnv())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(2)

    const jane = body.data.find((a: { artistId: string }) => a.artistId === ARTIST_PROFILE_ID_1)
    expect(jane).toBeDefined()
    expect(jane.displayName).toBe('Jane Artist')
    expect(jane.slug).toBe('jane-artist')
    expect(jane.orderCount).toBe(3)
    expect(jane.totalArtworkRevenue).toBe(200000)
    expect(jane.totalCommission).toBe(60000)
    expect(jane.totalArtistPayout).toBe(140000)

    const bob = body.data.find((a: { artistId: string }) => a.artistId === ARTIST_PROFILE_ID_2)
    expect(bob).toBeDefined()
    expect(bob.orderCount).toBe(1)
    expect(bob.totalArtworkRevenue).toBe(50000)
  })

  it('should return empty data when no qualifying orders exist', async () => {
    vi.mocked(prisma.order.groupBy).mockResolvedValue([] as never)

    const res = await app.request('/admin/financials/artists', {
      method: 'GET',
    }, createAuthEnv())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual([])
  })

  it('should filter by date range when from/to provided', async () => {
    vi.mocked(prisma.order.groupBy).mockResolvedValue([] as never)

    await app.request('/admin/financials/artists?from=2026-02-01&to=2026-02-28', {
      method: 'GET',
    }, createAuthEnv())

    const groupByCall = vi.mocked(prisma.order.groupBy).mock.calls[0][0]
    expect(groupByCall?.where?.createdAt).toBeDefined()
  })

  it('should only include qualifying order statuses', async () => {
    vi.mocked(prisma.order.groupBy).mockResolvedValue([] as never)

    await app.request('/admin/financials/artists', {
      method: 'GET',
    }, createAuthEnv())

    const groupByCall = vi.mocked(prisma.order.groupBy).mock.calls[0][0]
    expect(groupByCall?.where?.status?.in).toEqual(
      expect.arrayContaining(['paid', 'shipped', 'delivered', 'complete'])
    )
    expect(groupByCall?.where?.status?.in).not.toContain('pending')
    expect(groupByCall?.where?.status?.in).not.toContain('refunded')
  })
})
