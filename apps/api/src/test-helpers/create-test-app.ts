import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { PrismaClient } from '@surfaced-art/db'

import { createHealthRoutes } from '../routes/health.js'
import { createArtistRoutes } from '../routes/artists.js'
import { createListingRoutes } from '../routes/listings.js'
import { createCategoryRoutes } from '../routes/categories.js'
import { createWaitlistRoutes } from '../routes/waitlist.js'
import { createApplicationRoutes } from '../routes/applications.js'
import { createMeRoutes } from '../routes/me.js'
import { createAdminRoutes } from '../routes/admin.js'

/**
 * Create a Hono app instance with a test PrismaClient injected.
 * Use this in integration tests to test against a real database
 * (Testcontainers) instead of mocked Prisma.
 */
export function createTestApp(prisma: PrismaClient) {
  const app = new Hono()

  // Minimal middleware for testing (skip logger for cleaner output)
  app.use(
    '*',
    cors({
      origin: '*',
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
    })
  )

  // Mount routes with injected PrismaClient — /artists/apply BEFORE /artists
  app.route('/health', createHealthRoutes(prisma))
  app.route('/artists/apply', createApplicationRoutes(prisma))
  app.route('/artists', createArtistRoutes(prisma))
  app.route('/listings', createListingRoutes(prisma))
  app.route('/categories', createCategoryRoutes(prisma))
  app.route('/waitlist', createWaitlistRoutes(prisma))
  app.route('/me', createMeRoutes(prisma))
  app.route('/admin', createAdminRoutes(prisma))

  // Root route
  app.get('/', (c) => {
    return c.json({
      name: 'Surfaced Art API',
      version: '0.0.1',
      status: 'running',
    })
  })

  // 404 handler
  app.notFound((c) => {
    return c.json({ error: 'Not found' }, 404)
  })

  // Error handler
  app.onError((err, c) => {
    console.error('Test app error:', err)
    return c.json({ error: 'Internal server error' }, 500)
  })

  return app
}
