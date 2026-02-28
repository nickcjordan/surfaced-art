import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Hono } from 'hono'
import { createAdminRoutes } from './admin'
import { setVerifier, resetVerifier } from '../middleware/auth'
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
  } as unknown as ReturnType<typeof setVerifier extends (v: infer T) => void ? () => T : never>
}

const ADMIN_USER_ID = 'admin-uuid-123'
const TARGET_USER_ID = 'user-uuid-456'

const mockAdminUser = {
  id: ADMIN_USER_ID,
  cognitoId: 'cognito-admin',
  email: 'admin@surfacedart.com',
  fullName: 'Admin User',
  roles: [{ role: 'admin' }],
}

const mockTargetUser = {
  id: TARGET_USER_ID,
  cognitoId: 'cognito-target',
  email: 'artist@example.com',
  fullName: 'Jane Artist',
  roles: [{ role: 'buyer' }],
}

const mockPendingApplication = {
  id: 'app-uuid-789',
  email: 'artist@example.com',
  fullName: 'Jane Artist',
  statement: 'I create beautiful ceramics.',
  status: 'pending',
  reviewedBy: null,
  reviewedAt: null,
  reviewNotes: null,
}

const mockCreatedProfile = {
  id: 'profile-uuid-abc',
  userId: TARGET_USER_ID,
  displayName: 'Jane Artist',
  slug: 'jane-artist',
  bio: 'I create beautiful ceramics.',
  location: '',
  status: 'pending',
}

function createMockPrisma(overrides?: {
  adminRoles?: string[]
  targetUser?: unknown
  application?: unknown
  existingProfile?: unknown
  createdProfile?: unknown
  existingRole?: unknown
}) {
  const adminRoles = overrides?.adminRoles ?? ['admin']
  const targetUser = overrides?.targetUser !== undefined ? overrides.targetUser : mockTargetUser
  const application = overrides?.application !== undefined ? overrides.application : mockPendingApplication
  const createdProfile = overrides?.createdProfile ?? mockCreatedProfile

  const userFindUnique = vi.fn().mockImplementation(({ where }: { where: { cognitoId?: string; id?: string } }) => {
    if (where.cognitoId === 'cognito-admin') {
      return Promise.resolve({ ...mockAdminUser, roles: adminRoles.map((r) => ({ role: r })) })
    }
    if (where.id === TARGET_USER_ID) {
      return Promise.resolve(targetUser)
    }
    return Promise.resolve(null)
  })

  return {
    user: {
      findUnique: userFindUnique,
    },
    artistApplication: {
      findFirst: vi.fn().mockResolvedValue(application),
      update: vi.fn().mockResolvedValue({ ...application, status: 'approved' }),
    },
    artistProfile: {
      findUnique: vi.fn().mockResolvedValue(overrides?.existingProfile ?? null),
      create: vi.fn().mockResolvedValue(createdProfile),
    },
    userRole: {
      findUnique: vi.fn().mockResolvedValue(overrides?.existingRole ?? null),
      create: vi.fn().mockResolvedValue({ userId: TARGET_USER_ID, role: 'artist', grantedBy: ADMIN_USER_ID }),
    },
    $transaction: vi.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const txPrisma = {
        artistApplication: {
          update: vi.fn().mockResolvedValue({ ...application, status: 'approved' }),
        },
        artistProfile: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue(createdProfile),
        },
        userRole: {
          create: vi.fn().mockResolvedValue({ userId: TARGET_USER_ID, role: 'artist', grantedBy: ADMIN_USER_ID }),
        },
      }
      return fn(txPrisma)
    }),
  } as unknown as PrismaClient
}

function createTestApp(prisma: PrismaClient) {
  const app = new Hono()
  app.route('/admin', createAdminRoutes(prisma))
  return app
}

function approveArtist(
  app: ReturnType<typeof createTestApp>,
  userId: string,
  body?: Record<string, unknown>,
  token?: string,
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request(`/admin/artists/${userId}/approve`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body ?? {}),
  })
}

