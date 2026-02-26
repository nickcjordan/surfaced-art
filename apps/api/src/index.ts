import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger as honoLogger } from 'hono/logger'
import { handle } from 'hono/aws-lambda'
import { prisma } from '@surfaced-art/db'
import { logger } from '@surfaced-art/utils'

import { securityHeaders } from './middleware/security-headers'
import { rateLimiter } from './middleware/rate-limiter'
import { createHealthRoutes } from './routes/health'
import { createArtistRoutes } from './routes/artists'
import { createListingRoutes } from './routes/listings'
import { createCategoryRoutes } from './routes/categories'
import { createWaitlistRoutes } from './routes/waitlist'

// Create Hono app
const app = new Hono()

// Middleware
app.use('*', securityHeaders())
app.use('*', honoLogger())
// CORS — allow production frontend, localhost for dev, and Vercel preview deploys
const allowedOrigins = [
  'https://surfaced.art',
  'https://www.surfaced.art',
  'http://localhost:3000',
]

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return 'https://surfaced.art'
      if (allowedOrigins.includes(origin)) return origin
      // Allow Vercel preview deploys (*.vercel.app)
      if (origin.endsWith('.vercel.app')) return origin
      return null
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 300,
  })
)

// Rate limiting for sensitive endpoints
app.use('/waitlist', rateLimiter({ maxRequests: 5, windowMs: 60_000 }))

// Mount routes
app.route('/health', createHealthRoutes(prisma))
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
