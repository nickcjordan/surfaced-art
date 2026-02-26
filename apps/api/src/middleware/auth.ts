import type { MiddlewareHandler } from 'hono'
import { CognitoJwtVerifier } from 'aws-jwt-verify'
import type { PrismaClient } from '@surfaced-art/db'
import type { UserRoleType } from '@surfaced-art/types'
import { logger } from '@surfaced-art/utils'

/**
 * Authenticated user context attached to the Hono request.
 */
export interface AuthUser {
  id: string
  cognitoId: string
  email: string
  fullName: string
  roles: UserRoleType[]
}

/**
 * Creates a Cognito JWT verifier instance.
 * Exported for testability — tests can provide a mock.
 */
export function createVerifier(userPoolId: string, clientId: string) {
  return CognitoJwtVerifier.create({
    userPoolId,
    clientId,
    tokenUse: 'id',
  })
}

/**
 * Extract the Bearer token from the Authorization header.
 */
function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  return match?.[1] ?? null
}

/**
 * Find or create a user in the database based on Cognito claims.
 * On first authenticated request, creates a users record + buyer role in a transaction.
 */
async function findOrCreateUser(
  prisma: PrismaClient,
  cognitoId: string,
  email: string,
  fullName: string,
): Promise<AuthUser> {
  // Try to find existing user
  const existing = await prisma.user.findUnique({
    where: { cognitoId },
    include: { roles: true },
  })

  if (existing) {
    return {
      id: existing.id,
      cognitoId: existing.cognitoId,
      email: existing.email,
      fullName: existing.fullName,
      roles: existing.roles.map((r) => r.role as UserRoleType),
    }
  }

  // Create new user with buyer role in a transaction
  const newUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        cognitoId,
        email,
        fullName,
        roles: {
          create: {
            role: 'buyer',
          },
        },
      },
      include: { roles: true },
    })
    return user
  })

  logger.info('User auto-provisioned', {
    userId: newUser.id,
    cognitoId,
    email,
  })

  return {
    id: newUser.id,
    cognitoId: newUser.cognitoId,
    email: newUser.email,
    fullName: newUser.fullName,
    roles: newUser.roles.map((r) => r.role as UserRoleType),
  }
}

// Module-level verifier singleton — initialized on first use
let verifier: ReturnType<typeof createVerifier> | null = null

function getVerifier(): ReturnType<typeof createVerifier> {
  if (!verifier) {
    const userPoolId = process.env.COGNITO_USER_POOL_ID
    const clientId = process.env.COGNITO_CLIENT_ID
    if (!userPoolId || !clientId) {
      throw new Error('COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID must be set')
    }
    verifier = createVerifier(userPoolId, clientId)
  }
  return verifier
}

/**
 * Reset the cached verifier — used only by tests.
 */
export function resetVerifier(): void {
  verifier = null
}

/**
 * Set a custom verifier — used for testing with mocks.
 */
export function setVerifier(v: ReturnType<typeof createVerifier>): void {
  verifier = v
}

/**
 * Auth middleware — validates JWT and provisions user.
 * Attaches AuthUser to `c.set('user', authUser)`.
 * Returns 401 for missing/invalid tokens.
 */
export function authMiddleware(prisma: PrismaClient): MiddlewareHandler {
  return async (c, next) => {
    const token = extractToken(c.req.header('Authorization'))

    if (!token) {
      return c.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        401,
      )
    }

    try {
      const payload = await getVerifier().verify(token)

      const cognitoId = payload.sub as string
      const email = (payload.email as string) ?? ''
      const fullName = (payload.name as string) ?? email.split('@')[0]

      const user = await findOrCreateUser(prisma, cognitoId, email, fullName)

      c.set('user', user)

      await next()
      return
    } catch (err) {
      logger.warn('JWT verification failed', {
        errorMessage: err instanceof Error ? err.message : String(err),
      })
      return c.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } },
        401,
      )
    }
  }
}

/**
 * Optional auth middleware — attaches user if token is present, but doesn't require it.
 * For public routes that optionally enhance behavior when authenticated.
 */
export function optionalAuth(prisma: PrismaClient): MiddlewareHandler {
  return async (c, next) => {
    const token = extractToken(c.req.header('Authorization'))

    if (!token) {
      await next()
      return
    }

    try {
      const payload = await getVerifier().verify(token)

      const cognitoId = payload.sub as string
      const email = (payload.email as string) ?? ''
      const fullName = (payload.name as string) ?? email.split('@')[0]

      const user = await findOrCreateUser(prisma, cognitoId, email, fullName)
      c.set('user', user)
    } catch {
      // Optional auth — silently ignore invalid tokens
    }

    await next()
  }
}

/**
 * Role-check middleware — requires the user to have a specific role.
 * Must be used after authMiddleware.
 */
export function requireRole(role: UserRoleType): MiddlewareHandler {
  return async (c, next) => {
    const user = c.get('user') as AuthUser | undefined

    if (!user) {
      return c.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        401,
      )
    }

    if (!user.roles.includes(role)) {
      return c.json(
        { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        403,
      )
    }

    await next()
    return
  }
}

/**
 * Role-check middleware — requires the user to have ANY of the specified roles.
 * Must be used after authMiddleware.
 */
export function requireAnyRole(roles: UserRoleType[]): MiddlewareHandler {
  return async (c, next) => {
    const user = c.get('user') as AuthUser | undefined

    if (!user) {
      return c.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        401,
      )
    }

    const hasRole = roles.some((role) => user.roles.includes(role))
    if (!hasRole) {
      return c.json(
        { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        403,
      )
    }

    await next()
    return
  }
}
