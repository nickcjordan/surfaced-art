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
const TARGET_USER_ID = 'target-uuid-456'

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
  email: 'buyer@example.com',
  fullName: 'Target Buyer',
  avatarUrl: null,
  roles: [{ role: 'buyer', grantedAt: new Date('2025-01-01'), grantedBy: null }],
  createdAt: new Date('2025-01-01'),
  lastActiveAt: new Date('2025-02-01'),
  artistProfile: null,
  _count: { ordersAsBuyer: 3, reviewsAsBuyer: 1, saves: 5, follows: 2 },
}

function createMockPrisma(overrides?: {
  adminRoles?: string[]
  users?: unknown[]
  userCount?: number
  targetUser?: unknown
  existingRole?: unknown
  createdRole?: unknown
  deletedRole?: unknown
}) {
  const adminRoles = overrides?.adminRoles ?? ['admin']
  const users = overrides?.users ?? [mockTargetUser]
  const userCount = overrides?.userCount ?? users.length

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
      findMany: vi.fn().mockResolvedValue(users),
      count: vi.fn().mockResolvedValue(userCount),
    },
    userRole: {
      findUnique: vi.fn().mockResolvedValue(overrides?.existingRole ?? null),
      create: vi.fn().mockResolvedValue(
        overrides?.createdRole ?? {
          id: 'role-uuid-new',
          userId: TARGET_USER_ID,
          role: 'artist',
          grantedAt: new Date('2025-03-01'),
          grantedBy: ADMIN_USER_ID,
        },
      ),
      delete: vi.fn().mockResolvedValue(overrides?.deletedRole ?? { id: 'role-uuid-1' }),
      findMany: vi.fn().mockResolvedValue([]),
    },
    artistApplication: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
      update: vi.fn().mockResolvedValue({}),
    },
    artistProfile: {
      findUnique: vi.fn().mockResolvedValue(null),
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

function getUsers(app: ReturnType<typeof createTestApp>, query = '', env?: Record<string, unknown>) {
  return app.request(`/admin/users${query ? `?${query}` : ''}`, {}, env)
}

function getUserDetail(app: ReturnType<typeof createTestApp>, id: string, env?: Record<string, unknown>) {
  return app.request(`/admin/users/${id}`, {}, env)
}

function grantRole(app: ReturnType<typeof createTestApp>, id: string, body: Record<string, unknown>, env?: Record<string, unknown>) {
  return app.request(`/admin/users/${id}/roles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, env)
}

function revokeRole(app: ReturnType<typeof createTestApp>, id: string, role: string, env?: Record<string, unknown>) {
  return app.request(`/admin/users/${id}/roles/${role}`, {
    method: 'DELETE',
  }, env)
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('GET /admin/users', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 without auth token', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await getUsers(app)
    expect(res.status).toBe(401)
  })

  it('should return 403 without admin role', async () => {
    const prisma = createMockPrisma({ adminRoles: ['buyer'] })
    const app = createTestApp(prisma)
    const res = await getUsers(app, '', createAuthEnv())
    expect(res.status).toBe(403)
  })

  it('should return paginated user list', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await getUsers(app, '', createAuthEnv())
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 })
  })

  it('should include user roles and hasArtistProfile', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await getUsers(app, '', createAuthEnv())
    const body = await res.json()

    expect(body.data[0].roles).toEqual(['buyer'])
    expect(body.data[0].hasArtistProfile).toBe(false)
  })

  it('should filter by role', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    await getUsers(app, 'role=artist', createAuthEnv())

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          roles: { some: { role: 'artist' } },
        }),
      }),
    )
  })

  it('should filter by search on fullName and email', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    await getUsers(app, 'search=buyer', createAuthEnv())

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { fullName: { contains: 'buyer', mode: 'insensitive' } },
            { email: { contains: 'buyer', mode: 'insensitive' } },
          ],
        }),
      }),
    )
  })
})

describe('GET /admin/users/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 404 when user not found', async () => {
    const prisma = createMockPrisma({ targetUser: null })
    const app = createTestApp(prisma)
    const res = await getUserDetail(app, TARGET_USER_ID, createAuthEnv())
    expect(res.status).toBe(404)
  })

  it('should return full user detail with stats', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await getUserDetail(app, TARGET_USER_ID, createAuthEnv())
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.id).toBe(TARGET_USER_ID)
    expect(body.email).toBe('buyer@example.com')
    expect(body.fullName).toBe('Target Buyer')
    expect(body.roles).toEqual([
      expect.objectContaining({ role: 'buyer' }),
    ])
    expect(body.stats).toEqual({
      orderCount: 3,
      reviewCount: 1,
      saveCount: 5,
      followCount: 2,
    })
    expect(body.artistProfile).toBeNull()
  })
})

describe('POST /admin/users/:id/roles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 404 when user not found', async () => {
    const prisma = createMockPrisma({ targetUser: null })
    const app = createTestApp(prisma)
    const res = await grantRole(app, TARGET_USER_ID, { role: 'artist' }, createAuthEnv())
    expect(res.status).toBe(404)
  })

  it('should return 400 for invalid role', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await grantRole(app, TARGET_USER_ID, { role: 'superadmin' }, createAuthEnv())
    expect(res.status).toBe(400)
  })

  it('should return 403 when admin tries to self-grant admin', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await grantRole(app, ADMIN_USER_ID, { role: 'admin' }, createAuthEnv())
    expect(res.status).toBe(403)

    const body = await res.json()
    expect(body.error.code).toBe('FORBIDDEN')
  })

  it('should return 409 when role already exists', async () => {
    const prisma = createMockPrisma({
      existingRole: { id: 'role-1', userId: TARGET_USER_ID, role: 'artist' },
    })
    const app = createTestApp(prisma)
    const res = await grantRole(app, TARGET_USER_ID, { role: 'artist' }, createAuthEnv())
    expect(res.status).toBe(409)
  })

  it('should grant role successfully', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await grantRole(app, TARGET_USER_ID, { role: 'artist' }, createAuthEnv())
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.message).toContain('granted')
    expect(body.role.userId).toBe(TARGET_USER_ID)
    expect(body.role.role).toBe('artist')
    expect(body.role.grantedBy).toBe(ADMIN_USER_ID)
  })

  it('should write audit log on role grant', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    await grantRole(app, TARGET_USER_ID, { role: 'artist' }, createAuthEnv())

    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          adminId: ADMIN_USER_ID,
          action: 'role_grant',
          targetType: 'user',
          targetId: TARGET_USER_ID,
        }),
      }),
    )
  })
})

describe('DELETE /admin/users/:id/roles/:role', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 404 when user not found', async () => {
    const prisma = createMockPrisma({ targetUser: null })
    const app = createTestApp(prisma)
    const res = await revokeRole(app, TARGET_USER_ID, 'artist', createAuthEnv())
    expect(res.status).toBe(404)
  })

  it('should return 403 when admin tries to remove own admin role', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await revokeRole(app, ADMIN_USER_ID, 'admin', createAuthEnv())
    expect(res.status).toBe(403)

    const body = await res.json()
    expect(body.error.code).toBe('FORBIDDEN')
  })

  it('should return 404 when role not found on user', async () => {
    const prisma = createMockPrisma({ existingRole: null })
    const app = createTestApp(prisma)
    const res = await revokeRole(app, TARGET_USER_ID, 'artist', createAuthEnv())
    expect(res.status).toBe(404)
  })

  it('should revoke role successfully', async () => {
    const prisma = createMockPrisma({
      existingRole: { id: 'role-1', userId: TARGET_USER_ID, role: 'artist' },
    })
    const app = createTestApp(prisma)
    const res = await revokeRole(app, TARGET_USER_ID, 'artist', createAuthEnv())
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.message).toContain('revoked')
  })

  it('should write audit log on role revoke', async () => {
    const prisma = createMockPrisma({
      existingRole: { id: 'role-1', userId: TARGET_USER_ID, role: 'artist' },
    })
    const app = createTestApp(prisma)
    await revokeRole(app, TARGET_USER_ID, 'artist', createAuthEnv())

    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          adminId: ADMIN_USER_ID,
          action: 'role_revoke',
          targetType: 'user',
          targetId: TARGET_USER_ID,
        }),
      }),
    )
  })
})
