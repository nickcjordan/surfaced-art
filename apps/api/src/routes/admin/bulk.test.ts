import { describe, it, expect, vi, afterEach } from 'vitest'
import { Hono } from 'hono'
import { createAdminRoutes } from './index'
import { setVerifier, resetVerifier } from '../../middleware/auth'
import type { PrismaClient } from '@surfaced-art/db'

// Mock email module
vi.mock('@surfaced-art/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'msg-123' }),
  ArtistAcceptance: vi.fn(() => null),
  ArtistRejection: vi.fn(() => null),
}))

// Mock audit module
vi.mock('../../lib/audit', () => ({
  logAdminAction: vi.fn(),
}))

// Mock revalidation module
vi.mock('../../lib/revalidation', () => ({
  triggerRevalidation: vi.fn(),
}))

// ─── Test helpers ────────────────────────────────────────────────────

function createMockVerifier(sub = 'cognito-admin', email = 'admin@surfacedart.com', name = 'Admin User') {
  return {
    verify: vi.fn().mockResolvedValue({ sub, email, name }),
  }
}

const ADMIN_USER_ID = '00000000-0000-4000-8000-000000000001'
const LISTING_ID_1 = '00000000-0000-4000-8000-000000000050'
const LISTING_ID_2 = '00000000-0000-4000-8000-000000000051'
const LISTING_ID_3 = '00000000-0000-4000-8000-000000000052'
const USER_ID_1 = '00000000-0000-4000-8000-000000000060'
const USER_ID_2 = '00000000-0000-4000-8000-000000000061'
const USER_ID_3 = '00000000-0000-4000-8000-000000000062'

const mockAdminUser = {
  id: ADMIN_USER_ID,
  cognitoId: 'cognito-admin',
  email: 'admin@surfacedart.com',
  fullName: 'Admin User',
  roles: [{ role: 'admin' }],
}

function createMockPrisma(overrides?: {
  adminRoles?: string[]
  listingsFound?: { id: string; category: string; artist: { slug: string } }[]
  usersFound?: { id: string }[]
  existingRoles?: { userId: string; role: string }[]
  txUpdateCount?: number
}) {
  const adminRoles = overrides?.adminRoles ?? ['admin']
  const listingsFound = overrides?.listingsFound ?? [
    { id: LISTING_ID_1, category: 'ceramics', artist: { slug: 'artist-1' } },
    { id: LISTING_ID_2, category: 'drawing_painting', artist: { slug: 'artist-2' } },
  ]
  const usersFound = overrides?.usersFound ?? [
    { id: USER_ID_1 },
    { id: USER_ID_2 },
  ]
  const existingRoles = overrides?.existingRoles ?? []

  // Build a mock $transaction that executes the callback
  const mockTx = {
    listing: {
      updateMany: vi.fn().mockResolvedValue({ count: overrides?.txUpdateCount ?? listingsFound.length }),
    },
  }

  return {
    user: {
      findUnique: vi.fn().mockResolvedValue({
        ...mockAdminUser,
        roles: adminRoles.map((r) => ({ role: r })),
      }),
      findMany: vi.fn().mockResolvedValue(usersFound),
    },
    userRole: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue(existingRoles),
      create: vi.fn(),
      createMany: vi.fn(),
      delete: vi.fn(),
    },
    adminAuditLog: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn(),
      createMany: vi.fn(),
    },
    artistApplication: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    artistProfile: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    listing: {
      findMany: vi.fn().mockResolvedValue(listingsFound),
      count: vi.fn().mockResolvedValue(0),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    waitlist: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      findUnique: vi.fn().mockResolvedValue(null),
      delete: vi.fn(),
    },
    $transaction: vi.fn().mockImplementation(async (cb: (tx: typeof mockTx) => Promise<unknown>) => {
      return cb(mockTx)
    }),
  } as unknown as PrismaClient
}

function createTestApp(prisma: PrismaClient) {
  const app = new Hono()
  app.route('/admin', createAdminRoutes(prisma))
  return app
}

