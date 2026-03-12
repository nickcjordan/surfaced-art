import { Hono } from 'hono'
import type { PrismaClient } from '@surfaced-art/db'
import { authMiddleware, type AuthUser } from '../middleware/auth'

/**
 * Auth routes — authenticated user identity endpoints.
 *
 * GET /me — returns the authenticated user's profile and roles.
 * Used by the frontend to determine role-based UI (admin vs artist vs buyer).
 */
export function createAuthRoutes(prisma: PrismaClient) {
  const auth = new Hono<{ Variables: { user: AuthUser } }>()

  auth.use('*', authMiddleware(prisma))

  auth.get('/me', async (c) => {
    const user = c.get('user')
    return c.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles,
    })
  })

  return auth
}