function rejectArtist(
  app: ReturnType<typeof createTestApp>,
  userId: string,
  body?: Record<string, unknown>,
  token?: string,
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request(`/admin/artists/${userId}/reject`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body ?? {}),
  })
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('POST /admin/artists/:userId/approve', () => {
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

      const res = await approveArtist(app, TARGET_USER_ID)
      expect(res.status).toBe(401)

      const body = await res.json()
      expect(body.error.code).toBe('UNAUTHORIZED')
    })

    it('should return 403 without admin role', async () => {
      const prisma = createMockPrisma({ adminRoles: ['buyer'] })
      const app = createTestApp(prisma)

      const res = await approveArtist(app, TARGET_USER_ID, {}, 'valid-token')
      expect(res.status).toBe(403)

      const body = await res.json()
      expect(body.error.code).toBe('FORBIDDEN')
    })
  })

  describe('validation', () => {
    it('should return 404 if target user not found', async () => {
      const prisma = createMockPrisma({ targetUser: null })
      const app = createTestApp(prisma)

      const res = await approveArtist(app, TARGET_USER_ID, {}, 'valid-token')
      expect(res.status).toBe(404)

      const body = await res.json()
      expect(body.error.code).toBe('NOT_FOUND')
    })

    it('should return 404 if no pending application exists', async () => {
      const prisma = createMockPrisma({ application: null })
      const app = createTestApp(prisma)

      const res = await approveArtist(app, TARGET_USER_ID, {}, 'valid-token')
      expect(res.status).toBe(404)

      const body = await res.json()
      expect(body.error.code).toBe('NOT_FOUND')
      expect(body.error.message).toContain('pending application')
    })

    it('should return 409 if user already has artist role', async () => {
      const targetWithArtistRole = { ...mockTargetUser, roles: [{ role: 'buyer' }, { role: 'artist' }] }
      const prisma = createMockPrisma({ targetUser: targetWithArtistRole })
      const app = createTestApp(prisma)

      const res = await approveArtist(app, TARGET_USER_ID, {}, 'valid-token')
      expect(res.status).toBe(409)

      const body = await res.json()
      expect(body.error.code).toBe('CONFLICT')
    })
  })

  describe('successful approval', () => {
    it('should return 200 with profile data', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await approveArtist(app, TARGET_USER_ID, {}, 'valid-token')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.message).toContain('approved')
      expect(body.profile).toEqual({
        id: 'profile-uuid-abc',
        slug: 'jane-artist',
        displayName: 'Jane Artist',
      })
    })

    it('should call $transaction to update application, create profile, and create role', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      await approveArtist(app, TARGET_USER_ID, {}, 'valid-token')

      expect(prisma.$transaction).toHaveBeenCalledOnce()
    })

    it('should accept optional reviewNotes', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await approveArtist(app, TARGET_USER_ID, { reviewNotes: 'Great portfolio!' }, 'valid-token')
      expect(res.status).toBe(200)
    })

    it('should send acceptance email', async () => {
      const { sendEmail } = await import('@surfaced-art/email')
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      await approveArtist(app, TARGET_USER_ID, {}, 'valid-token')

      expect(sendEmail).toHaveBeenCalledOnce()
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'artist@example.com',
          subject: expect.stringContaining('Surfaced Art'),
        })
      )
    })
  })
})

describe('POST /admin/artists/:userId/reject', () => {
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

      const res = await rejectArtist(app, TARGET_USER_ID)
      expect(res.status).toBe(401)

      const body = await res.json()
      expect(body.error.code).toBe('UNAUTHORIZED')
    })

    it('should return 403 without admin role', async () => {
      const prisma = createMockPrisma({ adminRoles: ['buyer'] })
      const app = createTestApp(prisma)

      const res = await rejectArtist(app, TARGET_USER_ID, {}, 'valid-token')
      expect(res.status).toBe(403)

      const body = await res.json()
      expect(body.error.code).toBe('FORBIDDEN')
    })
  })

  describe('validation', () => {
    it('should return 404 if target user not found', async () => {
      const prisma = createMockPrisma({ targetUser: null })
      const app = createTestApp(prisma)

      const res = await rejectArtist(app, TARGET_USER_ID, {}, 'valid-token')
      expect(res.status).toBe(404)

      const body = await res.json()
      expect(body.error.code).toBe('NOT_FOUND')
    })

    it('should return 404 if no pending application exists', async () => {
      const prisma = createMockPrisma({ application: null })
      const app = createTestApp(prisma)

      const res = await rejectArtist(app, TARGET_USER_ID, {}, 'valid-token')
      expect(res.status).toBe(404)

      const body = await res.json()
      expect(body.error.code).toBe('NOT_FOUND')
      expect(body.error.message).toContain('pending application')
    })
  })

  describe('successful rejection', () => {
    it('should return 200 with success message', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await rejectArtist(app, TARGET_USER_ID, {}, 'valid-token')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.message).toContain('rejected')
    })

    it('should update application status to rejected', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      await rejectArtist(app, TARGET_USER_ID, {}, 'valid-token')

      expect(prisma.artistApplication.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockPendingApplication.id },
          data: expect.objectContaining({
            status: 'rejected',
            reviewedBy: ADMIN_USER_ID,
          }),
        })
      )
    })

    it('should accept optional reviewNotes', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await rejectArtist(app, TARGET_USER_ID, { reviewNotes: 'Not a good fit at this time.' }, 'valid-token')
      expect(res.status).toBe(200)
    })

    it('should send rejection email', async () => {
      const { sendEmail } = await import('@surfaced-art/email')
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      await rejectArtist(app, TARGET_USER_ID, {}, 'valid-token')

      expect(sendEmail).toHaveBeenCalledOnce()
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'artist@example.com',
          subject: expect.stringContaining('Application'),
        })
      )
    })
  })
})
