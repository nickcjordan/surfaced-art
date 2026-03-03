import { Hono } from 'hono'
import type { PrismaClient } from '@surfaced-art/db'
import { authMiddleware, requireRole, type AuthUser } from '../../middleware/auth'
import { createAdminApplicationRoutes } from './applications'
import { createAdminUserRoutes } from './users'
import { createAdminArtistRoutes } from './artists'
import { createAdminListingRoutes } from './listings'

export function createAdminRoutes(prisma: PrismaClient) {
  const admin = new Hono<{ Variables: { user: AuthUser } }>()

  admin.use('*', authMiddleware(prisma))
  admin.use('*', requireRole('admin'))

  admin.route('/', createAdminApplicationRoutes(prisma))
  admin.route('/users', createAdminUserRoutes(prisma))
  admin.route('/artists', createAdminArtistRoutes(prisma))
  admin.route('/listings', createAdminListingRoutes(prisma))

  return admin
}
