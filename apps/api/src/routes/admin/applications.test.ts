import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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

const ADMIN_USER_ID = 'admin-uuid-123'
const REVIEWER_USER_ID = 'reviewer-uuid-456'

const mockAdminUser = {
  id: ADMIN_USER_ID,
  cognitoId: 'cognito-admin',
  email: 'admin@surfacedart.com',
  fullName: 'Admin User',
  roles: [{ role: 'admin' }],
}

const mockApplications = [
  {
    id: 'app-uuid-1',
    email: 'artist1@example.com',
    fullName: 'Jane Artist',
    instagramUrl: 'https://instagram.com/janeart',
    websiteUrl: 'https://janeart.com',
    statement: 'I create beautiful ceramics that tell stories.',
    exhibitionHistory: 'Gallery X 2023, Museum Y 2022',
    categories: ['ceramics', 'mixed_media_3d'],
    status: 'pending',
    reviewedBy: null,
    reviewedAt: null,
    reviewNotes: null,
    submittedAt: new Date('2025-01-15T10:00:00Z'),
    updatedAt: new Date('2025-01-15T10:00:00Z'),
  },
  {
    id: 'app-uuid-2',
    email: 'artist2@example.com',
    fullName: 'Bob Painter',
    instagramUrl: null,
    websiteUrl: null,
    statement: 'Bold abstract paintings exploring emotion through color.',
    exhibitionHistory: null,
    categories: ['drawing_painting'],
    status: 'approved',
    reviewedBy: REVIEWER_USER_ID,
    reviewedAt: new Date('2025-01-20T14:00:00Z'),
    reviewNotes: 'Strong portfolio',
    submittedAt: new Date('2025-01-10T08:00:00Z'),
    updatedAt: new Date('2025-01-20T14:00:00Z'),
  },
]

const mockReviewer = {
  id: REVIEWER_USER_ID,
  fullName: 'Reviewer Admin',
}

function createMockPrisma(overrides?: {
  adminRoles?: string[]
  applications?: unknown[]
  applicationDetail?: unknown
  applicationCount?: number
  reviewer?: unknown
}) {
  const adminRoles = overrides?.adminRoles ?? ['admin']
  const applications = overrides?.applications ?? mockApplications
  const applicationCount = overrides?.applicationCount ?? applications.length

  const userFindUnique = vi.fn().mockImplementation(({ where }: { where: { cognitoId?: string; id?: string } }) => {
    if (where.cognitoId === 'cognito-admin') {
      return Promise.resolve({ ...mockAdminUser, roles: adminRoles.map((r) => ({ role: r })) })
    }
    if (where.id === REVIEWER_USER_ID) {
      return Promise.resolve(overrides?.reviewer ?? mockReviewer)
    }
    return Promise.resolve(null)
  })

  return {
    user: {
      findUnique: userFindUnique,
    },
    artistApplication: {
      findMany: vi.fn().mockResolvedValue(applications),
      findFirst: vi.fn().mockResolvedValue(overrides?.applicationDetail ?? null),
      findUnique: vi.fn().mockResolvedValue(overrides?.applicationDetail ?? null),
      count: vi.fn().mockResolvedValue(applicationCount),
      update: vi.fn().mockResolvedValue({}),
    },
    artistProfile: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
    userRole: {
      create: vi.fn().mockResolvedValue({}),
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

function getApplications(app: ReturnType<typeof createTestApp>, query = '', token?: string) {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request(`/admin/applications${query ? `?${query}` : ''}`, { headers })
}

function getApplicationDetail(app: ReturnType<typeof createTestApp>, id: string, token?: string) {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request(`/admin/applications/${id}`, { headers })
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('GET /admin/applications', () => {
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

    const res = await getApplications(app)
    expect(res.status).toBe(401)
  })

  it('should return 403 without admin role', async () => {
    const prisma = createMockPrisma({ adminRoles: ['buyer'] })
    const app = createTestApp(prisma)

    const res = await getApplications(app, '', 'valid-token')
    expect(res.status).toBe(403)
  })

  it('should return paginated applications', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await getApplications(app, '', 'valid-token')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(2)
    expect(body.meta).toEqual({
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
    })
  })

  it('should include reviewer name when application was reviewed', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await getApplications(app, '', 'valid-token')
    const body = await res.json()

    const pending = body.data.find((a: { id: string }) => a.id === 'app-uuid-1')
    expect(pending.reviewerName).toBeNull()

    const approved = body.data.find((a: { id: string }) => a.id === 'app-uuid-2')
    expect(approved.reviewerName).toBe('Reviewer Admin')
  })

  it('should filter by status', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    await getApplications(app, 'status=pending', 'valid-token')

    expect(prisma.artistApplication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'pending' }),
      }),
    )
  })

  it('should filter by search term on fullName and email', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    await getApplications(app, 'search=jane', 'valid-token')

    expect(prisma.artistApplication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { fullName: { contains: 'jane', mode: 'insensitive' } },
            { email: { contains: 'jane', mode: 'insensitive' } },
          ],
        }),
      }),
    )
  })

  it('should respect pagination params', async () => {
    const prisma = createMockPrisma({ applicationCount: 50 })
    const app = createTestApp(prisma)

    await getApplications(app, 'page=2&limit=10', 'valid-token')

    expect(prisma.artistApplication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      }),
    )
  })

  it('should return validation error for invalid status', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await getApplications(app, 'status=invalid', 'valid-token')
    expect(res.status).toBe(400)
  })
})

describe('GET /admin/applications/:id', () => {
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

    const res = await getApplicationDetail(app, 'app-uuid-1')
    expect(res.status).toBe(401)
  })

  it('should return 404 when application not found', async () => {
    const prisma = createMockPrisma({ applicationDetail: null })
    const app = createTestApp(prisma)

    const res = await getApplicationDetail(app, 'nonexistent-uuid', 'valid-token')
    expect(res.status).toBe(404)
  })

  it('should return full application detail', async () => {
    const detail = {
      ...mockApplications[0],
    }
    const prisma = createMockPrisma({ applicationDetail: detail })
    const app = createTestApp(prisma)

    const res = await getApplicationDetail(app, 'app-uuid-1', 'valid-token')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.id).toBe('app-uuid-1')
    expect(body.email).toBe('artist1@example.com')
    expect(body.fullName).toBe('Jane Artist')
    expect(body.statement).toBeDefined()
    expect(body.categories).toEqual(['ceramics', 'mixed_media_3d'])
    expect(body.reviewerName).toBeNull()
  })

  it('should include reviewer name when reviewed', async () => {
    const detail = {
      ...mockApplications[1],
    }
    const prisma = createMockPrisma({ applicationDetail: detail })
    const app = createTestApp(prisma)

    const res = await getApplicationDetail(app, 'app-uuid-2', 'valid-token')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.reviewerName).toBe('Reviewer Admin')
  })
})
