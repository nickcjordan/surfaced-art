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

// ─── Test helpers ────────────────────────────────────────────────────

function createMockVerifier(sub = 'cognito-admin', email = 'admin@surfacedart.com', name = 'Admin User') {
  return {
    verify: vi.fn().mockResolvedValue({ sub, email, name }),
  }
}

const ADMIN_USER_ID = '00000000-0000-4000-8000-000000000001'
const OTHER_ADMIN_ID = '00000000-0000-4000-8000-000000000002'
const TARGET_USER_ID = '00000000-0000-4000-8000-000000000003'

const mockAdminUser = {
  id: ADMIN_USER_ID,
  cognitoId: 'cognito-admin',
  email: 'admin@surfacedart.com',
  fullName: 'Admin User',
  roles: [{ role: 'admin' }],
}

const mockAuditLogs = [
  {
    id: '00000000-0000-4000-8000-000000000010',
    adminId: ADMIN_USER_ID,
    action: 'role_grant',
    targetType: 'user',
    targetId: TARGET_USER_ID,
    details: { role: 'artist' },
    ipAddress: null,
    createdAt: new Date('2025-03-01T10:00:00Z'),
    admin: { fullName: 'Admin User' },
  },
  {
    id: '00000000-0000-4000-8000-000000000011',
    adminId: OTHER_ADMIN_ID,
    action: 'artist_suspend',
    targetType: 'artist',
    targetId: '00000000-0000-4000-8000-000000000020',
    details: { reason: 'TOS violation' },
    ipAddress: '192.168.1.1',
    createdAt: new Date('2025-03-02T14:00:00Z'),
    admin: { fullName: 'Other Admin' },
  },
]

function createMockPrisma(overrides?: {
  adminRoles?: string[]
  auditLogs?: unknown[]
  auditLogCount?: number
}) {
  const adminRoles = overrides?.adminRoles ?? ['admin']
  const auditLogs = overrides?.auditLogs ?? mockAuditLogs
  const auditLogCount = overrides?.auditLogCount ?? auditLogs.length

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
      findMany: vi.fn().mockResolvedValue(auditLogs),
      count: vi.fn().mockResolvedValue(auditLogCount),
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
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      findUnique: vi.fn().mockResolvedValue(null),
      delete: vi.fn(),
    },
  } as unknown as PrismaClient
}

function createTestApp(prisma: PrismaClient) {
  const app = new Hono()
  app.route('/admin', createAdminRoutes(prisma))
  return app
}

describe('Admin Audit Log Endpoints', () => {
  afterEach(() => {
    resetVerifier()
  })

  // ─── Auth ──────────────────────────────────────────────────

  it('should return 401 without auth token', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)
    const res = await app.request('/admin/audit-log')
    expect(res.status).toBe(401)
  })

  it('should return 403 for non-admin users', async () => {
    setVerifier(createMockVerifier())
    const prisma = createMockPrisma({ adminRoles: ['buyer'] })
    const app = createTestApp(prisma)
    const res = await app.request('/admin/audit-log', {
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.status).toBe(403)
  })

  // ─── GET /admin/audit-log ──────────────────────────────────

  it('should return paginated audit log entries', async () => {
    setVerifier(createMockVerifier())
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await app.request('/admin/audit-log', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(2)
    expect(body.meta).toHaveProperty('page', 1)
    expect(body.meta).toHaveProperty('total', 2)
    expect(body.meta).toHaveProperty('totalPages', 1)
  })

  it('should include admin fullName in each entry', async () => {
    setVerifier(createMockVerifier())
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await app.request('/admin/audit-log', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    const body = await res.json()
    expect(body.data[0].adminName).toBe('Admin User')
    expect(body.data[1].adminName).toBe('Other Admin')
  })

  it('should filter by adminId', async () => {
    setVerifier(createMockVerifier())
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    await app.request(`/admin/audit-log?adminId=${ADMIN_USER_ID}`, {
      headers: { Authorization: 'Bearer valid-token' },
    })

    const whereArg = (prisma.adminAuditLog.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0]?.where
    expect(whereArg.adminId).toBe(ADMIN_USER_ID)
  })

  it('should filter by targetType and targetId', async () => {
    setVerifier(createMockVerifier())
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    await app.request(`/admin/audit-log?targetType=user&targetId=${TARGET_USER_ID}`, {
      headers: { Authorization: 'Bearer valid-token' },
    })

    const whereArg = (prisma.adminAuditLog.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0]?.where
    expect(whereArg.targetType).toBe('user')
    expect(whereArg.targetId).toBe(TARGET_USER_ID)
  })

  it('should filter by action', async () => {
    setVerifier(createMockVerifier())
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    await app.request('/admin/audit-log?action=role_grant', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    const whereArg = (prisma.adminAuditLog.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0]?.where
    expect(whereArg.action).toBe('role_grant')
  })

  it('should filter by date range', async () => {
    setVerifier(createMockVerifier())
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const dateFrom = '2025-03-01T00:00:00Z'
    const dateTo = '2025-03-03T00:00:00Z'
    await app.request(`/admin/audit-log?dateFrom=${dateFrom}&dateTo=${dateTo}`, {
      headers: { Authorization: 'Bearer valid-token' },
    })

    const whereArg = (prisma.adminAuditLog.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0]?.where
    expect(whereArg.createdAt).toBeDefined()
    expect(whereArg.createdAt.gte).toEqual(new Date(dateFrom))
    expect(whereArg.createdAt.lte).toEqual(new Date(dateTo))
  })

  it('should respect pagination params', async () => {
    setVerifier(createMockVerifier())
    const prisma = createMockPrisma({ auditLogCount: 50 })
    const app = createTestApp(prisma)

    await app.request('/admin/audit-log?page=2&limit=10', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    const findManyArgs = (prisma.adminAuditLog.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(findManyArgs.skip).toBe(10) // (2-1) * 10
    expect(findManyArgs.take).toBe(10)
  })

  it('should return details as-is from JSONB', async () => {
    setVerifier(createMockVerifier())
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await app.request('/admin/audit-log', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    const body = await res.json()
    expect(body.data[0].details).toEqual({ role: 'artist' })
    expect(body.data[1].details).toEqual({ reason: 'TOS violation' })
  })

  // ─── GET /admin/audit-log/user/:userId ─────────────────────

  it('should return audit logs filtered by userId as targetId', async () => {
    setVerifier(createMockVerifier())
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    await app.request(`/admin/audit-log/user/${TARGET_USER_ID}`, {
      headers: { Authorization: 'Bearer valid-token' },
    })

    const whereArg = (prisma.adminAuditLog.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0]?.where
    expect(whereArg.targetId).toBe(TARGET_USER_ID)
  })

  it('should return paginated response for user audit log', async () => {
    setVerifier(createMockVerifier())
    const prisma = createMockPrisma({ auditLogs: [mockAuditLogs[0]], auditLogCount: 1 })
    const app = createTestApp(prisma)

    const res = await app.request(`/admin/audit-log/user/${TARGET_USER_ID}`, {
      headers: { Authorization: 'Bearer valid-token' },
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.meta).toHaveProperty('total', 1)
  })
})
