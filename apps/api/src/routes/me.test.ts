import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Hono } from 'hono'
import { createMeRoutes } from './me'
import { setVerifier, resetVerifier } from '../middleware/auth'
import type { PrismaClient } from '@surfaced-art/db'

// ─── Test helpers ────────────────────────────────────────────────────

function createMockVerifier(sub = 'cognito-123', email = 'artist@example.com', name = 'Test Artist') {
  return {
    verify: vi.fn().mockResolvedValue({ sub, email, name }),
  } as unknown as ReturnType<typeof setVerifier extends (v: infer T) => void ? () => T : never>
}

const mockArtistProfile = {
  id: 'artist-uuid-123',
  userId: 'user-uuid-123',
  displayName: 'Test Artist',
  slug: 'test-artist',
  bio: 'A passionate artist making beautiful work.',
  location: 'Portland, OR',
  websiteUrl: 'https://testartist.com',
  instagramUrl: null,
  stripeAccountId: null,
  originZip: '97201',
  status: 'approved',
  commissionsOpen: false,
  coverImageUrl: 'https://cdn.example.com/cover.jpg',
  profileImageUrl: 'https://cdn.example.com/profile.jpg',
  applicationSource: 'direct',
  createdAt: new Date(),
  updatedAt: new Date(),
  categories: [{ id: 'cat-1', artistId: 'artist-uuid-123', category: 'ceramics' }],
  cvEntries: [{ id: 'cv-1', artistId: 'artist-uuid-123', type: 'exhibition', title: 'Solo Show', year: 2025 }],
}

function createMockPrisma(overrides?: {
  roles?: string[]
  artistProfile?: unknown
  listingCounts?: [number, number, number]
}) {
  const roles = overrides?.roles ?? ['artist']
  const artistProfile = overrides?.artistProfile !== undefined ? overrides.artistProfile : mockArtistProfile
  const [total, available, sold] = overrides?.listingCounts ?? [5, 3, 2]

  return {
    user: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'user-uuid-123',
        cognitoId: 'cognito-123',
        email: 'artist@example.com',
        fullName: 'Test Artist',
        roles: roles.map((r) => ({ role: r })),
      }),
    },
    artistProfile: {
      findUnique: vi.fn().mockResolvedValue(artistProfile),
    },
    listing: {
      count: vi.fn()
        .mockResolvedValueOnce(total)
        .mockResolvedValueOnce(available)
        .mockResolvedValueOnce(sold),
    },
  } as unknown as PrismaClient
}

function createTestApp(prisma: PrismaClient) {
  const app = new Hono()
  app.route('/me', createMeRoutes(prisma))
  return app
}

