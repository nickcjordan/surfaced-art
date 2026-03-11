import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { authMiddleware, optionalAuth, requireRole, requireAnyRole } from './auth'
import type { AuthUser } from './auth'

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  $transaction: vi.fn(),
} as unknown as Parameters<typeof authMiddleware>[0]

// Test users from DB
const existingUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  cognitoId: 'cognito-user-123',
  email: 'alice@example.com',
  fullName: 'Alice Smith',
  roles: [{ id: 'role-1', userId: '550e8400-e29b-41d4-a716-446655440000', role: 'buyer', grantedAt: new Date(), grantedBy: null }],
}

const artistUser = {
  ...existingUser,
  roles: [
    { id: 'role-1', userId: existingUser.id, role: 'buyer', grantedAt: new Date(), grantedBy: null },
    { id: 'role-2', userId: existingUser.id, role: 'artist', grantedAt: new Date(), grantedBy: null },
  ],
}

const adminUser = {
  ...existingUser,
  roles: [
    { id: 'role-1', userId: existingUser.id, role: 'buyer', grantedAt: new Date(), grantedBy: null },
    { id: 'role-3', userId: existingUser.id, role: 'admin', grantedAt: new Date(), grantedBy: null },
  ],
}

/**
 * Create an env object simulating API Gateway v2 JWT authorizer claims.
 */
function createAuthEnv(sub = 'cognito-user-123', email = 'alice@example.com', name = 'Alice Smith') {
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

function createAuthApp() {
  const app = new Hono()
  app.use('/protected/*', authMiddleware(mockPrisma))
  app.get('/protected/test', (c) => {
    const user = c.get('user') as AuthUser
    return c.json({ userId: user.id, roles: user.roles })
  })
  return app
}

function createOptionalAuthApp() {
  const app = new Hono()
  app.use('/optional/*', optionalAuth(mockPrisma))
  app.get('/optional/test', (c) => {
    const user = c.get('user') as AuthUser | undefined
    return c.json({ authenticated: !!user, userId: user?.id ?? null })
  })
  return app
}

function createRoleApp() {
  const app = new Hono()
  app.use('/artist/*', authMiddleware(mockPrisma))
  app.use('/artist/*', requireRole('artist'))
  app.get('/artist/test', (c) => c.json({ ok: true }))

  app.use('/admin/*', authMiddleware(mockPrisma))
  app.use('/admin/*', requireRole('admin'))
  app.get('/admin/test', (c) => c.json({ ok: true }))

  app.use('/any-role/*', authMiddleware(mockPrisma))
  app.use('/any-role/*', requireAnyRole(['admin', 'curator']))
  app.get('/any-role/test', (c) => c.json({ ok: true }))
  return app
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('authMiddleware', () => {
  describe('missing claims', () => {
    it('should return 401 when no claims in event context (no env)', async () => {
      const app = createAuthApp()
      const res = await app.request('/protected/test')
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error.code).toBe('UNAUTHORIZED')
      expect(body.error.message).toBe('Authentication required')
    })

    it('should return 401 when claims lack sub', async () => {
      const app = createAuthApp()
      const env = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: { email: 'alice@example.com' },
            },
          },
        },
      }
      const res = await app.request('/protected/test', {}, env)
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('existing user', () => {
    it('should attach user to context when valid claims and existing DB user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(existingUser)

      const app = createAuthApp()
      const res = await app.request('/protected/test', {}, createAuthEnv())

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.userId).toBe(existingUser.id)
      expect(body.roles).toEqual(['buyer'])
    })

    it('should look up user by cognitoId from claims.sub', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(existingUser)

      const app = createAuthApp()
      await app.request('/protected/test', {}, createAuthEnv())

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { cognitoId: 'cognito-user-123' },
        include: { roles: true },
      })
    })
  })

  describe('user auto-provisioning', () => {
    it('should create new user with buyer role on first request', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const createdUser = {
        ...existingUser,
        cognitoId: 'cognito-user-123',
      }
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          user: {
            create: vi.fn().mockResolvedValue(createdUser),
          },
        }
        return fn(tx)
      })

      const app = createAuthApp()
      const res = await app.request('/protected/test', {}, createAuthEnv())

      expect(res.status).toBe(200)
      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })

    it('should use email prefix as fullName when name claim is missing', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const createdUser = { ...existingUser, fullName: 'alice' }
      const mockCreate = vi.fn().mockResolvedValue(createdUser)
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          user: {
            create: mockCreate,
          },
        }
        return fn(tx)
      })

      const app = createAuthApp()
      // Pass claims without a name property
      const env = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: { sub: 'cognito-user-123', email: 'alice@example.com' },
            },
          },
        },
      }
      const res = await app.request('/protected/test', {}, env)

      expect(res.status).toBe(200)
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fullName: 'alice',
          }),
        }),
      )
    })
  })
})

describe('optionalAuth', () => {
  it('should proceed without user when no claims present', async () => {
    const app = createOptionalAuthApp()
    const res = await app.request('/optional/test')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.authenticated).toBe(false)
    expect(body.userId).toBeNull()
  })

  it('should attach user when claims are present', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(existingUser)

    const app = createOptionalAuthApp()
    const res = await app.request('/optional/test', {}, createAuthEnv())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.authenticated).toBe(true)
    expect(body.userId).toBe(existingUser.id)
  })

  it('should proceed without user if DB lookup throws', async () => {
    mockPrisma.user.findUnique.mockRejectedValue(new Error('DB connection failed'))

    const app = createOptionalAuthApp()
    const res = await app.request('/optional/test', {}, createAuthEnv())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.authenticated).toBe(false)
    expect(body.userId).toBeNull()
  })
})

describe('requireRole', () => {
  it('should return 401 when no user is attached', async () => {
    const app = new Hono()
    app.use('/test', requireRole('artist'))
    app.get('/test', (c) => c.json({ ok: true }))

    const res = await app.request('/test')
    expect(res.status).toBe(401)
  })

  it('should return 403 when user lacks the required role', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(existingUser) // only has 'buyer'

    const app = createRoleApp()
    const res = await app.request('/artist/test', {}, createAuthEnv())

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error.code).toBe('FORBIDDEN')
    expect(body.error.message).toBe('Insufficient permissions')
  })

  it('should allow access when user has the required role', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(artistUser)

    const app = createRoleApp()
    const res = await app.request('/artist/test', {}, createAuthEnv())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it('should check admin role correctly', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(adminUser)

    const app = createRoleApp()
    const res = await app.request('/admin/test', {}, createAuthEnv())

    expect(res.status).toBe(200)
  })
})

describe('requireAnyRole', () => {
  it('should return 403 when user has none of the required roles', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(existingUser) // only has 'buyer'

    const app = createRoleApp()
    const res = await app.request('/any-role/test', {}, createAuthEnv())

    expect(res.status).toBe(403)
  })

  it('should allow access when user has one of the required roles', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(adminUser) // has admin

    const app = createRoleApp()
    const res = await app.request('/any-role/test', {}, createAuthEnv())

    expect(res.status).toBe(200)
  })
})
