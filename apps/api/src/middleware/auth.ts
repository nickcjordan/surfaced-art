import type { MiddlewareHandler } from 'hono'
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
 * JWT claims structure from API Gateway v2 JWT authorizer.
 * API Gateway validates the Cognito JWT (signature, issuer, audience, expiry)
 * before the Lambda is invoked — claims are pre-validated.
 */
interface JwtClaims {
  sub: string
  email?: string
  name?: string
  [key: string]: unknown
}

/**
 * Extract pre-validated JWT claims from the API Gateway v2 event context.
 * Returns null if no authorizer claims are present (e.g. on $default public routes).
 */
function getJwtClaims(c: { env: Record<string, unknown> }): JwtClaims | null {
  const rc = c.env?.requestContext as
    | { authorizer?: { jwt?: { claims?: JwtClaims } } }
    | undefined
  return rc?.authorizer?.jwt?.claims ?? null
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

/**
 * Auth middleware — reads pre-validated JWT claims from API Gateway.
 * API Gateway validates the Cognito JWT before Lambda is invoked;
 * this middleware extracts claims and provisions the DB user.
 * Returns 401 if no claims are present (should not normally happen
 * on routes behind the JWT authorizer — API Gateway rejects first).
 */
export function authMiddleware(prisma: PrismaClient): MiddlewareHandler {
  return async (c, next) => {
    const claims = getJwtClaims(c)

    if (!claims?.sub) {
      return c.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        401,
      )
    }

    const cognitoId = claims.sub
    const email = (claims.email as string) ?? ''
    const fullName = (claims.name as string) ?? (email ? email.split('@')[0] : '')

    const user = await findOrCreateUser(prisma, cognitoId, email, fullName)

    c.set('user', user)

    await next()
    return
  }
}

/**
 * Optional auth middleware — attaches user if JWT claims are present, but doesn't require it.
 * For public routes (on $default) that optionally enhance behavior when authenticated.
 * On routes behind the JWT authorizer, claims will always be present.
 */
export function optionalAuth(prisma: PrismaClient): MiddlewareHandler {
  return async (c, next) => {
    const claims = getJwtClaims(c)

    if (!claims?.sub) {
      await next()
      return
    }

    try {
      const cognitoId = claims.sub
      const email = (claims.email as string) ?? ''
      const fullName = (claims.name as string) ?? (email ? email.split('@')[0] : '')

      const user = await findOrCreateUser(prisma, cognitoId, email, fullName)
      c.set('user', user)
    } catch {
      // Optional auth — silently ignore errors
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
