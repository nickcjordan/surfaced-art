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
const ARTIST_PROFILE_ID = 'profile-uuid-456'

const mockAdminUser = {
  id: ADMIN_USER_ID,
  cognitoId: 'cognito-admin',
  email: 'admin@surfacedart.com',
  fullName: 'Admin User',
  roles: [{ role: 'admin' }],
}

const mockArtistProfile = {
  id: ARTIST_PROFILE_ID,
  userId: 'user-uuid-789',
  displayName: 'Jane Artist',
  slug: 'jane-artist',
  bio: 'Creates amazing ceramics',
  location: 'Portland, OR',
  websiteUrl: 'https://janeart.com',
  instagramUrl: 'https://instagram.com/janeart',
  originZip: '97201',
  status: 'approved',
  commissionsOpen: false,
  coverImageUrl: null,
  profileImageUrl: 'https://cdn.example.com/jane.jpg',
  applicationSource: null,
  isDemo: false,
  stripeAccountId: 'acct_123',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-02-01'),
  user: {
    email: 'jane@example.com',
    fullName: 'Jane Artist',
    roles: [{ role: 'buyer' }, { role: 'artist' }],
  },
  categories: [{ category: 'ceramics' }, { category: 'mixed_media' }],
  _count: { listings: 5, followers: 10 },
}

