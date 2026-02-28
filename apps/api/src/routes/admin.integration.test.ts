import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import type { PrismaClient } from '@surfaced-art/db'
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupDatabase,
} from '@surfaced-art/db/test-helpers'
import { createTestApp } from '../test-helpers/create-test-app.js'
import { setVerifier, resetVerifier } from '../middleware/auth.js'
import type { Hono } from 'hono'

// Mock email module to avoid real SES calls
vi.mock('@surfaced-art/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'test-msg' }),
  ArtistAcceptance: vi.fn(() => null),
  ArtistRejection: vi.fn(() => null),
}))

const ADMIN_COGNITO_ID = 'cognito-admin-integration'
const ARTIST_COGNITO_ID = 'cognito-artist-integration'
const ADMIN_EMAIL = 'admin@surfacedart.com'
const ARTIST_EMAIL = 'artist@integration-test.com'

describe('Admin routes — integration', () => {
  let prisma: PrismaClient
  let app: Hono
  let adminUserId: string
  let artistUserId: string

  beforeAll(async () => {
    prisma = await setupTestDatabase()
    app = createTestApp(prisma)
  })

  afterAll(async () => {
    resetVerifier()
    await teardownTestDatabase()
  })

  beforeEach(async () => {
    await cleanupDatabase(prisma)
    vi.clearAllMocks()

    // Create admin user with admin role
    const adminUser = await prisma.user.create({
      data: {
        cognitoId: ADMIN_COGNITO_ID,
        email: ADMIN_EMAIL,
        fullName: 'Admin User',
        roles: { create: [{ role: 'admin' }, { role: 'buyer' }] },
      },
    })
    adminUserId = adminUser.id

    // Create target user with buyer role
    const targetUser = await prisma.user.create({
      data: {
        cognitoId: ARTIST_COGNITO_ID,
        email: ARTIST_EMAIL,
        fullName: 'Jane Artist',
        roles: { create: { role: 'buyer' } },
      },
    })
    artistUserId = targetUser.id

    // Create pending application for the target user
    await prisma.artistApplication.create({
      data: {
        email: ARTIST_EMAIL,
        fullName: 'Jane Artist',
        statement: 'I create unique ceramics inspired by nature and urban landscapes.',
        categories: ['ceramics'],
        status: 'pending',
      },
    })

    // Set verifier to mock JWT — returns the admin user identity
    setVerifier({
      verify: vi.fn().mockResolvedValue({
        sub: ADMIN_COGNITO_ID,
        email: ADMIN_EMAIL,
        name: 'Admin User',
      }),
    } as never)
  })

  describe('POST /admin/artists/:userId/approve', () => {
    it('should create artist profile and role in a transaction', async () => {
      const res = await app.request(`/admin/artists/${artistUserId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({ reviewNotes: 'Excellent portfolio' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.message).toContain('approved')
      expect(body.profile.displayName).toBe('Jane Artist')
      expect(body.profile.slug).toBe('jane-artist')

      // Verify application status was updated
      const application = await prisma.artistApplication.findFirst({
        where: { email: ARTIST_EMAIL },
      })
      expect(application?.status).toBe('approved')
      expect(application?.reviewedBy).toBe(adminUserId)
      expect(application?.reviewNotes).toBe('Excellent portfolio')

      // Verify artist profile was created
      const profile = await prisma.artistProfile.findUnique({
        where: { userId: artistUserId },
      })
      expect(profile).not.toBeNull()
      expect(profile?.displayName).toBe('Jane Artist')
      expect(profile?.slug).toBe('jane-artist')
      expect(profile?.bio).toBe('I create unique ceramics inspired by nature and urban landscapes.')

      // Verify artist role was granted
      const artistRole = await prisma.userRole.findFirst({
        where: { userId: artistUserId, role: 'artist' },
      })
      expect(artistRole).not.toBeNull()
      expect(artistRole?.grantedBy).toBe(adminUserId)
    })

    it('should generate unique slug when duplicate exists', async () => {
      // Pre-create a profile with slug "jane-artist"
      const otherUser = await prisma.user.create({
        data: {
          cognitoId: 'cognito-other',
          email: 'other@example.com',
          fullName: 'Other User',
        },
      })
      await prisma.artistProfile.create({
        data: {
          userId: otherUser.id,
          displayName: 'Jane Artist',
          slug: 'jane-artist',
          bio: 'Existing artist',
          location: 'NYC',
          originZip: '10001',
        },
      })

      const res = await app.request(`/admin/artists/${artistUserId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({}),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      // Should have a suffixed slug since "jane-artist" is taken
      expect(body.profile.slug).toBe('jane-artist-2')
    })

    it('should return 409 if user already has artist role', async () => {
      // Grant artist role first
      await prisma.userRole.create({
        data: { userId: artistUserId, role: 'artist', grantedBy: adminUserId },
      })

      const res = await app.request(`/admin/artists/${artistUserId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({}),
      })

      expect(res.status).toBe(409)
    })

    it('should return 404 if no pending application', async () => {
      // Remove the pending application
      await prisma.artistApplication.deleteMany({ where: { email: ARTIST_EMAIL } })

      const res = await app.request(`/admin/artists/${artistUserId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({}),
      })

      expect(res.status).toBe(404)
    })
  })

  describe('POST /admin/artists/:userId/reject', () => {
    it('should update application status to rejected', async () => {
      const res = await app.request(`/admin/artists/${artistUserId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({ reviewNotes: 'Not a fit at this time' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.message).toContain('rejected')

      // Verify application was rejected
      const application = await prisma.artistApplication.findFirst({
        where: { email: ARTIST_EMAIL },
      })
      expect(application?.status).toBe('rejected')
      expect(application?.reviewedBy).toBe(adminUserId)
      expect(application?.reviewNotes).toBe('Not a fit at this time')
    })

    it('should not create artist profile on rejection', async () => {
      await app.request(`/admin/artists/${artistUserId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({}),
      })

      const profile = await prisma.artistProfile.findUnique({
        where: { userId: artistUserId },
      })
      expect(profile).toBeNull()
    })

    it('should return 404 if application already rejected', async () => {
      // First rejection
      await app.request(`/admin/artists/${artistUserId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({}),
      })

      // Second rejection attempt
      const res = await app.request(`/admin/artists/${artistUserId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({}),
      })

      // Should fail because application is now 'rejected', not 'pending'
      expect(res.status).toBe(404)
    })
  })
})
