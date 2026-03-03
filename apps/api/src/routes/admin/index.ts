import { Hono } from 'hono'
import type { PrismaClient } from '@surfaced-art/db'
import { authMiddleware, requireRole, type AuthUser } from '../../middleware/auth'
import { createAdminApplicationRoutes } from './applications'

export function createAdminRoutes(prisma: PrismaClient) {
  const admin = new Hono<{ Variables: { user: AuthUser } }>()

  admin.use('*', authMiddleware(prisma))
  admin.use('*', requireRole('admin'))

  admin.route('/', createAdminApplicationRoutes(prisma))

  return admin
}
