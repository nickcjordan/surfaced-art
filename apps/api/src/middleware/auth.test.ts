import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Hono } from 'hono'
import { authMiddleware, optionalAuth, requireRole, requireAnyRole, setVerifier, resetVerifier } from './auth'
import type { AuthUser } from './auth'

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  $transaction: vi.fn(),
} as unknown as Parameters<typeof authMiddleware>[0]

// Mock JWT verifier
const mockVerifier = {
  verify: vi.fn(),
} as unknown as ReturnType<typeof import('./auth').createVerifier>

// Test token payload (what Cognito returns)
const validPayload = {
  sub: 'cognito-user-123',
  email: 'alice@example.com',
  name: 'Alice Smith',
  iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test',
  aud: 'test-client-id',
  token_use: 'id',
}

// Test user from DB
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
  setVerifier(mockVerifier as ReturnType<typeof import('./auth').createVerifier>)
})

afterEach(() => {
  resetVerifier()
})

describe('authMiddleware', () => {
  describe('missing/invalid token', () => {
    it('should return 401 when no Authorization header is present', async () => {
      const app = createAuthApp()
      const res = await app.request('/protected/test')
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error.code).toBe('UNAUTHORIZED')
      expect(body.error.message).toBe('Authentication required')
    })

    it('should return 401 when Authorization header has no Bearer prefix', async () => {
      const app = createAuthApp()
      const res = await app.request('/protected/test', {
        headers: { Authorization: 'Basic abc123' },
      })
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error.code).toBe('UNAUTHORIZED')
    })

    it('should return 401 when token verification fails', async () => {
      mockVerifier.verify.mockRejectedValue(new Error('Token expired'))
      const app = createAuthApp()
      const res = await app.request('/protected/test', {
        headers: { Authorization: 'Bearer invalid-token' },
      })
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error.code).toBe('UNAUTHORIZED')
      expect(body.error.message).toBe('Invalid or expired token')
    })
  })

  describe('existing user', () => {
    it('should attach user to context for valid token with existing user', async () => {
      mockVerifier.verify.mockResolvedValue(validPayload)
      mockPrisma.user.findUnique.mockResolvedValue(existingUser)

      const app = createAuthApp()
      const res = await app.request('/protected/test', {
        headers: { Authorization: 'Bearer valid-token' },
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.userId).toBe(existingUser.id)
      expect(body.roles).toEqual(['buyer'])
    })

    it('should look up user by cognitoId from token sub claim', async () => {
      mockVerifier.verify.mockResolvedValue(validPayload)
      mockPrisma.user.findUnique.mockResolvedValue(existingUser)

      const app = createAuthApp()
      await app.request('/protected/test', {
        headers: { Authorization: 'Bearer valid-token' },
      })

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { cognitoId: 'cognito-user-123' },
        include: { roles: true },
      })
    })
  })

  describe('user auto-provisioning', () => {
    it('should create new user with buyer role on first request', async () => {
      mockVerifier.verify.mockResolvedValue(validPayload)
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const createdUser = {
        ...existingUser,
        cognitoId: validPayload.sub,
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
      const res = await app.request('/protected/test', {
        headers: { Authorization: 'Bearer valid-token' },
      })

      expect(res.status).toBe(200)
      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })

    it('should use email prefix as fullName when name claim is missing', async () => {
      const payloadNoName = { ...validPayload, name: undefined }
      mockVerifier.verify.mockResolvedValue(payloadNoName)
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const createdUser = { ...existingUser, fullName: 'alice' }
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          user: {
            create: vi.fn().mockResolvedValue(createdUser),
          },
        }
        return fn(tx)
      })

      const app = createAuthApp()
      const res = await app.request('/protected/test', {
        headers: { Authorization: 'Bearer valid-token' },
      })

      expect(res.status).toBe(200)
    })
  })
})

describe('optionalAuth', () => {
  it('should proceed without user when no token is present', async () => {
    const app = createOptionalAuthApp()
    const res = await app.request('/optional/test')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.authenticated).toBe(false)
    expect(body.userId).toBeNull()
  })

  it('should attach user when valid token is present', async () => {
    mockVerifier.verify.mockResolvedValue(validPayload)
    mockPrisma.user.findUnique.mockResolvedValue(existingUser)

    const app = createOptionalAuthApp()
    const res = await app.request('/optional/test', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.authenticated).toBe(true)
    expect(body.userId).toBe(existingUser.id)
  })

  it('should proceed without user when token is invalid', async () => {
    mockVerifier.verify.mockRejectedValue(new Error('Invalid token'))

    const app = createOptionalAuthApp()
    const res = await app.request('/optional/test', {
      headers: { Authorization: 'Bearer bad-token' },
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.authenticated).toBe(false)
    expect(body.userId).toBeNull()
  })
})

describe('requireRole', () => {
  it('should return 401 when no user is attached (middleware not chained)', async () => {
    const app = new Hono()
    app.use('/test', requireRole('artist'))
    app.get('/test', (c) => c.json({ ok: true }))

    const res = await app.request('/test')
    expect(res.status).toBe(401)
  })

  it('should return 403 when user lacks the required role', async () => {
    mockVerifier.verify.mockResolvedValue(validPayload)
    mockPrisma.user.findUnique.mockResolvedValue(existingUser) // only has 'buyer'

    const app = createRoleApp()
    const res = await app.request('/artist/test', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error.code).toBe('FORBIDDEN')
    expect(body.error.message).toBe('Insufficient permissions')
  })

  it('should allow access when user has the required role', async () => {
    mockVerifier.verify.mockResolvedValue(validPayload)
    mockPrisma.user.findUnique.mockResolvedValue(artistUser)

    const app = createRoleApp()
    const res = await app.request('/artist/test', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it('should check admin role correctly', async () => {
    mockVerifier.verify.mockResolvedValue(validPayload)
    mockPrisma.user.findUnique.mockResolvedValue(adminUser)

    const app = createRoleApp()
    const res = await app.request('/admin/test', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    expect(res.status).toBe(200)
  })
})

describe('requireAnyRole', () => {
  it('should return 403 when user has none of the required roles', async () => {
    mockVerifier.verify.mockResolvedValue(validPayload)
    mockPrisma.user.findUnique.mockResolvedValue(existingUser) // only has 'buyer'

    const app = createRoleApp()
    const res = await app.request('/any-role/test', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    expect(res.status).toBe(403)
  })

  it('should allow access when user has one of the required roles', async () => {
    mockVerifier.verify.mockResolvedValue(validPayload)
    mockPrisma.user.findUnique.mockResolvedValue(adminUser) // has admin

    const app = createRoleApp()
    const res = await app.request('/any-role/test', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    expect(res.status).toBe(200)
  })
})
