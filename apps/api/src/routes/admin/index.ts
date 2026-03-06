import { Hono } from 'hono'
import type { PrismaClient } from '@surfaced-art/db'
import { authMiddleware, requireRole, type AuthUser } from '../../middleware/auth'
import { createAdminApplicationRoutes } from './applications'
import { createAdminUserRoutes } from './users'
import { createAdminArtistRoutes } from './artists'
import { createAdminListingRoutes } from './listings'
import { createAdminAuditRoutes } from './audit'
import { createAdminPlatformRoutes } from './platform'
import { createAdminBulkRoutes } from './bulk'
import { createAdminOrderRoutes } from './orders'

export function createAdminRoutes(prisma: PrismaClient) {
  const admin = new Hono<{ Variables: { user: AuthUser } }>()

  admin.use('*', authMiddleware(prisma))
  admin.use('*', requireRole('admin'))

  admin.route('/', createAdminApplicationRoutes(prisma))
  admin.route('/users', createAdminUserRoutes(prisma))
  admin.route('/artists', createAdminArtistRoutes(prisma))
  admin.route('/listings', createAdminListingRoutes(prisma))
  admin.route('/audit-log', createAdminAuditRoutes(prisma))
  admin.route('/', createAdminPlatformRoutes(prisma))
  admin.route('/orders', createAdminOrderRoutes(prisma))
  admin.route('/', createAdminBulkRoutes(prisma))

  return admin
}
