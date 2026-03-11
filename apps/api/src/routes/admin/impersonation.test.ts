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

// ─── Test helpers ────────────────────────────────────────────────────

function createMockVerifier(sub = 'cognito-admin', email = 'admin@surfaced.art', name = 'Admin User') {
  return { verify: vi.fn().mockResolvedValue({ sub, email, name }) }
}

const ADMIN_USER_ID = 'admin-uuid-123'
const TARGET_USER_ID = 'target-uuid-456'
const TARGET_ARTIST_ID = 'artist-uuid-789'
const LISTING_ID = 'listing-uuid-001'

const mockAdminUser = {
  id: ADMIN_USER_ID,
  cognitoId: 'cognito-admin',
  email: 'admin@surfaced.art',
  fullName: 'Admin User',
  roles: [{ role: 'admin', grantedAt: new Date('2025-01-01'), grantedBy: null }],
}

const mockTargetUser = {
  id: TARGET_USER_ID,
  cognitoId: 'cognito-target',
  email: 'artist@example.com',
  fullName: 'Target Artist',
  avatarUrl: 'https://example.com/avatar.jpg',
  roles: [
    { role: 'buyer', grantedAt: new Date('2025-01-01'), grantedBy: null },
    { role: 'artist', grantedAt: new Date('2025-01-15'), grantedBy: ADMIN_USER_ID },
  ],
  createdAt: new Date('2025-01-01'),
  lastActiveAt: new Date('2025-02-01'),
  artistProfile: {
    id: TARGET_ARTIST_ID,
    displayName: 'Target Artist',
    slug: 'target-artist',
    status: 'active',
  },
  _count: { ordersAsBuyer: 3, reviewsAsBuyer: 1, saves: 5, follows: 2 },
}

const mockArtistProfile = {
  id: TARGET_ARTIST_ID,
  userId: TARGET_USER_ID,
  displayName: 'Target Artist',
  slug: 'target-artist',
  bio: 'An artist bio',
  location: 'New York, NY',
  websiteUrl: 'https://artist.com',
  instagramUrl: 'https://instagram.com/artist',
  profileImageUrl: 'https://example.com/profile.jpg',
  coverImageUrl: 'https://example.com/cover.jpg',
  status: 'active',
  stripeAccountId: 'acct_123',
  categories: [{ category: 'drawing_painting' }],
  cvEntries: [{ id: 'cv-1' }],
}

const mockListing = {
  id: LISTING_ID,
  type: 'original',
  title: 'Test Painting',
  medium: 'Oil on canvas',
  category: 'drawing_painting',
  price: 15000,
  status: 'available',
  isDocumented: false,
  quantityTotal: 1,
  quantityRemaining: 1,
  createdAt: new Date('2025-02-01'),
  updatedAt: new Date('2025-02-01'),
  images: [
    {
      id: 'img-1',
      url: 'https://example.com/img.jpg',
      isProcessPhoto: false,
      sortOrder: 0,
      width: 800,
      height: 600,
      createdAt: new Date('2025-02-01'),
    },
  ],
}

function createMockPrisma(overrides?: {
  adminRoles?: string[]
  targetUser?: unknown
  artistProfile?: unknown
  listings?: unknown[]
  listingCount?: number
}) {
  const adminRoles = overrides?.adminRoles ?? ['admin']

  const userFindUnique = vi.fn().mockImplementation(({ where }: { where: { cognitoId?: string; id?: string } }) => {
    if (where.cognitoId === 'cognito-admin') {
      return Promise.resolve({ ...mockAdminUser, roles: adminRoles.map((r) => ({ role: r })) })
    }
    if (where.id === TARGET_USER_ID) {
      return Promise.resolve(overrides?.targetUser !== undefined ? overrides.targetUser : mockTargetUser)
    }
    if (where.id === ADMIN_USER_ID) {
      return Promise.resolve({ ...mockAdminUser, roles: adminRoles.map((r) => ({ role: r, grantedAt: new Date('2025-01-01'), grantedBy: null })) })
    }
    return Promise.resolve(null)
  })

  return {
    user: {
      findUnique: userFindUnique,
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
    userRole: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([]),
    },
    artistProfile: {
      findUnique: vi.fn().mockResolvedValue(overrides?.artistProfile !== undefined ? overrides.artistProfile : mockArtistProfile),
    },
    artistApplication: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
      update: vi.fn().mockResolvedValue({}),
    },
    listing: {
      findMany: vi.fn().mockResolvedValue(overrides?.listings ?? [mockListing]),
      count: vi.fn().mockResolvedValue(overrides?.listingCount ?? (overrides?.listings?.length ?? 1)),
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

function impersonateUser(app: ReturnType<typeof createTestApp>, userId: string, token?: string) {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request(`/admin/impersonate/${userId}`, { method: 'POST', headers })
}

function impersonateDashboard(app: ReturnType<typeof createTestApp>, userId: string, token?: string) {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request(`/admin/impersonate/${userId}/dashboard`, { headers })
}

function impersonateListings(app: ReturnType<typeof createTestApp>, userId: string, query = '', token?: string) {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request(`/admin/impersonate/${userId}/listings${query ? `?${query}` : ''}`, { headers })
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('POST /admin/impersonate/:userId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVerifier(createMockVerifier() as never)
  })
  afterEach(() => resetVerifier())

  it('should return 401 without auth token', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await impersonateUser(app, TARGET_USER_ID)
    expect(res.status).toBe(401)
  })

  it('should return 403 without admin role', async () => {
    const prisma = createMockPrisma({ adminRoles: ['buyer'] })
    const app = createTestApp(prisma)
    const res = await impersonateUser(app, TARGET_USER_ID, 'valid-token')
    expect(res.status).toBe(403)
  })

  it('should return 404 when user not found', async () => {
    const prisma = createMockPrisma({ targetUser: null })
    const app = createTestApp(prisma)
    const res = await impersonateUser(app, TARGET_USER_ID, 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should return user detail for non-artist user', async () => {
    const nonArtistUser = {
      ...mockTargetUser,
      artistProfile: null,
      roles: [{ role: 'buyer', grantedAt: new Date('2025-01-01'), grantedBy: null }],
    }
    const prisma = createMockPrisma({ targetUser: nonArtistUser, artistProfile: null })
    const app = createTestApp(prisma)
    const res = await impersonateUser(app, TARGET_USER_ID, 'valid-token')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.user.id).toBe(TARGET_USER_ID)
    expect(body.user.email).toBe('artist@example.com')
    expect(body.dashboard).toBeNull()
  })

  it('should return user detail + dashboard for artist user', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await impersonateUser(app, TARGET_USER_ID, 'valid-token')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.user.id).toBe(TARGET_USER_ID)
    expect(body.user.artistProfile).not.toBeNull()
    expect(body.dashboard).not.toBeNull()
    expect(body.dashboard.profile.id).toBe(TARGET_ARTIST_ID)
    expect(body.dashboard.completion).toBeDefined()
    expect(body.dashboard.stats).toBeDefined()
  })

  it('should write audit log with action user.impersonate', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    await impersonateUser(app, TARGET_USER_ID, 'valid-token')

    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          adminId: ADMIN_USER_ID,
          action: 'user.impersonate',
          targetType: 'user',
          targetId: TARGET_USER_ID,
        }),
      }),
    )
  })
})

