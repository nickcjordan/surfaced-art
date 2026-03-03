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

import { triggerRevalidation } from '../../lib/revalidation'

// ─── Test helpers ────────────────────────────────────────────────────

function createMockVerifier(sub = 'cognito-admin', email = 'admin@surfacedart.com', name = 'Admin User') {
  return { verify: vi.fn().mockResolvedValue({ sub, email, name }) }
}

const ADMIN_USER_ID = 'admin-uuid-123'
const LISTING_ID = 'listing-uuid-456'

const mockAdminUser = {
  id: ADMIN_USER_ID,
  cognitoId: 'cognito-admin',
  email: 'admin@surfacedart.com',
  fullName: 'Admin User',
  roles: [{ role: 'admin' }],
}

const mockListing = {
  id: LISTING_ID,
  artistId: 'artist-uuid-789',
  type: 'standard',
  title: 'Beautiful Vase',
  description: 'A handmade ceramic vase',
  medium: 'Ceramics',
  category: 'ceramics',
  price: 15000,
  status: 'available',
  isDocumented: true,
  quantityTotal: 1,
  quantityRemaining: 1,
  artworkLength: null,
  artworkWidth: null,
  artworkHeight: null,
  packedLength: { toNumber: () => 12 },
  packedWidth: { toNumber: () => 10 },
  packedHeight: { toNumber: () => 8 },
  packedWeight: { toNumber: () => 5 },
  editionNumber: null,
  editionTotal: null,
  reservedUntil: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-02-01'),
  images: [
    {
      id: 'img-1',
      listingId: LISTING_ID,
      url: 'https://cdn.example.com/vase.jpg',
      isProcessPhoto: false,
      sortOrder: 0,
      createdAt: new Date('2025-01-01'),
    },
  ],
  artist: {
    id: 'artist-uuid-789',
    displayName: 'Jane Artist',
    slug: 'jane-artist',
    status: 'approved',
  },
  _count: { orders: 2, reviews: 1 },
}

const mockListingForList = {
  ...mockListing,
  // For list view, only first image
  images: [mockListing.images[0]],
}

