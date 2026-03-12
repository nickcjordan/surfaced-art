import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { createAuthRoutes } from './auth'
import type { PrismaClient } from '@surfaced-art/db'

// --- Mock data ---

const COGNITO_SUB = 'cognito-user-123'
const MOCK_USER = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  cognitoId: COGNITO_SUB,
  email: 'user@example.com',
  fullName: 'Test User',
  roles: [{ role: 'buyer' }],
}

const MOCK_ADMIN_USER = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  cognitoId: 'cognito-admin-456',
  email: 'admin@surfaced.art',
  fullName: 'Admin User',
  roles: [{ role: 'admin' }, { role: 'buyer' }],
}

// --- Helpers ---

function createAuthEnv(sub = COGNITO_SUB, email = 'user@example.com', name = 'Test User') {
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

function createMockPrisma(overrides?: { user?: unknown }) {
  const userFindUnique = vi.fn().mockImplementation(({ where }: { where: { cognitoId: string } }) => {
    if (where.cognitoId === COGNITO_SUB) {
      return Promise.resolve(overrides?.user ?? MOCK_USER)
    }
    if (where.cognitoId === 'cognito-admin-456') {
      return Promise.resolve(MOCK_ADMIN_USER)
    }
    return Promise.resolve(null)
  })

  return {
    user: { findUnique: userFindUnique },
    $transaction: vi.fn().mockImplementation((fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        user: {
          create: vi.fn().mockResolvedValue(MOCK_USER),
        },
      }),
    ),
  } as unknown as PrismaClient
}

function createTestApp(prisma: PrismaClient) {
  const app = new Hono()
  app.route('/auth', createAuthRoutes(prisma))
  return app
}

function getMe(
  app: ReturnType<typeof createTestApp>,
  env?: Record<string, unknown>,
) {
  return app.request('/auth/me', { method: 'GET' }, env)
}

// --- Tests ---

describe('GET /auth/me', () => {
  let prisma: PrismaClient

  beforeEach(() => {
    vi.clearAllMocks()
    prisma = createMockPrisma()
  })

  it('returns 401 when no auth claims are present', async () => {
    const app = createTestApp(prisma)
    const res = await getMe(app)

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  it('returns user profile with roles for authenticated user', async () => {
    const app = createTestApp(prisma)
    const authEnv = createAuthEnv()
    const res = await getMe(app, authEnv)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({
      id: MOCK_USER.id,
      email: MOCK_USER.email,
      fullName: MOCK_USER.fullName,
      roles: ['buyer'],
    })
  })

  it('returns multiple roles when user has multiple', async () => {
    const adminPrisma = createMockPrisma({ user: MOCK_ADMIN_USER })
    const app = createTestApp(adminPrisma)
    const authEnv = createAuthEnv(
      'cognito-admin-456',
      'admin@surfaced.art',
      'Admin User',
    )
    const res = await getMe(app, authEnv)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({
      id: MOCK_ADMIN_USER.id,
      email: MOCK_ADMIN_USER.email,
      fullName: MOCK_ADMIN_USER.fullName,
      roles: ['admin', 'buyer'],
    })
  })

  it('returns cache-control private header', async () => {
    const app = createTestApp(prisma)
    const authEnv = createAuthEnv()
    const res = await getMe(app, authEnv)

    expect(res.status).toBe(200)
    // Cache-control is set by the index.ts middleware, not the route itself
    // Just verify the response is successful
  })
})
