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
  updatedProfile?: unknown
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
      update: vi.fn().mockResolvedValue(overrides?.updatedProfile ?? artistProfile),
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

function putProfile(
  app: ReturnType<typeof createTestApp>,
  body: Record<string, unknown>,
  token?: string,
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request('/me/profile', {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  })
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

// ─── PUT /me/profile ────────────────────────────────────────────────

describe('PUT /me/profile', () => {
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

      const res = await putProfile(app, { bio: 'Updated bio' })
      expect(res.status).toBe(401)
    })

    it('should return 403 for buyer-only role', async () => {
      const prisma = createMockPrisma({ roles: ['buyer'] })
      const app = createTestApp(prisma)

      const res = await putProfile(app, { bio: 'Updated bio' }, 'valid-token')
      expect(res.status).toBe(403)
    })
  })

  describe('profile not found', () => {
    it('should return 404 when artist profile does not exist', async () => {
      const prisma = createMockPrisma({ artistProfile: null })
      const app = createTestApp(prisma)

      const res = await putProfile(app, { bio: 'Updated bio' }, 'valid-token')
      expect(res.status).toBe(404)

      const body = await res.json()
      expect(body.error.code).toBe('NOT_FOUND')
    })
  })

  describe('validation', () => {
    it('should return 400 for bio exceeding 5000 characters', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await putProfile(app, { bio: 'x'.repeat(5001) }, 'valid-token')
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for location exceeding 200 characters', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await putProfile(app, { location: 'x'.repeat(201) }, 'valid-token')
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for invalid websiteUrl', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await putProfile(app, { websiteUrl: 'not-a-url' }, 'valid-token')
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for invalid instagramUrl', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await putProfile(app, { instagramUrl: 'not-a-url' }, 'valid-token')
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for image URL not from CloudFront domain', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await putProfile(app, { profileImageUrl: 'https://evil.com/image.jpg' }, 'valid-token')
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.error.code).toBe('BAD_REQUEST')
      expect(body.error.message).toContain('CDN')
    })

    it('should return 400 for cover image URL not from CloudFront domain', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await putProfile(app, { coverImageUrl: 'https://evil.com/cover.jpg' }, 'valid-token')
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.error.code).toBe('BAD_REQUEST')
    })
  })

  describe('partial update behavior', () => {
    it('should update only bio when only bio is provided', async () => {
      const updatedProfile = { ...mockArtistProfile, bio: 'New bio text' }
      const prisma = createMockPrisma({ updatedProfile })
      const app = createTestApp(prisma)

      const res = await putProfile(app, { bio: 'New bio text' }, 'valid-token')
      expect(res.status).toBe(200)

      const updateCall = (prisma.artistProfile.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(updateCall.data).toEqual({ bio: 'New bio text' })
    })

    it('should update only location when only location is provided', async () => {
      const updatedProfile = { ...mockArtistProfile, location: 'Brooklyn, NY' }
      const prisma = createMockPrisma({ updatedProfile })
      const app = createTestApp(prisma)

      const res = await putProfile(app, { location: 'Brooklyn, NY' }, 'valid-token')
      expect(res.status).toBe(200)

      const updateCall = (prisma.artistProfile.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(updateCall.data).toEqual({ location: 'Brooklyn, NY' })
    })

    it('should update multiple fields when multiple fields are provided', async () => {
      const updatedProfile = { ...mockArtistProfile, bio: 'New bio', location: 'NYC' }
      const prisma = createMockPrisma({ updatedProfile })
      const app = createTestApp(prisma)

      const res = await putProfile(app, { bio: 'New bio', location: 'NYC' }, 'valid-token')
      expect(res.status).toBe(200)

      const updateCall = (prisma.artistProfile.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(updateCall.data).toHaveProperty('bio', 'New bio')
      expect(updateCall.data).toHaveProperty('location', 'NYC')
    })

    it('should clear websiteUrl when empty string is sent', async () => {
      const updatedProfile = { ...mockArtistProfile, websiteUrl: null }
      const prisma = createMockPrisma({ updatedProfile })
      const app = createTestApp(prisma)

      const res = await putProfile(app, { websiteUrl: '' }, 'valid-token')
      expect(res.status).toBe(200)

      const updateCall = (prisma.artistProfile.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(updateCall.data.websiteUrl).toBeNull()
    })

    it('should clear profileImageUrl when null is sent', async () => {
      const updatedProfile = { ...mockArtistProfile, profileImageUrl: null }
      const prisma = createMockPrisma({ updatedProfile })
      const app = createTestApp(prisma)

      const res = await putProfile(app, { profileImageUrl: null }, 'valid-token')
      expect(res.status).toBe(200)

      const updateCall = (prisma.artistProfile.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(updateCall.data.profileImageUrl).toBeNull()
    })

    it('should allow empty body (no-op update)', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await putProfile(app, {}, 'valid-token')
      expect(res.status).toBe(200)
    })

    it('should accept valid CloudFront image URL', async () => {
      const cfUrl = 'https://d2agn4aoo0e7ji.cloudfront.net/uploads/profile/user-123/abc.jpg'
      const updatedProfile = { ...mockArtistProfile, profileImageUrl: cfUrl }
      const prisma = createMockPrisma({ updatedProfile })
      const app = createTestApp(prisma)

      const res = await putProfile(app, { profileImageUrl: cfUrl }, 'valid-token')
      expect(res.status).toBe(200)
    })
  })

  describe('sanitization', () => {
    it('should sanitize bio text (strip HTML)', async () => {
      const prisma = createMockPrisma({ updatedProfile: { ...mockArtistProfile, bio: 'Clean bio' } })
      const app = createTestApp(prisma)

      await putProfile(app, { bio: '<script>alert("xss")</script>Clean bio' }, 'valid-token')

      const updateCall = (prisma.artistProfile.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(updateCall.data.bio).not.toContain('<script>')
      expect(updateCall.data.bio).toContain('Clean bio')
    })

    it('should sanitize location text (strip HTML)', async () => {
      const prisma = createMockPrisma({ updatedProfile: { ...mockArtistProfile, location: 'Portland, OR' } })
      const app = createTestApp(prisma)

      await putProfile(app, { location: '<b>Portland</b>, OR' }, 'valid-token')

      const updateCall = (prisma.artistProfile.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(updateCall.data.location).not.toContain('<b>')
    })
  })

  describe('response shape', () => {
    it('should return correct profile fields in response', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await putProfile(app, { bio: 'Updated' }, 'valid-token')
      const body = await res.json()

      expect(body).toHaveProperty('id')
      expect(body).toHaveProperty('displayName')
      expect(body).toHaveProperty('slug')
      expect(body).toHaveProperty('bio')
      expect(body).toHaveProperty('location')
      expect(body).toHaveProperty('websiteUrl')
      expect(body).toHaveProperty('instagramUrl')
      expect(body).toHaveProperty('profileImageUrl')
      expect(body).toHaveProperty('coverImageUrl')
      expect(body).toHaveProperty('status')
    })

    it('should not leak sensitive fields', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await putProfile(app, { bio: 'Updated' }, 'valid-token')
      const body = await res.json()

      expect(body).not.toHaveProperty('userId')
      expect(body).not.toHaveProperty('originZip')
      expect(body).not.toHaveProperty('applicationSource')
      expect(body).not.toHaveProperty('stripeAccountId')
    })
  })
})
