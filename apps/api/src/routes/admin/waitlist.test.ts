import { describe, it, expect, vi } from 'vitest'
import { Hono } from 'hono'
import { createAdminRoutes } from './index'
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

const ADMIN_USER_ID = '00000000-0000-4000-8000-000000000001'

const mockAdminUser = {
  id: ADMIN_USER_ID,
  cognitoId: 'cognito-admin',
  email: 'admin@surfaced.art',
  fullName: 'Admin User',
  roles: [{ role: 'admin' }],
}

const mockWaitlistEntries = [
  {
    id: '00000000-0000-4000-8000-000000000030',
    email: 'user1@example.com',
    createdAt: new Date('2025-02-01T10:00:00Z'),
  },
  {
    id: '00000000-0000-4000-8000-000000000031',
    email: 'user2@example.com',
    createdAt: new Date('2025-02-15T14:00:00Z'),
  },
  {
    id: '00000000-0000-4000-8000-000000000032',
    email: 'spam@spam.com',
    createdAt: new Date('2025-03-01T08:00:00Z'),
  },
]

function createMockPrisma(overrides?: {
  adminRoles?: string[]
  waitlistEntries?: unknown[]
  waitlistCount?: number
  waitlistEntry?: unknown | null
}) {
  const adminRoles = overrides?.adminRoles ?? ['admin']
  const entries = overrides?.waitlistEntries ?? mockWaitlistEntries
  const count = overrides?.waitlistCount ?? entries.length

  return {
    user: {
      findUnique: vi.fn().mockResolvedValue({
        ...mockAdminUser,
        roles: adminRoles.map((r) => ({ role: r })),
      }),
    },
    userRole: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    adminAuditLog: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn(),
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
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    waitlist: {
      findMany: vi.fn().mockResolvedValue(entries),
      count: vi.fn().mockResolvedValue(count),
      findUnique: vi.fn().mockResolvedValue(overrides?.waitlistEntry !== undefined ? overrides.waitlistEntry : null),
      delete: vi.fn(),
    },
  } as unknown as PrismaClient
}

function createTestApp(prisma: PrismaClient) {
  const app = new Hono()
  app.route('/admin', createAdminRoutes(prisma))
  return app
}

const authEnv = createAuthEnv()

describe('Admin Waitlist Endpoints', () => {
  // ─── Auth ──────────────────────────────────────────────────

  it('should return 401 without auth token', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await app.request('/admin/waitlist')
    expect(res.status).toBe(401)
  })

  it('should return 403 for non-admin users', async () => {
    const prisma = createMockPrisma({ adminRoles: ['buyer'] })
    const app = createTestApp(prisma)
    const res = await app.request('/admin/waitlist', {}, authEnv)
    expect(res.status).toBe(403)
  })

  // ─── GET /admin/waitlist ───────────────────────────────────

  it('should return paginated waitlist entries', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await app.request('/admin/waitlist', {}, authEnv)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(3)
    expect(body.meta).toHaveProperty('page', 1)
    expect(body.meta).toHaveProperty('total', 3)
    expect(body.meta).toHaveProperty('totalPages', 1)
  })

  it('should return entries with correct fields', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await app.request('/admin/waitlist', {}, authEnv)

    const body = await res.json()
    expect(body.data[0]).toHaveProperty('id')
    expect(body.data[0]).toHaveProperty('email')
    expect(body.data[0]).toHaveProperty('createdAt')
  })

  it('should filter by search (email substring)', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    await app.request('/admin/waitlist?search=spam', {}, authEnv)

    const whereArg = (prisma.waitlist.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0]?.where
    expect(whereArg.email).toBeDefined()
    expect(whereArg.email.contains).toBe('spam')
    expect(whereArg.email.mode).toBe('insensitive')
  })

  it('should respect pagination params', async () => {
    const prisma = createMockPrisma({ waitlistCount: 50 })
    const app = createTestApp(prisma)

    await app.request('/admin/waitlist?page=3&limit=10', {}, authEnv)

    const findManyArgs = (prisma.waitlist.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(findManyArgs.skip).toBe(20) // (3-1) * 10
    expect(findManyArgs.take).toBe(10)
  })

  // ─── DELETE /admin/waitlist/:id ────────────────────────────

  it('should return 404 for non-existent entry', async () => {
    const prisma = createMockPrisma({ waitlistEntry: null })
    const app = createTestApp(prisma)

    const res = await app.request('/admin/waitlist/00000000-0000-0000-0000-000000000000', {
      method: 'DELETE',
    }, authEnv)

    expect(res.status).toBe(404)
  })

  it('should delete a waitlist entry and return success', async () => {
    const entry = mockWaitlistEntries[2]
    const prisma = createMockPrisma({ waitlistEntry: entry })
    const app = createTestApp(prisma)

    const res = await app.request(`/admin/waitlist/${entry.id}`, {
      method: 'DELETE',
    }, authEnv)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toContain('deleted')

    // Verify delete was called
    expect(prisma.waitlist.delete).toHaveBeenCalledWith({
      where: { id: entry.id },
    })
  })

  it('should audit log waitlist deletion', async () => {
    const { logAdminAction } = await import('../../lib/audit')
    const entry = mockWaitlistEntries[2]
    const prisma = createMockPrisma({ waitlistEntry: entry })
    const app = createTestApp(prisma)

    await app.request(`/admin/waitlist/${entry.id}`, {
      method: 'DELETE',
    }, authEnv)

    expect(logAdminAction).toHaveBeenCalledWith(
      prisma,
      expect.objectContaining({
        adminId: ADMIN_USER_ID,
        action: 'waitlist_delete',
        targetType: 'waitlist',
        targetId: entry.id,
      }),
    )
  })
})