function createMockPrisma(overrides?: {
  adminRoles?: string[]
  listings?: unknown[]
  listingCount?: number
  listingDetail?: unknown
  updatedListing?: unknown
}) {
  const adminRoles = overrides?.adminRoles ?? ['admin']
  const listings = overrides?.listings ?? [mockListingForList]
  const listingCount = overrides?.listingCount ?? listings.length

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
    listing: {
      findMany: vi.fn().mockResolvedValue(listings),
      findUnique: vi.fn().mockImplementation(({ where }: { where: { id?: string } }) => {
        if (where.id === LISTING_ID) {
          return Promise.resolve(overrides?.listingDetail !== undefined ? overrides.listingDetail : mockListing)
        }
        return Promise.resolve(null)
      }),
      count: vi.fn().mockResolvedValue(listingCount),
      update: vi.fn().mockResolvedValue(
        overrides?.updatedListing ?? { ...mockListing, title: 'Updated Title' },
      ),
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

function getListings(app: ReturnType<typeof createTestApp>, query = '', token?: string) {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request(`/admin/listings${query ? `?${query}` : ''}`, { headers })
}

function getListingDetail(app: ReturnType<typeof createTestApp>, id: string, token?: string) {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request(`/admin/listings/${id}`, { headers })
}

function updateListing(app: ReturnType<typeof createTestApp>, id: string, body: Record<string, unknown>, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request(`/admin/listings/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  })
}

function hideListing(app: ReturnType<typeof createTestApp>, id: string, body: Record<string, unknown>, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request(`/admin/listings/${id}/hide`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

function unhideListing(app: ReturnType<typeof createTestApp>, id: string, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request(`/admin/listings/${id}/unhide`, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  })
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('GET /admin/listings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVerifier(createMockVerifier() as never)
  })
  afterEach(() => resetVerifier())

  it('should return 401 without auth token', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await getListings(app)
    expect(res.status).toBe(401)
  })

  it('should return paginated listing list', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await getListings(app, '', 'valid-token')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].title).toBe('Beautiful Vase')
    expect(body.data[0].artist.displayName).toBe('Jane Artist')
    expect(body.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 })
  })

  it('should filter by status', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    await getListings(app, 'status=hidden', 'valid-token')

    expect(prisma.listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'hidden' }),
      }),
    )
  })

  it('should filter by artistId', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const uuid = '00000000-0000-4000-8000-000000000789'
    await getListings(app, `artistId=${uuid}`, 'valid-token')

    expect(prisma.listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ artistId: uuid }),
      }),
    )
  })

  it('should filter by category', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    await getListings(app, 'category=ceramics', 'valid-token')

    expect(prisma.listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ category: 'ceramics' }),
      }),
    )
  })

  it('should filter by search on title', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    await getListings(app, 'search=vase', 'valid-token')

    expect(prisma.listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { title: { contains: 'vase', mode: 'insensitive' } },
          ]),
        }),
      }),
    )
  })

  it('should filter by price range', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    await getListings(app, 'priceMin=1000&priceMax=20000', 'valid-token')

    expect(prisma.listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          price: { gte: 1000, lte: 20000 },
        }),
      }),
    )
  })
})

describe('GET /admin/listings/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVerifier(createMockVerifier() as never)
  })
  afterEach(() => resetVerifier())

  it('should return 404 when listing not found', async () => {
    const prisma = createMockPrisma({ listingDetail: null })
    const app = createTestApp(prisma)
    const res = await getListingDetail(app, LISTING_ID, 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should return full listing detail with order and review counts', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await getListingDetail(app, LISTING_ID, 'valid-token')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.id).toBe(LISTING_ID)
    expect(body.title).toBe('Beautiful Vase')
    expect(body.artist.id).toBe('artist-uuid-789')
    expect(body.artist.displayName).toBe('Jane Artist')
    expect(body.orderCount).toBe(2)
    expect(body.reviewCount).toBe(1)
    expect(body.images).toHaveLength(1)
  })
})

describe('PUT /admin/listings/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVerifier(createMockVerifier() as never)
  })
  afterEach(() => resetVerifier())

  it('should return 404 when listing not found', async () => {
    const prisma = createMockPrisma({ listingDetail: null })
    const app = createTestApp(prisma)
    const res = await updateListing(app, LISTING_ID, { title: 'New Title' }, 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should update listing', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await updateListing(app, LISTING_ID, { title: 'New Title' }, 'valid-token')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.message).toContain('updated')
  })

  it('should write audit log on update', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    await updateListing(app, LISTING_ID, { title: 'New Title' }, 'valid-token')

    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          adminId: ADMIN_USER_ID,
          action: 'listing_update',
          targetType: 'listing',
          targetId: LISTING_ID,
        }),
      }),
    )
  })

  it('should trigger ISR revalidation', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    await updateListing(app, LISTING_ID, { title: 'New Title' }, 'valid-token')

    expect(triggerRevalidation).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'listing',
        id: LISTING_ID,
      }),
    )
  })

  it('should return validation error for invalid body', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await updateListing(app, LISTING_ID, { title: '' }, 'valid-token')
    expect(res.status).toBe(400)
  })
})

describe('POST /admin/listings/:id/hide', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVerifier(createMockVerifier() as never)
  })
  afterEach(() => resetVerifier())

  it('should return 404 when listing not found', async () => {
    const prisma = createMockPrisma({ listingDetail: null })
    const app = createTestApp(prisma)
    const res = await hideListing(app, LISTING_ID, { reason: 'Policy violation' }, 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should hide the listing', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await hideListing(app, LISTING_ID, { reason: 'Policy violation' }, 'valid-token')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.message).toContain('hidden')
  })

  it('should require a reason', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await hideListing(app, LISTING_ID, {}, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should set status to hidden', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    await hideListing(app, LISTING_ID, { reason: 'Policy violation' }, 'valid-token')

    expect(prisma.listing.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: LISTING_ID },
        data: { status: 'hidden' },
      }),
    )
  })

  it('should write audit log', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    await hideListing(app, LISTING_ID, { reason: 'Policy violation' }, 'valid-token')

    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'listing_hide',
          targetType: 'listing',
          targetId: LISTING_ID,
        }),
      }),
    )
  })
})

describe('POST /admin/listings/:id/unhide', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVerifier(createMockVerifier() as never)
  })
  afterEach(() => resetVerifier())

  it('should return 404 when listing not found', async () => {
    const prisma = createMockPrisma({ listingDetail: null })
    const app = createTestApp(prisma)
    const res = await unhideListing(app, LISTING_ID, 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should unhide the listing (restore to available)', async () => {
    const hidden = { ...mockListing, status: 'hidden' }
    const prisma = createMockPrisma({ listingDetail: hidden })
    const app = createTestApp(prisma)
    const res = await unhideListing(app, LISTING_ID, 'valid-token')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.message).toContain('unhidden')
  })

  it('should set status to available', async () => {
    const hidden = { ...mockListing, status: 'hidden' }
    const prisma = createMockPrisma({ listingDetail: hidden })
    const app = createTestApp(prisma)
    await unhideListing(app, LISTING_ID, 'valid-token')

    expect(prisma.listing.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: LISTING_ID },
        data: { status: 'available' },
      }),
    )
  })

  it('should write audit log', async () => {
    const hidden = { ...mockListing, status: 'hidden' }
    const prisma = createMockPrisma({ listingDetail: hidden })
    const app = createTestApp(prisma)
    await unhideListing(app, LISTING_ID, 'valid-token')

    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'listing_unhide',
          targetType: 'listing',
          targetId: LISTING_ID,
        }),
      }),
    )
  })
})