function getDashboard(
  app: ReturnType<typeof createTestApp>,
  token?: string,
) {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request('/me/dashboard', { method: 'GET', headers })
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('GET /me/dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVerifier(createMockVerifier() as never)
  })

  afterEach(() => {
    resetVerifier()
  })

  describe('authentication and authorization', () => {
    it('should return 401 without auth token', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await getDashboard(app)
      expect(res.status).toBe(401)

      const body = await res.json()
      expect(body.error.code).toBe('UNAUTHORIZED')
    })

    it('should return 403 for buyer-only role', async () => {
      const prisma = createMockPrisma({ roles: ['buyer'] })
      const app = createTestApp(prisma)

      const res = await getDashboard(app, 'valid-token')
      expect(res.status).toBe(403)

      const body = await res.json()
      expect(body.error.code).toBe('FORBIDDEN')
    })

    it('should allow artist role', async () => {
      const prisma = createMockPrisma({ roles: ['artist'] })
      const app = createTestApp(prisma)

      const res = await getDashboard(app, 'valid-token')
      expect(res.status).toBe(200)
    })

    it('should allow user with both artist and buyer roles', async () => {
      const prisma = createMockPrisma({ roles: ['buyer', 'artist'] })
      const app = createTestApp(prisma)

      const res = await getDashboard(app, 'valid-token')
      expect(res.status).toBe(200)
    })
  })

  describe('missing artist profile', () => {
    it('should return 404 when artist profile does not exist', async () => {
      const prisma = createMockPrisma({ artistProfile: null })
      const app = createTestApp(prisma)

      const res = await getDashboard(app, 'valid-token')
      expect(res.status).toBe(404)

      const body = await res.json()
      expect(body.error.code).toBe('NOT_FOUND')
    })
  })

  describe('profile data', () => {
    it('should return correct profile fields', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await getDashboard(app, 'valid-token')
      const body = await res.json()

      expect(body.profile).toEqual({
        id: 'artist-uuid-123',
        displayName: 'Test Artist',
        slug: 'test-artist',
        bio: 'A passionate artist making beautiful work.',
        location: 'Portland, OR',
        profileImageUrl: 'https://cdn.example.com/profile.jpg',
        coverImageUrl: 'https://cdn.example.com/cover.jpg',
        status: 'approved',
        stripeAccountId: null,
      })
    })

    it('should not leak sensitive fields (userId, originZip, applicationSource)', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await getDashboard(app, 'valid-token')
      const body = await res.json()

      expect(body.profile).not.toHaveProperty('userId')
      expect(body.profile).not.toHaveProperty('originZip')
      expect(body.profile).not.toHaveProperty('applicationSource')
    })
  })

  describe('profile completion', () => {
    it('should return 100% when all fields are filled', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await getDashboard(app, 'valid-token')
      const body = await res.json()

      expect(body.completion.percentage).toBe(100)
      expect(body.completion.fields).toHaveLength(6)
      expect(body.completion.fields.every((f: { complete: boolean }) => f.complete)).toBe(true)
    })

    it('should return correct partial percentage', async () => {
      const partialProfile = {
        ...mockArtistProfile,
        coverImageUrl: null,
        profileImageUrl: null,
        cvEntries: [],
      }
      const prisma = createMockPrisma({ artistProfile: partialProfile })
      const app = createTestApp(prisma)

      const res = await getDashboard(app, 'valid-token')
      const body = await res.json()

      // 3 of 6 fields complete: bio, location, categories
      expect(body.completion.percentage).toBe(50)
    })

    it('should return correct field labels and statuses', async () => {
      const partialProfile = {
        ...mockArtistProfile,
        coverImageUrl: null,
        cvEntries: [],
      }
      const prisma = createMockPrisma({ artistProfile: partialProfile })
      const app = createTestApp(prisma)

      const res = await getDashboard(app, 'valid-token')
      const body = await res.json()

      const fieldMap = Object.fromEntries(
        body.completion.fields.map((f: { label: string; complete: boolean }) => [f.label, f.complete])
      )

      expect(fieldMap['Bio']).toBe(true)
      expect(fieldMap['Location']).toBe(true)
      expect(fieldMap['Profile image']).toBe(true)
      expect(fieldMap['Cover image']).toBe(false)
      expect(fieldMap['At least 1 category']).toBe(true)
      expect(fieldMap['At least 1 CV entry']).toBe(false)
    })

    it('should treat empty bio as incomplete', async () => {
      const emptyBioProfile = {
        ...mockArtistProfile,
        bio: '',
      }
      const prisma = createMockPrisma({ artistProfile: emptyBioProfile })
      const app = createTestApp(prisma)

      const res = await getDashboard(app, 'valid-token')
      const body = await res.json()

      const bioField = body.completion.fields.find((f: { label: string }) => f.label === 'Bio')
      expect(bioField.complete).toBe(false)
    })

    it('should treat whitespace-only bio as incomplete', async () => {
      const whitespaceBioProfile = {
        ...mockArtistProfile,
        bio: '   ',
      }
      const prisma = createMockPrisma({ artistProfile: whitespaceBioProfile })
      const app = createTestApp(prisma)

      const res = await getDashboard(app, 'valid-token')
      const body = await res.json()

      const bioField = body.completion.fields.find((f: { label: string }) => f.label === 'Bio')
      expect(bioField.complete).toBe(false)
    })
  })

  describe('listing stats', () => {
    it('should return correct listing counts', async () => {
      const prisma = createMockPrisma({ listingCounts: [10, 7, 3] })
      const app = createTestApp(prisma)

      const res = await getDashboard(app, 'valid-token')
      const body = await res.json()

      expect(body.stats.totalListings).toBe(10)
      expect(body.stats.availableListings).toBe(7)
      expect(body.stats.soldListings).toBe(3)
    })

    it('should return zero counts when artist has no listings', async () => {
      const prisma = createMockPrisma({ listingCounts: [0, 0, 0] })
      const app = createTestApp(prisma)

      const res = await getDashboard(app, 'valid-token')
      const body = await res.json()

      expect(body.stats.totalListings).toBe(0)
      expect(body.stats.availableListings).toBe(0)
      expect(body.stats.soldListings).toBe(0)
    })

    it('should return totalViews as 0 (placeholder)', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await getDashboard(app, 'valid-token')
      const body = await res.json()

      expect(body.stats.totalViews).toBe(0)
    })
  })
})