function createMockPrisma(overrides?: {
  adminRoles?: string[]
  artists?: unknown[]
  artistCount?: number
  artistDetail?: unknown
  updatedArtist?: unknown
}) {
  const adminRoles = overrides?.adminRoles ?? ['admin']
  const artists = overrides?.artists ?? [mockArtistProfile]
  const artistCount = overrides?.artistCount ?? artists.length

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
    artistProfile: {
      findMany: vi.fn().mockResolvedValue(artists),
      findUnique: vi.fn().mockImplementation(({ where }: { where: { id?: string; slug?: string } }) => {
        if (where.id === ARTIST_PROFILE_ID) {
          return Promise.resolve(overrides?.artistDetail !== undefined ? overrides.artistDetail : mockArtistProfile)
        }
        // For slug uniqueness check during updates
        if (where.slug) return Promise.resolve(null)
        return Promise.resolve(null)
      }),
      count: vi.fn().mockResolvedValue(artistCount),
      update: vi.fn().mockResolvedValue(
        overrides?.updatedArtist ?? { ...mockArtistProfile, displayName: 'Updated Name' },
      ),
    },
    listing: {
      count: vi.fn().mockResolvedValue(5),
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    follow: {
      count: vi.fn().mockResolvedValue(10),
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
        artistProfile: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({}),
          update: vi.fn().mockResolvedValue(overrides?.updatedArtist ?? { ...mockArtistProfile, displayName: 'Updated Name' }),
        },
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

function getArtists(app: ReturnType<typeof createTestApp>, query = '', token?: string) {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request(`/admin/artists${query ? `?${query}` : ''}`, { headers })
}

function getArtistDetail(app: ReturnType<typeof createTestApp>, id: string, token?: string) {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request(`/admin/artists/${id}`, { headers })
}

function updateArtist(app: ReturnType<typeof createTestApp>, id: string, body: Record<string, unknown>, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request(`/admin/artists/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  })
}

function suspendArtist(app: ReturnType<typeof createTestApp>, id: string, body: Record<string, unknown>, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request(`/admin/artists/${id}/suspend`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

function unsuspendArtist(app: ReturnType<typeof createTestApp>, id: string, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request(`/admin/artists/${id}/unsuspend`, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  })
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('GET /admin/artists', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVerifier(createMockVerifier() as never)
  })
  afterEach(() => resetVerifier())

  it('should return 401 without auth token', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await getArtists(app)
    expect(res.status).toBe(401)
  })

  it('should return paginated artist list', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await getArtists(app, '', 'valid-token')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].displayName).toBe('Jane Artist')
    expect(body.data[0].slug).toBe('jane-artist')
    expect(body.data[0].isDemo).toBe(false)
    expect(body.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 })
  })

  it('should include listing count', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await getArtists(app, '', 'valid-token')
    const body = await res.json()
    expect(body.data[0].listingCount).toBe(5)
  })

  it('should filter by status', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    await getArtists(app, 'status=suspended', 'valid-token')

    expect(prisma.artistProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'suspended' }),
      }),
    )
  })

  it('should filter by search on displayName', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    await getArtists(app, 'search=jane', 'valid-token')

    expect(prisma.artistProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { displayName: { contains: 'jane', mode: 'insensitive' } },
          ]),
        }),
      }),
    )
  })
})

describe('GET /admin/artists/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVerifier(createMockVerifier() as never)
  })
  afterEach(() => resetVerifier())

  it('should return 404 when artist not found', async () => {
    const prisma = createMockPrisma({ artistDetail: null })
    const app = createTestApp(prisma)
    const res = await getArtistDetail(app, ARTIST_PROFILE_ID, 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should return full artist detail with admin-only fields', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await getArtistDetail(app, ARTIST_PROFILE_ID, 'valid-token')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.id).toBe(ARTIST_PROFILE_ID)
    expect(body.originZip).toBe('97201')
    expect(body.hasStripeAccount).toBe(true)
    expect(body.isDemo).toBe(false)
    expect(body.user.email).toBe('jane@example.com')
    expect(body.categories).toEqual(['ceramics', 'mixed_media'])
    expect(body.stats).toEqual({
      totalListings: 5,
      availableListings: 5,
      soldListings: 5,
      followerCount: 10,
    })
  })
})

describe('PUT /admin/artists/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVerifier(createMockVerifier() as never)
  })
  afterEach(() => resetVerifier())

  it('should return 404 when artist not found', async () => {
    const prisma = createMockPrisma({ artistDetail: null })
    const app = createTestApp(prisma)
    const res = await updateArtist(app, ARTIST_PROFILE_ID, { displayName: 'New Name' }, 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should update artist profile', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await updateArtist(app, ARTIST_PROFILE_ID, { displayName: 'Updated Name' }, 'valid-token')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.message).toContain('updated')
  })

  it('should write audit log on update', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    await updateArtist(app, ARTIST_PROFILE_ID, { displayName: 'Updated Name' }, 'valid-token')

    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          adminId: ADMIN_USER_ID,
          action: 'artist_update',
          targetType: 'artist',
          targetId: ARTIST_PROFILE_ID,
        }),
      }),
    )
  })

  it('should trigger ISR revalidation', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    await updateArtist(app, ARTIST_PROFILE_ID, { displayName: 'Updated Name' }, 'valid-token')

    expect(triggerRevalidation).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'listing',
        artistSlug: 'jane-artist',
      }),
    )
  })

  it('should return validation error for invalid body', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await updateArtist(app, ARTIST_PROFILE_ID, { displayName: '' }, 'valid-token')
    expect(res.status).toBe(400)
  })
})

describe('POST /admin/artists/:id/suspend', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVerifier(createMockVerifier() as never)
  })
  afterEach(() => resetVerifier())

  it('should return 404 when artist not found', async () => {
    const prisma = createMockPrisma({ artistDetail: null })
    const app = createTestApp(prisma)
    const res = await suspendArtist(app, ARTIST_PROFILE_ID, { reason: 'Policy violation' }, 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should suspend the artist', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await suspendArtist(app, ARTIST_PROFILE_ID, { reason: 'Policy violation' }, 'valid-token')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.message).toContain('suspended')
  })

  it('should require a reason', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await suspendArtist(app, ARTIST_PROFILE_ID, {}, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should write audit log on suspend', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    await suspendArtist(app, ARTIST_PROFILE_ID, { reason: 'Policy violation' }, 'valid-token')

    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'artist_suspend',
          targetType: 'artist',
          targetId: ARTIST_PROFILE_ID,
        }),
      }),
    )
  })
})

describe('POST /admin/artists/:id/unsuspend', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVerifier(createMockVerifier() as never)
  })
  afterEach(() => resetVerifier())

  it('should return 404 when artist not found', async () => {
    const prisma = createMockPrisma({ artistDetail: null })
    const app = createTestApp(prisma)
    const res = await unsuspendArtist(app, ARTIST_PROFILE_ID, 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should unsuspend the artist', async () => {
    const suspended = { ...mockArtistProfile, status: 'suspended' }
    const prisma = createMockPrisma({ artistDetail: suspended })
    const app = createTestApp(prisma)
    const res = await unsuspendArtist(app, ARTIST_PROFILE_ID, 'valid-token')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.message).toContain('unsuspended')
  })

  it('should write audit log on unsuspend', async () => {
    const suspended = { ...mockArtistProfile, status: 'suspended' }
    const prisma = createMockPrisma({ artistDetail: suspended })
    const app = createTestApp(prisma)
    await unsuspendArtist(app, ARTIST_PROFILE_ID, 'valid-token')

    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'artist_unsuspend',
          targetType: 'artist',
          targetId: ARTIST_PROFILE_ID,
        }),
      }),
    )
  })
})