describe('GET /admin/impersonate/:userId/dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVerifier(createMockVerifier() as never)
  })
  afterEach(() => resetVerifier())

  it('should return 401 without auth token', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await impersonateDashboard(app, TARGET_USER_ID)
    expect(res.status).toBe(401)
  })

  it('should return 404 when user not found', async () => {
    const prisma = createMockPrisma({ targetUser: null })
    const app = createTestApp(prisma)
    const res = await impersonateDashboard(app, TARGET_USER_ID, 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should return 404 when user is not an artist', async () => {
    const nonArtistUser = { ...mockTargetUser, artistProfile: null }
    const prisma = createMockPrisma({ targetUser: nonArtistUser, artistProfile: null })
    const app = createTestApp(prisma)
    const res = await impersonateDashboard(app, TARGET_USER_ID, 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should return dashboard data for artist user', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await impersonateDashboard(app, TARGET_USER_ID, 'valid-token')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.profile.id).toBe(TARGET_ARTIST_ID)
    expect(body.profile.displayName).toBe('Target Artist')
    expect(body.completion.percentage).toBeDefined()
    expect(body.completion.fields).toBeInstanceOf(Array)
    expect(body.stats.totalListings).toBeDefined()
  })

  it('should write audit log', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    await impersonateDashboard(app, TARGET_USER_ID, 'valid-token')

    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          adminId: ADMIN_USER_ID,
          action: 'user.impersonate',
          targetType: 'user',
          targetId: TARGET_USER_ID,
          details: expect.objectContaining({ endpoint: 'dashboard' }),
        }),
      }),
    )
  })
})

describe('GET /admin/impersonate/:userId/listings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVerifier(createMockVerifier() as never)
  })
  afterEach(() => resetVerifier())

  it('should return 401 without auth token', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await impersonateListings(app, TARGET_USER_ID)
    expect(res.status).toBe(401)
  })

  it('should return 404 when user not found', async () => {
    const prisma = createMockPrisma({ targetUser: null })
    const app = createTestApp(prisma)
    const res = await impersonateListings(app, TARGET_USER_ID, '', 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should return 404 when user is not an artist', async () => {
    const nonArtistUser = { ...mockTargetUser, artistProfile: null }
    const prisma = createMockPrisma({ targetUser: nonArtistUser, artistProfile: null })
    const app = createTestApp(prisma)
    const res = await impersonateListings(app, TARGET_USER_ID, '', 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should return paginated listings for artist user', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await impersonateListings(app, TARGET_USER_ID, '', 'valid-token')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].id).toBe(LISTING_ID)
    expect(body.data[0].title).toBe('Test Painting')
    expect(body.data[0].primaryImage).toBeDefined()
    expect(body.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 })
  })

  it('should support status and category query filters', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    await impersonateListings(app, TARGET_USER_ID, 'status=available&category=drawing_painting', 'valid-token')

    expect(prisma.listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          artistId: TARGET_ARTIST_ID,
          status: 'available',
          category: 'drawing_painting',
        }),
      }),
    )
  })

  it('should support pagination query params', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    await impersonateListings(app, TARGET_USER_ID, 'page=2&limit=5', 'valid-token')

    expect(prisma.listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 5,
        take: 5,
      }),
    )
  })

  it('should write audit log', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    await impersonateListings(app, TARGET_USER_ID, '', 'valid-token')

    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          adminId: ADMIN_USER_ID,
          action: 'user.impersonate',
          targetType: 'user',
          targetId: TARGET_USER_ID,
          details: expect.objectContaining({ endpoint: 'listings' }),
        }),
      }),
    )
  })
})
