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
  categoryResults?: unknown[]
  cvEntries?: unknown[]
  createdCvEntry?: unknown
  updatedCvEntry?: unknown
  processMedia?: unknown[]
  createdProcessMedia?: unknown
  // Listing management overrides
  listings?: unknown[]
  createdListing?: unknown
  updatedListing?: unknown
  listingImages?: unknown[]
  orderCount?: number
}) {
  const roles = overrides?.roles ?? ['artist']
  const artistProfile = overrides?.artistProfile !== undefined ? overrides.artistProfile : mockArtistProfile
  const [total, available, sold] = overrides?.listingCounts ?? [5, 3, 2]

  const mock = {
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
    artistCategory: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      createMany: vi.fn().mockResolvedValue({ count: overrides?.categoryResults?.length ?? 0 }),
      findMany: vi.fn().mockResolvedValue(overrides?.categoryResults ?? []),
    },
    artistCvEntry: {
      findMany: vi.fn().mockResolvedValue(overrides?.cvEntries ?? []),
      findUnique: vi.fn().mockResolvedValue(overrides?.cvEntries?.[0] ?? null),
      create: vi.fn().mockResolvedValue(overrides?.createdCvEntry ?? null),
      update: vi.fn().mockResolvedValue(overrides?.updatedCvEntry ?? null),
      delete: vi.fn().mockResolvedValue({ id: 'deleted' }),
      count: vi.fn().mockResolvedValue(overrides?.cvEntries?.length ?? 0),
    },
    artistProcessMedia: {
      findMany: vi.fn().mockResolvedValue(overrides?.processMedia ?? []),
      findUnique: vi.fn().mockResolvedValue(overrides?.processMedia?.[0] ?? null),
      create: vi.fn().mockResolvedValue(overrides?.createdProcessMedia ?? null),
      update: vi.fn().mockResolvedValue(null),
      delete: vi.fn().mockResolvedValue({ id: 'deleted' }),
      count: vi.fn().mockResolvedValue(overrides?.processMedia?.length ?? 0),
    },
    listing: {
      count: vi.fn()
        .mockResolvedValueOnce(total)
        .mockResolvedValueOnce(available)
        .mockResolvedValueOnce(sold),
      findMany: vi.fn().mockResolvedValue(overrides?.listings ?? []),
      findUnique: vi.fn().mockResolvedValue(overrides?.listings?.[0] ?? null),
      create: vi.fn().mockResolvedValue(overrides?.createdListing ?? null),
      update: vi.fn().mockResolvedValue(overrides?.updatedListing ?? null),
      delete: vi.fn().mockResolvedValue({ id: 'deleted' }),
    },
    listingImage: {
      findMany: vi.fn().mockResolvedValue(overrides?.listingImages ?? []),
    },
    order: {
      count: vi.fn().mockResolvedValue(overrides?.orderCount ?? 0),
    },
    $transaction: vi.fn(),
  } as unknown as PrismaClient

  // $transaction supports both callback mode (categories) and batch mode (reorder)
  ;(mock.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
    async (fnOrArray: ((tx: unknown) => Promise<unknown>) | unknown[]) => {
      if (typeof fnOrArray === 'function') {
        return fnOrArray(mock)
      }
      // Batch mode: resolve all promises in the array
      return Promise.all(fnOrArray)
    }
  )

  return mock
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

function putCategories(
  app: ReturnType<typeof createTestApp>,
  body: Record<string, unknown>,
  token?: string,
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request('/me/categories', {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  })
}

function getCvEntries(
  app: ReturnType<typeof createTestApp>,
  token?: string,
) {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request('/me/cv-entries', { method: 'GET', headers })
}