describe('Admin Bulk Operations', () => {
  afterEach(() => {
    resetVerifier()
  })

  // ─── POST /admin/listings/bulk-status ──────────────────────

  describe('POST /admin/listings/bulk-status', () => {
    it('should return 401 without auth token', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)
      const res = await app.request('/admin/listings/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingIds: [LISTING_ID_1], status: 'hidden', reason: 'test' }),
      })
      expect(res.status).toBe(401)
    })

    it('should return 403 for non-admin users', async () => {
      setVerifier(createMockVerifier())
      const prisma = createMockPrisma({ adminRoles: ['buyer'] })
      const app = createTestApp(prisma)
      const res = await app.request('/admin/listings/bulk-status', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingIds: [LISTING_ID_1], status: 'hidden', reason: 'test' }),
      })
      expect(res.status).toBe(403)
    })

    it('should reject empty listingIds array', async () => {
      setVerifier(createMockVerifier())
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await app.request('/admin/listings/bulk-status', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingIds: [], status: 'hidden', reason: 'test' }),
      })

      expect(res.status).toBe(400)
    })

    it('should reject more than 100 IDs', async () => {
      setVerifier(createMockVerifier())
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const ids = Array.from({ length: 101 }, (_, i) =>
        `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
      )

      const res = await app.request('/admin/listings/bulk-status', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingIds: ids, status: 'hidden', reason: 'test' }),
      })

      expect(res.status).toBe(400)
    })

    it('should update listings in a transaction and return counts', async () => {
      setVerifier(createMockVerifier())
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await app.request('/admin/listings/bulk-status', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingIds: [LISTING_ID_1, LISTING_ID_2],
          status: 'hidden',
          reason: 'Inappropriate content',
        }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toHaveProperty('updated')
      expect(body).toHaveProperty('failed')
      expect(body.failed).toEqual([])
    })

    it('should report IDs not found in failed array', async () => {
      setVerifier(createMockVerifier())
      // Only LISTING_ID_1 exists, LISTING_ID_3 doesn't
      const prisma = createMockPrisma({
        listingsFound: [{ id: LISTING_ID_1, category: 'ceramics', artist: { slug: 'artist-1' } }],
        txUpdateCount: 1,
      })
      const app = createTestApp(prisma)

      const res = await app.request('/admin/listings/bulk-status', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingIds: [LISTING_ID_1, LISTING_ID_3],
          status: 'hidden',
          reason: 'test',
        }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.failed).toHaveLength(1)
      expect(body.failed[0].id).toBe(LISTING_ID_3)
      expect(body.failed[0].error).toContain('not found')
    })

    it('should audit log bulk status changes', async () => {
      const { logAdminAction } = await import('../../lib/audit')
      setVerifier(createMockVerifier())
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      await app.request('/admin/listings/bulk-status', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingIds: [LISTING_ID_1, LISTING_ID_2],
          status: 'hidden',
          reason: 'bulk hide test',
        }),
      })

      expect(logAdminAction).toHaveBeenCalledWith(
        prisma,
        expect.objectContaining({
          adminId: ADMIN_USER_ID,
          action: 'listing_bulk_status',
          targetType: 'listing',
        }),
      )
    })
  })

  // ─── POST /admin/users/bulk-role ───────────────────────────

  describe('POST /admin/users/bulk-role', () => {
    it('should return 401 without auth token', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)
      const res = await app.request('/admin/users/bulk-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: [USER_ID_1], role: 'artist' }),
      })
      expect(res.status).toBe(401)
    })

    it('should reject empty userIds array', async () => {
      setVerifier(createMockVerifier())
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await app.request('/admin/users/bulk-role', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: [], role: 'artist' }),
      })

      expect(res.status).toBe(400)
    })

    it('should grant roles and return counts', async () => {
      setVerifier(createMockVerifier())
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await app.request('/admin/users/bulk-role', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: [USER_ID_1, USER_ID_2], role: 'artist' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toHaveProperty('granted')
      expect(body).toHaveProperty('skipped')
      expect(body).toHaveProperty('failed')
    })

    it('should skip users who already have the role', async () => {
      setVerifier(createMockVerifier())
      const prisma = createMockPrisma({
        existingRoles: [{ userId: USER_ID_1, role: 'artist' }],
      })
      const app = createTestApp(prisma)

      const res = await app.request('/admin/users/bulk-role', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: [USER_ID_1, USER_ID_2], role: 'artist' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.skipped).toBeGreaterThanOrEqual(1)
    })

    it('should report users not found in failed array', async () => {
      setVerifier(createMockVerifier())
      // Only USER_ID_1 found, USER_ID_3 not
      const prisma = createMockPrisma({
        usersFound: [{ id: USER_ID_1 }],
      })
      const app = createTestApp(prisma)

      const res = await app.request('/admin/users/bulk-role', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: [USER_ID_1, USER_ID_3], role: 'artist' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.failed).toHaveLength(1)
      expect(body.failed[0].id).toBe(USER_ID_3)
      expect(body.failed[0].error).toContain('not found')
    })

    it('should audit log bulk role grants', async () => {
      const { logAdminAction } = await import('../../lib/audit')
      setVerifier(createMockVerifier())
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      await app.request('/admin/users/bulk-role', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: [USER_ID_1, USER_ID_2], role: 'artist' }),
      })

      expect(logAdminAction).toHaveBeenCalledWith(
        prisma,
        expect.objectContaining({
          adminId: ADMIN_USER_ID,
          action: 'user_bulk_role_grant',
          targetType: 'user',
        }),
      )
    })
  })
})
