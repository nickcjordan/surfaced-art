import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger as honoLogger } from 'hono/logger'
import { handle } from 'hono/aws-lambda'
import { prisma } from '@surfaced-art/db'
import { logger } from '@surfaced-art/utils'

import { healthRoutes } from './routes/health'
import { createArtistRoutes } from './routes/artists'
import { createListingRoutes } from './routes/listings'
import { createCategoryRoutes } from './routes/categories'
import { createWaitlistRoutes } from './routes/waitlist'

// Create Hono app
const app = new Hono()

// Middleware
app.use('*', honoLogger())
app.use(
  '*',
  cors({
    origin: '*', // Will be restricted in production
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
)

// Mount routes
app.route('/health', healthRoutes)
app.route('/artists', createArtistRoutes(prisma))
app.route('/listings', createListingRoutes(prisma))
app.route('/categories', createCategoryRoutes(prisma))
app.route('/waitlist', createWaitlistRoutes(prisma))

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
  return c.json(
    { error: { code: 'NOT_FOUND', message: 'Not found' } },
    404
  )
})

// Error handler — normalize err since throw can produce non-Error values
app.onError((err, c) => {
  const errorData: Record<string, unknown> = err instanceof Error
    ? {
        errorMessage: err.message,
        errorName: err.name,
        stack: err.stack,
      }
    : { errorMessage: String(err) }

  logger.error('Unhandled error', errorData)
  return c.json(
    { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
    500
  )
})

export const handler = handle(app)

// Export app for testing
export { app }