function postCvEntry(
  app: ReturnType<typeof createTestApp>,
  body: Record<string, unknown>,
  token?: string,
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request('/me/cv-entries', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

function putCvEntry(
  app: ReturnType<typeof createTestApp>,
  id: string,
  body: Record<string, unknown>,
  token?: string,
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request(`/me/cv-entries/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  })
}

function deleteCvEntry(
  app: ReturnType<typeof createTestApp>,
  id: string,
  token?: string,
) {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request(`/me/cv-entries/${id}`, {
    method: 'DELETE',
    headers,
  })
}

function putCvEntryReorder(
  app: ReturnType<typeof createTestApp>,
  body: Record<string, unknown>,
  token?: string,
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request('/me/cv-entries/reorder', {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  })
}

function getProcessMedia(
  app: ReturnType<typeof createTestApp>,
  token?: string,
) {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request('/me/process-media', { method: 'GET', headers })
}

function postProcessMediaPhoto(
  app: ReturnType<typeof createTestApp>,
  body: Record<string, unknown>,
  token?: string,
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request('/me/process-media/photo', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

function postProcessMediaVideo(
  app: ReturnType<typeof createTestApp>,
  body: Record<string, unknown>,
  token?: string,
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request('/me/process-media/video', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

function deleteProcessMedia(
  app: ReturnType<typeof createTestApp>,
  id: string,
  token?: string,
) {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request(`/me/process-media/${id}`, {
    method: 'DELETE',
    headers,
  })
}

function putProcessMediaReorder(
  app: ReturnType<typeof createTestApp>,
  body: Record<string, unknown>,
  token?: string,
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request('/me/process-media/reorder', {
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
        websiteUrl: 'https://testartist.com',
        instagramUrl: null,
        profileImageUrl: 'https://cdn.example.com/profile.jpg',
        coverImageUrl: 'https://cdn.example.com/cover.jpg',
        status: 'approved',
        stripeAccountId: null,
        categories: ['ceramics'],
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
    process.env.CLOUDFRONT_DOMAIN = 'd2agn4aoo0e7ji.cloudfront.net'
  })

  afterEach(() => {
    resetVerifier()
    delete process.env.CLOUDFRONT_DOMAIN
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

    it('should reject URL with cloudfront.net as substring but different hostname', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await putProfile(
        app,
        { profileImageUrl: 'https://evil.cloudfront.net.attacker.com/image.jpg' },
        'valid-token'
      )
      expect(res.status).toBe(400)
    })

    it('should reject URL with cloudfront.net in path but different hostname', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await putProfile(
        app,
        { profileImageUrl: 'https://evil.com/.cloudfront.net/image.jpg' },
        'valid-token'
      )
      expect(res.status).toBe(400)
    })

    it('should reject URL where cloudfront.net appears only in the path', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await putProfile(
        app,
        { profileImageUrl: 'https://attacker.com/d2agn4aoo0e7ji.cloudfront.net/image.jpg' },
        'valid-token'
      )
      expect(res.status).toBe(400)
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

// ─── PUT /me/categories ─────────────────────────────────────────────

describe('PUT /me/categories', () => {
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

      const res = await putCategories(app, { categories: ['ceramics'] })
      expect(res.status).toBe(401)
    })

    it('should return 403 for buyer-only role', async () => {
      const prisma = createMockPrisma({ roles: ['buyer'] })
      const app = createTestApp(prisma)

      const res = await putCategories(app, { categories: ['ceramics'] }, 'valid-token')
      expect(res.status).toBe(403)
    })
  })

  describe('profile not found', () => {
    it('should return 404 when artist profile does not exist', async () => {
      const prisma = createMockPrisma({ artistProfile: null })
      const app = createTestApp(prisma)

      const res = await putCategories(app, { categories: ['ceramics'] }, 'valid-token')
      expect(res.status).toBe(404)

      const body = await res.json()
      expect(body.error.code).toBe('NOT_FOUND')
    })
  })

  describe('validation', () => {
    it('should return 400 for empty categories array', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await putCategories(app, { categories: [] }, 'valid-token')
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for invalid category value', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await putCategories(app, { categories: ['not_a_category'] }, 'valid-token')
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 when categories field is missing', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await putCategories(app, {}, 'valid-token')
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for invalid JSON payload', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      }
      const res = await app.request('/me/categories', {
        method: 'PUT',
        headers,
        body: 'not json',
      })
      expect(res.status).toBe(400)
    })
  })

  describe('replace-all behavior', () => {
    it('should call deleteMany and createMany in a transaction', async () => {
      const categoryResults = [
        { id: 'cat-new-1', artistId: 'artist-uuid-123', category: 'painting' },
        { id: 'cat-new-2', artistId: 'artist-uuid-123', category: 'ceramics' },
      ]
      const prisma = createMockPrisma({ categoryResults })
      const app = createTestApp(prisma)

      const res = await putCategories(app, { categories: ['painting', 'ceramics'] }, 'valid-token')
      expect(res.status).toBe(200)

      // Transaction was used
      expect(prisma.$transaction).toHaveBeenCalled()

      // deleteMany was called with the artist's ID
      expect(
        (prisma.artistCategory.deleteMany as ReturnType<typeof vi.fn>).mock.calls[0][0]
      ).toEqual({ where: { artistId: 'artist-uuid-123' } })

      // createMany was called with the new categories
      const createCall = (prisma.artistCategory.createMany as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(createCall.data).toHaveLength(2)
      expect(createCall.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ artistId: 'artist-uuid-123', category: 'painting' }),
          expect.objectContaining({ artistId: 'artist-uuid-123', category: 'ceramics' }),
        ])
      )
    })

    it('should accept a single category', async () => {
      const categoryResults = [
        { id: 'cat-new-1', artistId: 'artist-uuid-123', category: 'jewelry' },
      ]
      const prisma = createMockPrisma({ categoryResults })
      const app = createTestApp(prisma)

      const res = await putCategories(app, { categories: ['jewelry'] }, 'valid-token')
      expect(res.status).toBe(200)
    })

    it('should accept all 9 categories', async () => {
      const allCategories = [
        'ceramics', 'painting', 'print', 'jewelry', 'illustration',
        'photography', 'woodworking', 'fibers', 'mixed_media',
      ]
      const categoryResults = allCategories.map((c) => ({
        id: `cat-${c}`,
        artistId: 'artist-uuid-123',
        category: c,
      }))
      const prisma = createMockPrisma({ categoryResults })
      const app = createTestApp(prisma)

      const res = await putCategories(app, { categories: allCategories }, 'valid-token')
      expect(res.status).toBe(200)
    })

    it('should deduplicate repeated categories', async () => {
      const categoryResults = [
        { id: 'cat-1', artistId: 'artist-uuid-123', category: 'ceramics' },
      ]
      const prisma = createMockPrisma({ categoryResults })
      const app = createTestApp(prisma)

      const res = await putCategories(app, { categories: ['ceramics', 'ceramics'] }, 'valid-token')
      expect(res.status).toBe(200)

      const createCall = (prisma.artistCategory.createMany as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(createCall.data).toHaveLength(1)
    })
  })

  describe('response shape', () => {
    it('should return categories array', async () => {
      const categoryResults = [
        { id: 'cat-1', artistId: 'artist-uuid-123', category: 'painting' },
        { id: 'cat-2', artistId: 'artist-uuid-123', category: 'ceramics' },
      ]
      const prisma = createMockPrisma({ categoryResults })
      const app = createTestApp(prisma)

      const res = await putCategories(app, { categories: ['painting', 'ceramics'] }, 'valid-token')
      const body = await res.json()

      expect(body).toHaveProperty('categories')
      expect(body.categories).toEqual(['painting', 'ceramics'])
    })
  })
})

// ─── CV Entry CRUD ──────────────────────────────────────────────────

const CV_ENTRY_ID_1 = '11111111-1111-4111-8111-111111111111'
const CV_ENTRY_ID_2 = '22222222-2222-4222-8222-222222222222'

const mockCvEntry = {
  id: CV_ENTRY_ID_1,
  artistId: 'artist-uuid-123',
  type: 'exhibition',
  title: 'Solo Show',
  institution: 'Portland Art Museum',
  year: 2025,
  description: 'My first solo show.',
  sortOrder: 0,
}

const mockCvEntry2 = {
  id: CV_ENTRY_ID_2,
  artistId: 'artist-uuid-123',
  type: 'award',
  title: 'Best in Show',
  institution: null,
  year: 2024,
  description: null,
  sortOrder: 1,
}

describe('GET /me/cv-entries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVerifier(createMockVerifier() as never)
  })

  afterEach(() => {
    resetVerifier()
  })

  it('should return 401 without auth token', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await getCvEntries(app)
    expect(res.status).toBe(401)
  })

  it('should return 403 for buyer-only role', async () => {
    const prisma = createMockPrisma({ roles: ['buyer'] })
    const app = createTestApp(prisma)

    const res = await getCvEntries(app, 'valid-token')
    expect(res.status).toBe(403)
  })

  it('should return 404 when artist profile does not exist', async () => {
    const prisma = createMockPrisma({ artistProfile: null })
    const app = createTestApp(prisma)

    const res = await getCvEntries(app, 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should return empty array when no entries exist', async () => {
    const prisma = createMockPrisma({ cvEntries: [] })
    const app = createTestApp(prisma)

    const res = await getCvEntries(app, 'valid-token')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.cvEntries).toEqual([])
  })

  it('should return CV entries ordered by sortOrder', async () => {
    const prisma = createMockPrisma({ cvEntries: [mockCvEntry, mockCvEntry2] })
    const app = createTestApp(prisma)

    const res = await getCvEntries(app, 'valid-token')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.cvEntries).toHaveLength(2)
    expect(body.cvEntries[0].title).toBe('Solo Show')
    expect(body.cvEntries[1].title).toBe('Best in Show')
  })

  it('should not include artistId in response entries', async () => {
    const prisma = createMockPrisma({ cvEntries: [mockCvEntry] })
    const app = createTestApp(prisma)

    const res = await getCvEntries(app, 'valid-token')
    const body = await res.json()

    expect(body.cvEntries[0]).not.toHaveProperty('artistId')
  })

  it('should query with correct artistId and sort order', async () => {
    const prisma = createMockPrisma({ cvEntries: [] })
    const app = createTestApp(prisma)

    await getCvEntries(app, 'valid-token')

    const findManyCall = (prisma.artistCvEntry.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(findManyCall.where).toEqual({ artistId: 'artist-uuid-123' })
    expect(findManyCall.orderBy).toEqual({ sortOrder: 'asc' })
  })
})

describe('POST /me/cv-entries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVerifier(createMockVerifier() as never)
  })

  afterEach(() => {
    resetVerifier()
  })

  it('should return 401 without auth token', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await postCvEntry(app, { type: 'exhibition', title: 'Show', year: 2025 })
    expect(res.status).toBe(401)
  })

  it('should return 404 when artist profile does not exist', async () => {
    const prisma = createMockPrisma({ artistProfile: null })
    const app = createTestApp(prisma)

    const res = await postCvEntry(app, { type: 'exhibition', title: 'Show', year: 2025 }, 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should return 400 for missing title', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await postCvEntry(app, { type: 'exhibition', year: 2025 }, 'valid-token')
    expect(res.status).toBe(400)

    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('should return 400 for title exceeding 200 characters', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await postCvEntry(app, { type: 'exhibition', title: 'x'.repeat(201), year: 2025 }, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should return 400 for invalid type', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await postCvEntry(app, { type: 'invalid', title: 'Show', year: 2025 }, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should return 400 for year below 1900', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await postCvEntry(app, { type: 'exhibition', title: 'Show', year: 1899 }, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should return 400 for year above 2100', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await postCvEntry(app, { type: 'exhibition', title: 'Show', year: 2101 }, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should return 400 for description exceeding 2000 characters', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await postCvEntry(app, {
      type: 'exhibition', title: 'Show', year: 2025, description: 'x'.repeat(2001),
    }, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should return 400 for invalid JSON payload', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer valid-token',
    }
    const res = await app.request('/me/cv-entries', {
      method: 'POST',
      headers,
      body: 'not json',
    })
    expect(res.status).toBe(400)
  })

  it('should create an entry with auto-assigned sortOrder', async () => {
    const created = { ...mockCvEntry, sortOrder: 3 }
    const prisma = createMockPrisma({ cvEntries: [mockCvEntry, mockCvEntry2], createdCvEntry: created })
    // count returns existing entry count for sortOrder assignment
    ;(prisma.artistCvEntry.count as ReturnType<typeof vi.fn>).mockResolvedValue(2)
    const app = createTestApp(prisma)

    const res = await postCvEntry(app, {
      type: 'exhibition', title: 'Solo Show', institution: 'Portland Art Museum',
      year: 2025, description: 'My first solo show.',
    }, 'valid-token')
    expect(res.status).toBe(201)

    const createCall = (prisma.artistCvEntry.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(createCall.data.artistId).toBe('artist-uuid-123')
    expect(createCall.data.sortOrder).toBe(2)
  })

  it('should sanitize title and description', async () => {
    const created = { ...mockCvEntry, title: 'Clean Title', description: 'Clean desc' }
    const prisma = createMockPrisma({ createdCvEntry: created })
    const app = createTestApp(prisma)

    await postCvEntry(app, {
      type: 'exhibition', title: '<b>Clean</b> Title', year: 2025,
      description: '<script>alert("x")</script>Clean desc',
    }, 'valid-token')

    const createCall = (prisma.artistCvEntry.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(createCall.data.title).not.toContain('<b>')
    expect(createCall.data.description).not.toContain('<script>')
  })

  it('should return created entry without artistId', async () => {
    const created = { ...mockCvEntry }
    const prisma = createMockPrisma({ createdCvEntry: created })
    const app = createTestApp(prisma)

    const res = await postCvEntry(app, {
      type: 'exhibition', title: 'Solo Show', year: 2025,
    }, 'valid-token')

    const body = await res.json()
    expect(body).toHaveProperty('id')
    expect(body).toHaveProperty('type', 'exhibition')
    expect(body).toHaveProperty('title', 'Solo Show')
    expect(body).toHaveProperty('sortOrder')
    expect(body).not.toHaveProperty('artistId')
  })
})

describe('PUT /me/cv-entries/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVerifier(createMockVerifier() as never)
  })

  afterEach(() => {
    resetVerifier()
  })

  it('should return 401 without auth token', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await putCvEntry(app, CV_ENTRY_ID_1, { title: 'Updated' })
    expect(res.status).toBe(401)
  })

  it('should return 404 when artist profile does not exist', async () => {
    const prisma = createMockPrisma({ artistProfile: null })
    const app = createTestApp(prisma)

    const res = await putCvEntry(app, CV_ENTRY_ID_1, {
      type: 'exhibition', title: 'Updated', year: 2025,
    }, 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should return 404 when entry does not exist', async () => {
    const prisma = createMockPrisma({ cvEntries: [] })
    ;(prisma.artistCvEntry.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const app = createTestApp(prisma)

    const res = await putCvEntry(app, '99999999-9999-4999-8999-999999999999', {
      type: 'exhibition', title: 'Updated', year: 2025,
    }, 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should return 403 when entry belongs to another artist', async () => {
    const otherEntry = { ...mockCvEntry, artistId: 'other-artist-uuid' }
    const prisma = createMockPrisma({ cvEntries: [otherEntry] })
    ;(prisma.artistCvEntry.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(otherEntry)
    const app = createTestApp(prisma)

    const res = await putCvEntry(app, CV_ENTRY_ID_1, {
      type: 'exhibition', title: 'Updated', year: 2025,
    }, 'valid-token')
    expect(res.status).toBe(403)
  })

  it('should return 400 for invalid type value', async () => {
    const prisma = createMockPrisma({ cvEntries: [mockCvEntry] })
    ;(prisma.artistCvEntry.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockCvEntry)
    const app = createTestApp(prisma)

    const res = await putCvEntry(app, CV_ENTRY_ID_1, {
      type: 'invalid', title: 'Show', year: 2025,
    }, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should update the entry and return updated data', async () => {
    const updated = { ...mockCvEntry, title: 'Updated Show' }
    const prisma = createMockPrisma({ cvEntries: [mockCvEntry], updatedCvEntry: updated })
    ;(prisma.artistCvEntry.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockCvEntry)
    const app = createTestApp(prisma)

    const res = await putCvEntry(app, CV_ENTRY_ID_1, {
      type: 'exhibition', title: 'Updated Show', year: 2025,
    }, 'valid-token')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.title).toBe('Updated Show')
    expect(body).not.toHaveProperty('artistId')
  })

  it('should convert empty institution to null', async () => {
    const updated = { ...mockCvEntry, institution: null }
    const prisma = createMockPrisma({ cvEntries: [mockCvEntry], updatedCvEntry: updated })
    ;(prisma.artistCvEntry.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockCvEntry)
    const app = createTestApp(prisma)

    await putCvEntry(app, CV_ENTRY_ID_1, {
      type: 'exhibition', title: 'Show', year: 2025, institution: '',
    }, 'valid-token')

    const updateCall = (prisma.artistCvEntry.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(updateCall.data.institution).toBeNull()
  })
})

describe('DELETE /me/cv-entries/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVerifier(createMockVerifier() as never)
  })

  afterEach(() => {
    resetVerifier()
  })

  it('should return 401 without auth token', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await deleteCvEntry(app, CV_ENTRY_ID_1)
    expect(res.status).toBe(401)
  })

  it('should return 404 when artist profile does not exist', async () => {
    const prisma = createMockPrisma({ artistProfile: null })
    const app = createTestApp(prisma)

    const res = await deleteCvEntry(app, CV_ENTRY_ID_1, 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should return 404 when entry does not exist', async () => {
    const prisma = createMockPrisma()
    ;(prisma.artistCvEntry.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const app = createTestApp(prisma)

    const res = await deleteCvEntry(app, '99999999-9999-4999-8999-999999999999', 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should return 403 when entry belongs to another artist', async () => {
    const otherEntry = { ...mockCvEntry, artistId: 'other-artist-uuid' }
    const prisma = createMockPrisma()
    ;(prisma.artistCvEntry.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(otherEntry)
    const app = createTestApp(prisma)

    const res = await deleteCvEntry(app, CV_ENTRY_ID_1, 'valid-token')
    expect(res.status).toBe(403)
  })

  it('should delete the entry and return 204', async () => {
    const prisma = createMockPrisma()
    ;(prisma.artistCvEntry.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockCvEntry)
    const app = createTestApp(prisma)

    const res = await deleteCvEntry(app, CV_ENTRY_ID_1, 'valid-token')
    expect(res.status).toBe(204)

    expect(prisma.artistCvEntry.delete).toHaveBeenCalledWith({
      where: { id: CV_ENTRY_ID_1 },
    })
  })
})

describe('PUT /me/cv-entries/reorder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVerifier(createMockVerifier() as never)
  })

  afterEach(() => {
    resetVerifier()
  })

  it('should return 401 without auth token', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await putCvEntryReorder(app, { orderedIds: [CV_ENTRY_ID_1] })
    expect(res.status).toBe(401)
  })

  it('should return 404 when artist profile does not exist', async () => {
    const prisma = createMockPrisma({ artistProfile: null })
    const app = createTestApp(prisma)

    const res = await putCvEntryReorder(app, { orderedIds: [CV_ENTRY_ID_1] }, 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should return 400 for empty orderedIds array', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await putCvEntryReorder(app, { orderedIds: [] }, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should return 400 for invalid UUID in orderedIds', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await putCvEntryReorder(app, { orderedIds: ['not-a-uuid'] }, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should update sortOrder for each entry in a transaction', async () => {
    const entries = [mockCvEntry, mockCvEntry2]
    const prisma = createMockPrisma({ cvEntries: entries })
    // findMany returns entries scoped to artist
    ;(prisma.artistCvEntry.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(entries)
    const app = createTestApp(prisma)

    const res = await putCvEntryReorder(app, {
      orderedIds: [CV_ENTRY_ID_2, CV_ENTRY_ID_1],
    }, 'valid-token')
    expect(res.status).toBe(200)

    expect(prisma.$transaction).toHaveBeenCalled()
  })

  it('should return 400 when orderedIds contain IDs not owned by artist', async () => {
    const prisma = createMockPrisma({ cvEntries: [mockCvEntry] })
    // findMany returns only 1 entry — the other ID is not owned
    ;(prisma.artistCvEntry.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([mockCvEntry])
    const app = createTestApp(prisma)

    const res = await putCvEntryReorder(app, {
      orderedIds: [CV_ENTRY_ID_1, 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'],
    }, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should return 400 when orderedIds is a partial list', async () => {
    const entries = [mockCvEntry, mockCvEntry2]
    const prisma = createMockPrisma({ cvEntries: entries })
    ;(prisma.artistCvEntry.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(entries)
    const app = createTestApp(prisma)

    const res = await putCvEntryReorder(app, {
      orderedIds: [CV_ENTRY_ID_1],
    }, 'valid-token')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.message).toContain('all entry IDs')
  })

  it('should return the reordered entries', async () => {
    const entries = [mockCvEntry, mockCvEntry2]
    const reordered = [
      { ...mockCvEntry2, sortOrder: 0 },
      { ...mockCvEntry, sortOrder: 1 },
    ]
    const prisma = createMockPrisma({ cvEntries: entries })
    ;(prisma.artistCvEntry.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(entries)  // ownership check
      .mockResolvedValueOnce(reordered) // final result
    const app = createTestApp(prisma)

    const res = await putCvEntryReorder(app, {
      orderedIds: [CV_ENTRY_ID_2, CV_ENTRY_ID_1],
    }, 'valid-token')

    const body = await res.json()
    expect(body.cvEntries).toHaveLength(2)
  })
})

// ─── Process Media Tests ────────────────────────────────────────────

const PROCESS_MEDIA_ID_1 = '33333333-3333-4333-8333-333333333333'
const PROCESS_MEDIA_ID_2 = '44444444-4444-4444-8444-444444444444'

const mockProcessMediaPhoto = {
  id: PROCESS_MEDIA_ID_1,
  artistId: 'artist-uuid-123',
  type: 'photo',
  url: 'https://d2agn4aoo0e7ji.cloudfront.net/uploads/process/photo1.jpg',
  videoAssetId: null,
  videoPlaybackId: null,
  videoProvider: null,
  sortOrder: 0,
  createdAt: new Date('2025-01-01'),
}

const mockProcessMediaVideo = {
  id: PROCESS_MEDIA_ID_2,
  artistId: 'artist-uuid-123',
  type: 'video',
  url: null,
  videoAssetId: null,
  videoPlaybackId: 'abc123playback',
  videoProvider: 'mux',
  sortOrder: 1,
  createdAt: new Date('2025-01-02'),
}

describe('GET /me/process-media', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVerifier(createMockVerifier() as never)
  })

  afterEach(() => {
    resetVerifier()
  })

  it('should return 401 without auth token', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await getProcessMedia(app)
    expect(res.status).toBe(401)
  })

  it('should return 403 for buyer-only role', async () => {
    const prisma = createMockPrisma({ roles: ['buyer'] })
    const app = createTestApp(prisma)
    const res = await getProcessMedia(app, 'valid-token')
    expect(res.status).toBe(403)
  })

  it('should return 404 when artist profile not found', async () => {
    const prisma = createMockPrisma({ artistProfile: null })
    const app = createTestApp(prisma)
    const res = await getProcessMedia(app, 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should return empty list when no process media exists', async () => {
    const prisma = createMockPrisma({ processMedia: [] })
    const app = createTestApp(prisma)
    const res = await getProcessMedia(app, 'valid-token')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.processMedia).toEqual([])
  })

  it('should return process media ordered by sortOrder', async () => {
    const prisma = createMockPrisma({
      processMedia: [mockProcessMediaPhoto, mockProcessMediaVideo],
    })
    const app = createTestApp(prisma)
    const res = await getProcessMedia(app, 'valid-token')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.processMedia).toHaveLength(2)
    expect(body.processMedia[0].type).toBe('photo')
    expect(body.processMedia[1].type).toBe('video')
  })
})

describe('POST /me/process-media/photo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVerifier(createMockVerifier() as never)
    process.env.CLOUDFRONT_DOMAIN = 'd2agn4aoo0e7ji.cloudfront.net'
  })

  afterEach(() => {
    resetVerifier()
    delete process.env.CLOUDFRONT_DOMAIN
  })

  it('should return 401 without auth token', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await postProcessMediaPhoto(app, { url: 'https://d2agn4aoo0e7ji.cloudfront.net/photo.jpg' })
    expect(res.status).toBe(401)
  })

  it('should return 400 for invalid URL', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await postProcessMediaPhoto(app, { url: 'not-a-url' }, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should return 400 when URL is not from CloudFront', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await postProcessMediaPhoto(app, {
      url: 'https://evil.example.com/photo.jpg',
    }, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should return 404 when artist profile not found', async () => {
    const prisma = createMockPrisma({ artistProfile: null })
    const app = createTestApp(prisma)
    const res = await postProcessMediaPhoto(app, {
      url: 'https://d2agn4aoo0e7ji.cloudfront.net/photo.jpg',
    }, 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should create a photo entry and return 201', async () => {
    const created = { ...mockProcessMediaPhoto }
    const prisma = createMockPrisma({ createdProcessMedia: created })
    const app = createTestApp(prisma)
    const res = await postProcessMediaPhoto(app, {
      url: 'https://d2agn4aoo0e7ji.cloudfront.net/uploads/process/photo1.jpg',
    }, 'valid-token')
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.type).toBe('photo')
    expect(body.url).toBe('https://d2agn4aoo0e7ji.cloudfront.net/uploads/process/photo1.jpg')
  })
})

describe('POST /me/process-media/video', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVerifier(createMockVerifier() as never)
  })

  afterEach(() => {
    resetVerifier()
  })

  it('should return 401 without auth token', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await postProcessMediaVideo(app, {
      videoPlaybackId: 'abc123',
      videoProvider: 'mux',
    })
    expect(res.status).toBe(401)
  })

  it('should return 400 for missing playback ID', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await postProcessMediaVideo(app, {
      videoProvider: 'mux',
    }, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should return 400 for invalid provider', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await postProcessMediaVideo(app, {
      videoPlaybackId: 'abc123',
      videoProvider: 'youtube',
    }, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should return 404 when artist profile not found', async () => {
    const prisma = createMockPrisma({ artistProfile: null })
    const app = createTestApp(prisma)
    const res = await postProcessMediaVideo(app, {
      videoPlaybackId: 'abc123',
      videoProvider: 'mux',
    }, 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should create a video entry and return 201', async () => {
    const created = { ...mockProcessMediaVideo }
    const prisma = createMockPrisma({ createdProcessMedia: created })
    const app = createTestApp(prisma)
    const res = await postProcessMediaVideo(app, {
      videoPlaybackId: 'abc123playback',
      videoProvider: 'mux',
    }, 'valid-token')
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.type).toBe('video')
    expect(body.videoPlaybackId).toBe('abc123playback')
    expect(body.videoProvider).toBe('mux')
  })
})

describe('DELETE /me/process-media/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVerifier(createMockVerifier() as never)
  })

  afterEach(() => {
    resetVerifier()
  })

  it('should return 401 without auth token', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await deleteProcessMedia(app, PROCESS_MEDIA_ID_1)
    expect(res.status).toBe(401)
  })

  it('should return 404 when entry not found', async () => {
    const prisma = createMockPrisma({ processMedia: [] })
    ;(prisma.artistProcessMedia.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const app = createTestApp(prisma)
    const res = await deleteProcessMedia(app, PROCESS_MEDIA_ID_1, 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should return 403 when entry belongs to another artist', async () => {
    const otherEntry = { ...mockProcessMediaPhoto, artistId: 'other-artist-uuid' }
    const prisma = createMockPrisma({ processMedia: [otherEntry] })
    const app = createTestApp(prisma)
    const res = await deleteProcessMedia(app, PROCESS_MEDIA_ID_1, 'valid-token')
    expect(res.status).toBe(403)
  })

  it('should return 204 on successful delete', async () => {
    const prisma = createMockPrisma({ processMedia: [mockProcessMediaPhoto] })
    const app = createTestApp(prisma)
    const res = await deleteProcessMedia(app, PROCESS_MEDIA_ID_1, 'valid-token')
    expect(res.status).toBe(204)
  })
})

describe('PUT /me/process-media/reorder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVerifier(createMockVerifier() as never)
  })

  afterEach(() => {
    resetVerifier()
  })

  it('should return 401 without auth token', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await putProcessMediaReorder(app, {
      orderedIds: [PROCESS_MEDIA_ID_1],
    })
    expect(res.status).toBe(401)
  })

  it('should return 400 for invalid body (empty array)', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await putProcessMediaReorder(app, {
      orderedIds: [],
    }, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should return 400 for non-UUID IDs', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await putProcessMediaReorder(app, {
      orderedIds: ['not-a-uuid'],
    }, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should return 400 when IDs do not belong to this artist', async () => {
    const media = [mockProcessMediaPhoto]
    const prisma = createMockPrisma({ processMedia: media })
    const app = createTestApp(prisma)
    const res = await putProcessMediaReorder(app, {
      orderedIds: [PROCESS_MEDIA_ID_1, 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'],
    }, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should return 400 when orderedIds is a partial list', async () => {
    const media = [mockProcessMediaPhoto, mockProcessMediaVideo]
    const prisma = createMockPrisma({ processMedia: media })
    ;(prisma.artistProcessMedia.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(media)
    const app = createTestApp(prisma)
    const res = await putProcessMediaReorder(app, {
      orderedIds: [PROCESS_MEDIA_ID_1],
    }, 'valid-token')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.message).toContain('all media IDs')
  })

  it('should return the reordered process media', async () => {
    const media = [mockProcessMediaPhoto, mockProcessMediaVideo]
    const reordered = [
      { ...mockProcessMediaVideo, sortOrder: 0 },
      { ...mockProcessMediaPhoto, sortOrder: 1 },
    ]
    const prisma = createMockPrisma({ processMedia: media })
    ;(prisma.artistProcessMedia.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(media)   // ownership check
      .mockResolvedValueOnce(reordered) // final result
    const app = createTestApp(prisma)

    const res = await putProcessMediaReorder(app, {
      orderedIds: [PROCESS_MEDIA_ID_2, PROCESS_MEDIA_ID_1],
    }, 'valid-token')

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.processMedia).toHaveLength(2)
  })
})

// ─── Listing CRUD Tests ───────────────────────────────────────────────

const LISTING_ID_1 = '55555555-5555-4555-8555-555555555555'
const LISTING_ID_2 = '66666666-6666-4666-8666-666666666666'

const mockListingImage = {
  id: '77777777-7777-4777-8777-777777777777',
  listingId: LISTING_ID_1,
  url: 'https://d2agn4aoo0e7ji.cloudfront.net/uploads/listing/img1.jpg',
  isProcessPhoto: false,
  sortOrder: 0,
  createdAt: new Date('2025-06-01'),
}

const mockListingDb = {
  id: LISTING_ID_1,
  artistId: 'artist-uuid-123',
  type: 'standard',
  title: 'Mountain Vase',
  description: 'A handmade ceramic vase inspired by Pacific Northwest mountains.',
  medium: 'Stoneware clay, glazed',
  category: 'ceramics',
  price: 15000, // $150.00
  status: 'available',
  isDocumented: false,
  quantityTotal: 1,
  quantityRemaining: 1,
  artworkLength: { toNumber: () => 8 },
  artworkWidth: { toNumber: () => 8 },
  artworkHeight: { toNumber: () => 12 },
  packedLength: { toNumber: () => 14 },
  packedWidth: { toNumber: () => 14 },
  packedHeight: { toNumber: () => 18 },
  packedWeight: { toNumber: () => 5 },
  editionNumber: null,
  editionTotal: null,
  reservedUntil: null,
  createdAt: new Date('2025-06-01'),
  updatedAt: new Date('2025-06-01'),
  images: [mockListingImage],
}

const mockListingDb2 = {
  ...mockListingDb,
  id: LISTING_ID_2,
  title: 'Sunset Bowl',
  description: 'A warm-toned bowl with sunset glaze.',
  price: 8500,
  status: 'sold',
  images: [],
}

const validListingCreateBody = {
  title: 'Mountain Vase',
  description: 'A handmade ceramic vase inspired by Pacific Northwest mountains.',
  medium: 'Stoneware clay, glazed',
  category: 'ceramics',
  type: 'standard',
  price: 15000,
  packedLength: 14,
  packedWidth: 14,
  packedHeight: 18,
  packedWeight: 5,
}

// ─── Listing request helpers ────────────────────────────────────────

function getMyListings(
  app: ReturnType<typeof createTestApp>,
  query?: string,
  token?: string,
) {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const url = query ? `/me/listings?${query}` : '/me/listings'
  return app.request(url, { method: 'GET', headers })
}

function postListing(
  app: ReturnType<typeof createTestApp>,
  body: Record<string, unknown>,
  token?: string,
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request('/me/listings', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

function getMyListing(
  app: ReturnType<typeof createTestApp>,
  id: string,
  token?: string,
) {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request(`/me/listings/${id}`, { method: 'GET', headers })
}

function putListing(
  app: ReturnType<typeof createTestApp>,
  id: string,
  body: Record<string, unknown>,
  token?: string,
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request(`/me/listings/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  })
}

function deleteListing(
  app: ReturnType<typeof createTestApp>,
  id: string,
  token?: string,
) {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request(`/me/listings/${id}`, {
    method: 'DELETE',
    headers,
  })
}

// ─── GET /me/listings ─────────────────────────────────────────────────

describe('GET /me/listings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVerifier(createMockVerifier() as never)
  })

  afterEach(() => {
    resetVerifier()
  })

  it('should return 401 without auth token', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await getMyListings(app)
    expect(res.status).toBe(401)
  })

  it('should return 403 for buyer-only role', async () => {
    const prisma = createMockPrisma({ roles: ['buyer'] })
    const app = createTestApp(prisma)

    const res = await getMyListings(app, undefined, 'valid-token')
    expect(res.status).toBe(403)
  })

  it('should return 404 when artist profile does not exist', async () => {
    const prisma = createMockPrisma({ artistProfile: null })
    const app = createTestApp(prisma)

    const res = await getMyListings(app, undefined, 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should return empty paginated response when no listings exist', async () => {
    const prisma = createMockPrisma({ listings: [] })
    // Override listing.count for pagination total (not dashboard counts)
    ;(prisma.listing.count as ReturnType<typeof vi.fn>).mockReset()
    ;(prisma.listing.count as ReturnType<typeof vi.fn>).mockResolvedValue(0)
    ;(prisma.listing.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])
    const app = createTestApp(prisma)

    const res = await getMyListings(app, undefined, 'valid-token')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toEqual([])
    expect(body.meta.total).toBe(0)
    expect(body.meta.page).toBe(1)
  })

  it('should return paginated listings with primary image', async () => {
    const listings = [mockListingDb, mockListingDb2]
    const prisma = createMockPrisma({ listings })
    ;(prisma.listing.count as ReturnType<typeof vi.fn>).mockReset()
    ;(prisma.listing.count as ReturnType<typeof vi.fn>).mockResolvedValue(2)
    ;(prisma.listing.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(listings)
    const app = createTestApp(prisma)

    const res = await getMyListings(app, undefined, 'valid-token')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(2)
    expect(body.meta.total).toBe(2)
    expect(body.meta.totalPages).toBe(1)
  })

  it('should filter by status query param', async () => {
    const prisma = createMockPrisma({ listings: [mockListingDb] })
    ;(prisma.listing.count as ReturnType<typeof vi.fn>).mockReset()
    ;(prisma.listing.count as ReturnType<typeof vi.fn>).mockResolvedValue(1)
    ;(prisma.listing.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([mockListingDb])
    const app = createTestApp(prisma)

    const res = await getMyListings(app, 'status=available', 'valid-token')
    expect(res.status).toBe(200)

    // Verify the where clause includes status filter
    const countCall = (prisma.listing.count as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(countCall.where.status).toBe('available')
  })

  it('should filter by category query param', async () => {
    const prisma = createMockPrisma({ listings: [mockListingDb] })
    ;(prisma.listing.count as ReturnType<typeof vi.fn>).mockReset()
    ;(prisma.listing.count as ReturnType<typeof vi.fn>).mockResolvedValue(1)
    ;(prisma.listing.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([mockListingDb])
    const app = createTestApp(prisma)

    const res = await getMyListings(app, 'category=ceramics', 'valid-token')
    expect(res.status).toBe(200)

    const countCall = (prisma.listing.count as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(countCall.where.category).toBe('ceramics')
  })

  it('should return 400 for invalid status filter', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await getMyListings(app, 'status=invalid_status', 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should return 400 for invalid category filter', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await getMyListings(app, 'category=invalid_category', 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should respect pagination params', async () => {
    const prisma = createMockPrisma({ listings: [mockListingDb] })
    ;(prisma.listing.count as ReturnType<typeof vi.fn>).mockReset()
    ;(prisma.listing.count as ReturnType<typeof vi.fn>).mockResolvedValue(25)
    ;(prisma.listing.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([mockListingDb])
    const app = createTestApp(prisma)

    const res = await getMyListings(app, 'page=2&limit=10', 'valid-token')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.meta.page).toBe(2)
    expect(body.meta.limit).toBe(10)
    expect(body.meta.totalPages).toBe(3)

    // Verify skip was applied
    const findManyCall = (prisma.listing.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(findManyCall.skip).toBe(10) // (page 2 - 1) * limit 10
    expect(findManyCall.take).toBe(10)
  })

  it('should not include artistId in listing items', async () => {
    const prisma = createMockPrisma({ listings: [mockListingDb] })
    ;(prisma.listing.count as ReturnType<typeof vi.fn>).mockReset()
    ;(prisma.listing.count as ReturnType<typeof vi.fn>).mockResolvedValue(1)
    ;(prisma.listing.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([mockListingDb])
    const app = createTestApp(prisma)

    const res = await getMyListings(app, undefined, 'valid-token')
    const body = await res.json()

    expect(body.data[0]).not.toHaveProperty('artistId')
  })

  it('should convert Decimal fields to numbers', async () => {
    const prisma = createMockPrisma({ listings: [mockListingDb] })
    ;(prisma.listing.count as ReturnType<typeof vi.fn>).mockReset()
    ;(prisma.listing.count as ReturnType<typeof vi.fn>).mockResolvedValue(1)
    ;(prisma.listing.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([mockListingDb])
    const app = createTestApp(prisma)

    const res = await getMyListings(app, undefined, 'valid-token')
    const body = await res.json()

    // Decimal fields should be plain numbers, not objects
    expect(typeof body.data[0].price).toBe('number')
  })

  it('should cap limit at 100', async () => {
    const prisma = createMockPrisma()
    ;(prisma.listing.count as ReturnType<typeof vi.fn>).mockReset()
    ;(prisma.listing.count as ReturnType<typeof vi.fn>).mockResolvedValue(0)
    ;(prisma.listing.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])
    const app = createTestApp(prisma)

    const res = await getMyListings(app, 'limit=500', 'valid-token')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.meta.limit).toBe(100)
  })
})

// ─── POST /me/listings ────────────────────────────────────────────────

describe('POST /me/listings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVerifier(createMockVerifier() as never)
  })

  afterEach(() => {
    resetVerifier()
  })

  it('should return 401 without auth token', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await postListing(app, validListingCreateBody)
    expect(res.status).toBe(401)
  })

  it('should return 403 for buyer-only role', async () => {
    const prisma = createMockPrisma({ roles: ['buyer'] })
    const app = createTestApp(prisma)

    const res = await postListing(app, validListingCreateBody, 'valid-token')
    expect(res.status).toBe(403)
  })

  it('should return 404 when artist profile does not exist', async () => {
    const prisma = createMockPrisma({ artistProfile: null })
    const app = createTestApp(prisma)

    const res = await postListing(app, validListingCreateBody, 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should return 400 for missing title', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const { title: _, ...bodyWithoutTitle } = validListingCreateBody
    const res = await postListing(app, bodyWithoutTitle, 'valid-token')
    expect(res.status).toBe(400)

    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('should return 400 for missing description', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const { description: _, ...bodyWithout } = validListingCreateBody
    const res = await postListing(app, bodyWithout, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should return 400 for missing medium', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const { medium: _, ...bodyWithout } = validListingCreateBody
    const res = await postListing(app, bodyWithout, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should return 400 for invalid category', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await postListing(app, { ...validListingCreateBody, category: 'invalid' }, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should return 400 for invalid type', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await postListing(app, { ...validListingCreateBody, type: 'invalid' }, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should return 400 for zero price', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await postListing(app, { ...validListingCreateBody, price: 0 }, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should return 400 for negative price', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await postListing(app, { ...validListingCreateBody, price: -100 }, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should return 400 for non-integer price', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await postListing(app, { ...validListingCreateBody, price: 99.99 }, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should return 400 for missing packed dimensions', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const { packedLength: _, ...bodyWithout } = validListingCreateBody
    const res = await postListing(app, bodyWithout, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should return 400 for zero packed dimension', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await postListing(app, { ...validListingCreateBody, packedWeight: 0 }, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should return 400 for title exceeding 200 characters', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await postListing(app, { ...validListingCreateBody, title: 'x'.repeat(201) }, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should return 400 for description exceeding 5000 characters', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await postListing(app, { ...validListingCreateBody, description: 'x'.repeat(5001) }, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should return 400 for invalid JSON payload', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer valid-token',
    }
    const res = await app.request('/me/listings', {
      method: 'POST',
      headers,
      body: 'not json',
    })
    expect(res.status).toBe(400)
  })

  it('should create a listing and return 201', async () => {
    const created = { ...mockListingDb, images: [] }
    const prisma = createMockPrisma({ createdListing: created })
    const app = createTestApp(prisma)

    const res = await postListing(app, validListingCreateBody, 'valid-token')
    expect(res.status).toBe(201)

    const body = await res.json()
    expect(body.id).toBe(LISTING_ID_1)
    expect(body.title).toBe('Mountain Vase')
    expect(body.price).toBe(15000)
    expect(body.status).toBe('available')
  })

  it('should sanitize title, description, and medium', async () => {
    const created = { ...mockListingDb, title: 'Clean Title', description: 'Clean desc', medium: 'Clay' }
    const prisma = createMockPrisma({ createdListing: created })
    const app = createTestApp(prisma)

    await postListing(app, {
      ...validListingCreateBody,
      title: '<b>Clean</b> Title',
      description: '<script>alert("x")</script>Clean desc',
      medium: '<em>Clay</em>',
    }, 'valid-token')

    const createCall = (prisma.listing.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(createCall.data.title).not.toContain('<b>')
    expect(createCall.data.description).not.toContain('<script>')
    expect(createCall.data.medium).not.toContain('<em>')
  })

  it('should set quantityRemaining equal to quantityTotal', async () => {
    const created = { ...mockListingDb, quantityTotal: 5, quantityRemaining: 5 }
    const prisma = createMockPrisma({ createdListing: created })
    const app = createTestApp(prisma)

    await postListing(app, { ...validListingCreateBody, quantityTotal: 5 }, 'valid-token')

    const createCall = (prisma.listing.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(createCall.data.quantityRemaining).toBe(5)
  })

  it('should default quantityTotal to 1', async () => {
    const created = { ...mockListingDb }
    const prisma = createMockPrisma({ createdListing: created })
    const app = createTestApp(prisma)

    const { quantityTotal: _, ...bodyWithout } = validListingCreateBody
    await postListing(app, bodyWithout, 'valid-token')

    const createCall = (prisma.listing.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(createCall.data.quantityTotal).toBe(1)
    expect(createCall.data.quantityRemaining).toBe(1)
  })

  it('should accept optional artwork dimensions', async () => {
    const created = { ...mockListingDb }
    const prisma = createMockPrisma({ createdListing: created })
    const app = createTestApp(prisma)

    const res = await postListing(app, {
      ...validListingCreateBody,
      artworkLength: 8,
      artworkWidth: 8,
      artworkHeight: 12,
    }, 'valid-token')
    expect(res.status).toBe(201)

    const createCall = (prisma.listing.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(createCall.data.artworkLength).toBe(8)
  })

  it('should accept optional edition info', async () => {
    const created = { ...mockListingDb, editionNumber: 3, editionTotal: 10 }
    const prisma = createMockPrisma({ createdListing: created })
    const app = createTestApp(prisma)

    const res = await postListing(app, {
      ...validListingCreateBody,
      editionNumber: 3,
      editionTotal: 10,
    }, 'valid-token')
    expect(res.status).toBe(201)
  })

  it('should not include artistId in response', async () => {
    const created = { ...mockListingDb, images: [] }
    const prisma = createMockPrisma({ createdListing: created })
    const app = createTestApp(prisma)

    const res = await postListing(app, validListingCreateBody, 'valid-token')
    const body = await res.json()

    expect(body).not.toHaveProperty('artistId')
  })

  it('should set default status to available', async () => {
    const created = { ...mockListingDb }
    const prisma = createMockPrisma({ createdListing: created })
    const app = createTestApp(prisma)

    await postListing(app, validListingCreateBody, 'valid-token')

    const createCall = (prisma.listing.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(createCall.data.status).toBe('available')
  })
})

// ─── GET /me/listings/:id ─────────────────────────────────────────────

describe('GET /me/listings/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVerifier(createMockVerifier() as never)
  })

  afterEach(() => {
    resetVerifier()
  })

  it('should return 401 without auth token', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await getMyListing(app, LISTING_ID_1)
    expect(res.status).toBe(401)
  })

  it('should return 403 for buyer-only role', async () => {
    const prisma = createMockPrisma({ roles: ['buyer'] })
    const app = createTestApp(prisma)

    const res = await getMyListing(app, LISTING_ID_1, 'valid-token')
    expect(res.status).toBe(403)
  })

  it('should return 404 when artist profile does not exist', async () => {
    const prisma = createMockPrisma({ artistProfile: null })
    const app = createTestApp(prisma)

    const res = await getMyListing(app, LISTING_ID_1, 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should return 404 when listing does not exist', async () => {
    const prisma = createMockPrisma()
    ;(prisma.listing.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const app = createTestApp(prisma)

    const res = await getMyListing(app, '99999999-9999-4999-8999-999999999999', 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should return 403 when listing belongs to another artist', async () => {
    const otherListing = { ...mockListingDb, artistId: 'other-artist-uuid' }
    const prisma = createMockPrisma()
    ;(prisma.listing.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(otherListing)
    const app = createTestApp(prisma)

    const res = await getMyListing(app, LISTING_ID_1, 'valid-token')
    expect(res.status).toBe(403)
  })

  it('should return listing with images', async () => {
    const prisma = createMockPrisma()
    ;(prisma.listing.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockListingDb)
    const app = createTestApp(prisma)

    const res = await getMyListing(app, LISTING_ID_1, 'valid-token')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.id).toBe(LISTING_ID_1)
    expect(body.title).toBe('Mountain Vase')
    expect(body.images).toHaveLength(1)
  })

  it('should not include artistId in response', async () => {
    const prisma = createMockPrisma()
    ;(prisma.listing.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockListingDb)
    const app = createTestApp(prisma)

    const res = await getMyListing(app, LISTING_ID_1, 'valid-token')
    const body = await res.json()

    expect(body).not.toHaveProperty('artistId')
  })

  it('should convert Decimal fields to numbers', async () => {
    const prisma = createMockPrisma()
    ;(prisma.listing.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockListingDb)
    const app = createTestApp(prisma)

    const res = await getMyListing(app, LISTING_ID_1, 'valid-token')
    const body = await res.json()

    expect(typeof body.packedLength).toBe('number')
    expect(body.packedLength).toBe(14)
    expect(typeof body.artworkHeight).toBe('number')
    expect(body.artworkHeight).toBe(12)
  })

  it('should convert Date fields to ISO strings', async () => {
    const prisma = createMockPrisma()
    ;(prisma.listing.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockListingDb)
    const app = createTestApp(prisma)

    const res = await getMyListing(app, LISTING_ID_1, 'valid-token')
    const body = await res.json()

    expect(typeof body.createdAt).toBe('string')
    expect(typeof body.updatedAt).toBe('string')
  })

  it('should handle expired system reservation by clearing status and persisting to database', async () => {
    const expiredListing = {
      ...mockListingDb,
      status: 'reserved_system',
      reservedUntil: new Date('2020-01-01'), // in the past
    }
    const updatedListing = {
      ...mockListingDb,
      status: 'available',
      reservedUntil: null,
    }
    const prisma = createMockPrisma()
    ;(prisma.listing.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(expiredListing)
    ;(prisma.listing.update as ReturnType<typeof vi.fn>).mockResolvedValue(updatedListing)
    const app = createTestApp(prisma)

    const res = await getMyListing(app, LISTING_ID_1, 'valid-token')
    expect(res.status).toBe(200)

    const body = await res.json()
    // Expired reservation should be treated as available
    expect(body.status).toBe('available')
    expect(body.reservedUntil).toBeNull()

    // Should persist the status change to the database
    expect(prisma.listing.update).toHaveBeenCalledWith({
      where: { id: LISTING_ID_1 },
      data: { status: 'available', reservedUntil: null },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    })
  })
})

// ─── PUT /me/listings/:id ─────────────────────────────────────────────

describe('PUT /me/listings/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVerifier(createMockVerifier() as never)
  })

  afterEach(() => {
    resetVerifier()
  })

  it('should return 401 without auth token', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await putListing(app, LISTING_ID_1, { title: 'Updated' })
    expect(res.status).toBe(401)
  })

  it('should return 403 for buyer-only role', async () => {
    const prisma = createMockPrisma({ roles: ['buyer'] })
    const app = createTestApp(prisma)

    const res = await putListing(app, LISTING_ID_1, { title: 'Updated' }, 'valid-token')
    expect(res.status).toBe(403)
  })

  it('should return 404 when artist profile does not exist', async () => {
    const prisma = createMockPrisma({ artistProfile: null })
    const app = createTestApp(prisma)

    const res = await putListing(app, LISTING_ID_1, { title: 'Updated' }, 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should return 404 when listing does not exist', async () => {
    const prisma = createMockPrisma()
    ;(prisma.listing.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const app = createTestApp(prisma)

    const res = await putListing(app, '99999999-9999-4999-8999-999999999999', { title: 'Updated' }, 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should return 403 when listing belongs to another artist', async () => {
    const otherListing = { ...mockListingDb, artistId: 'other-artist-uuid' }
    const prisma = createMockPrisma()
    ;(prisma.listing.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(otherListing)
    const app = createTestApp(prisma)

    const res = await putListing(app, LISTING_ID_1, { title: 'Updated' }, 'valid-token')
    expect(res.status).toBe(403)
  })

  it('should return 400 for invalid JSON payload', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer valid-token',
    }
    const res = await app.request(`/me/listings/${LISTING_ID_1}`, {
      method: 'PUT',
      headers,
      body: 'not json',
    })
    expect(res.status).toBe(400)
  })

  it('should return 400 for invalid category value', async () => {
    const prisma = createMockPrisma()
    ;(prisma.listing.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockListingDb)
    const app = createTestApp(prisma)

    const res = await putListing(app, LISTING_ID_1, { category: 'invalid' }, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should return 400 for title exceeding 200 characters', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await putListing(app, LISTING_ID_1, { title: 'x'.repeat(201) }, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should return 400 for zero price', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await putListing(app, LISTING_ID_1, { price: 0 }, 'valid-token')
    expect(res.status).toBe(400)
  })

  it('should update only provided fields (partial update)', async () => {
    const updated = { ...mockListingDb, title: 'Updated Vase', images: [mockListingImage] }
    const prisma = createMockPrisma()
    ;(prisma.listing.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockListingDb)
    ;(prisma.listing.update as ReturnType<typeof vi.fn>).mockResolvedValue(updated)
    const app = createTestApp(prisma)

    const res = await putListing(app, LISTING_ID_1, { title: 'Updated Vase' }, 'valid-token')
    expect(res.status).toBe(200)

    const updateCall = (prisma.listing.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(updateCall.data.title).toBe('Updated Vase')
    // Should not include other fields that weren't sent
    expect(updateCall.data).not.toHaveProperty('description')
    expect(updateCall.data).not.toHaveProperty('medium')
  })

  it('should sanitize updated text fields', async () => {
    const updated = { ...mockListingDb, title: 'Clean Title', images: [mockListingImage] }
    const prisma = createMockPrisma()
    ;(prisma.listing.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockListingDb)
    ;(prisma.listing.update as ReturnType<typeof vi.fn>).mockResolvedValue(updated)
    const app = createTestApp(prisma)

    await putListing(app, LISTING_ID_1, {
      title: '<script>Clean</script> Title',
    }, 'valid-token')

    const updateCall = (prisma.listing.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(updateCall.data.title).not.toContain('<script>')
  })

  it('should return updated listing with images', async () => {
    const updated = { ...mockListingDb, title: 'Updated', images: [mockListingImage] }
    const prisma = createMockPrisma()
    ;(prisma.listing.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockListingDb)
    ;(prisma.listing.update as ReturnType<typeof vi.fn>).mockResolvedValue(updated)
    const app = createTestApp(prisma)

    const res = await putListing(app, LISTING_ID_1, { title: 'Updated' }, 'valid-token')
    const body = await res.json()

    expect(body).toHaveProperty('id')
    expect(body).toHaveProperty('images')
    expect(body).not.toHaveProperty('artistId')
  })

  it('should allow empty body (no-op update)', async () => {
    const updated = { ...mockListingDb, images: [mockListingImage] }
    const prisma = createMockPrisma()
    ;(prisma.listing.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockListingDb)
    ;(prisma.listing.update as ReturnType<typeof vi.fn>).mockResolvedValue(updated)
    const app = createTestApp(prisma)

    const res = await putListing(app, LISTING_ID_1, {}, 'valid-token')
    expect(res.status).toBe(200)
  })

  it('should clamp quantityRemaining when quantityTotal is lowered below it', async () => {
    const listingWithInventory = { ...mockListingDb, quantityTotal: 10, quantityRemaining: 8 }
    const updated = { ...listingWithInventory, quantityTotal: 5, quantityRemaining: 5, images: [mockListingImage] }
    const prisma = createMockPrisma()
    ;(prisma.listing.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(listingWithInventory)
    ;(prisma.listing.update as ReturnType<typeof vi.fn>).mockResolvedValue(updated)
    const app = createTestApp(prisma)

    const res = await putListing(app, LISTING_ID_1, { quantityTotal: 5 }, 'valid-token')
    expect(res.status).toBe(200)

    const updateCall = (prisma.listing.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(updateCall.data.quantityTotal).toBe(5)
    expect(updateCall.data.quantityRemaining).toBe(5)
  })

  it('should not clamp quantityRemaining when quantityTotal is raised', async () => {
    const listingWithInventory = { ...mockListingDb, quantityTotal: 5, quantityRemaining: 3 }
    const updated = { ...listingWithInventory, quantityTotal: 10, images: [mockListingImage] }
    const prisma = createMockPrisma()
    ;(prisma.listing.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(listingWithInventory)
    ;(prisma.listing.update as ReturnType<typeof vi.fn>).mockResolvedValue(updated)
    const app = createTestApp(prisma)

    const res = await putListing(app, LISTING_ID_1, { quantityTotal: 10 }, 'valid-token')
    expect(res.status).toBe(200)

    const updateCall = (prisma.listing.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(updateCall.data.quantityTotal).toBe(10)
    expect(updateCall.data).not.toHaveProperty('quantityRemaining')
  })
})

// ─── DELETE /me/listings/:id ──────────────────────────────────────────

describe('DELETE /me/listings/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVerifier(createMockVerifier() as never)
  })

  afterEach(() => {
    resetVerifier()
  })

  it('should return 401 without auth token', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await deleteListing(app, LISTING_ID_1)
    expect(res.status).toBe(401)
  })

  it('should return 403 for buyer-only role', async () => {
    const prisma = createMockPrisma({ roles: ['buyer'] })
    const app = createTestApp(prisma)

    const res = await deleteListing(app, LISTING_ID_1, 'valid-token')
    expect(res.status).toBe(403)
  })

  it('should return 404 when artist profile does not exist', async () => {
    const prisma = createMockPrisma({ artistProfile: null })
    const app = createTestApp(prisma)

    const res = await deleteListing(app, LISTING_ID_1, 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should return 404 when listing does not exist', async () => {
    const prisma = createMockPrisma()
    ;(prisma.listing.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const app = createTestApp(prisma)

    const res = await deleteListing(app, '99999999-9999-4999-8999-999999999999', 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should return 403 when listing belongs to another artist', async () => {
    const otherListing = { ...mockListingDb, artistId: 'other-artist-uuid' }
    const prisma = createMockPrisma()
    ;(prisma.listing.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(otherListing)
    const app = createTestApp(prisma)

    const res = await deleteListing(app, LISTING_ID_1, 'valid-token')
    expect(res.status).toBe(403)
  })

  it('should return 409 when listing has orders', async () => {
    const prisma = createMockPrisma({ orderCount: 2 })
    ;(prisma.listing.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockListingDb)
    const app = createTestApp(prisma)

    const res = await deleteListing(app, LISTING_ID_1, 'valid-token')
    expect(res.status).toBe(409)

    const body = await res.json()
    expect(body.error.code).toBe('CONFLICT')
  })

  it('should delete the listing and return 204', async () => {
    const prisma = createMockPrisma({ orderCount: 0 })
    ;(prisma.listing.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockListingDb)
    const app = createTestApp(prisma)

    const res = await deleteListing(app, LISTING_ID_1, 'valid-token')
    expect(res.status).toBe(204)

    expect(prisma.listing.delete).toHaveBeenCalledWith({
      where: { id: LISTING_ID_1 },
    })
  })

  it('should allow delete when listing has zero orders', async () => {
    const prisma = createMockPrisma({ orderCount: 0 })
    ;(prisma.listing.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockListingDb)
    const app = createTestApp(prisma)

    const res = await deleteListing(app, LISTING_ID_1, 'valid-token')
    expect(res.status).toBe(204)
  })
})
