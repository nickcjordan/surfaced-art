import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger as honoLogger } from 'hono/logger'
import { handle } from 'hono/aws-lambda'
import { prisma } from '@surfaced-art/db'
import { logger } from '@surfaced-art/utils'

import { securityHeaders } from './middleware/security-headers'
import { requestId } from './middleware/request-id'
import { rateLimiter } from './middleware/rate-limiter'
import { cacheControl } from './middleware/cache-control'
import { createHealthRoutes } from './routes/health'
import { createArtistRoutes } from './routes/artists'
import { createListingRoutes } from './routes/listings'
import { createCategoryRoutes } from './routes/categories'
import { createWaitlistRoutes } from './routes/waitlist'
import { createApplicationRoutes } from './routes/applications'
import { createUploadRoutes } from './routes/uploads'
import { createMeRoutes } from './routes/me'
import { createAdminRoutes } from './routes/admin'
import { createTagRoutes } from './routes/tags'
import { createSearchRoutes } from './routes/search'
import { createWebhookRoutes } from './routes/webhooks'

// FRONTEND_URL is required — drives CORS allowed origins.
// Both bare domain and www variant are allowed.
const FRONTEND_URL = process.env.FRONTEND_URL
if (!FRONTEND_URL) {
  throw new Error('FRONTEND_URL is required')
}
// Support both bare domain and www variant (e.g. surfacedart.com + www.surfacedart.com)
const wwwVariant = FRONTEND_URL.replace('https://', 'https://www.')
// ADDITIONAL_CORS_ORIGINS: comma-separated list of extra allowed origins (e.g. alternate domains)
const additionalOrigins = process.env.ADDITIONAL_CORS_ORIGINS
  ? process.env.ADDITIONAL_CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : []
const allowedOrigins = [FRONTEND_URL, wwwVariant, 'http://localhost:3000', ...additionalOrigins]

// Create Hono app
const app = new Hono()

// Middleware
app.use('*', requestId())
app.use('*', securityHeaders())
app.use('*', honoLogger())
// CORS — allow configured frontend URL, localhost for dev, and Vercel preview deploys
app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return FRONTEND_URL
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
app.use('/artists/apply', rateLimiter({ maxRequests: 5, windowMs: 60_000 }))
app.use('/uploads/*', rateLimiter({ maxRequests: 10, windowMs: 60_000 }))
app.use('/me/*', rateLimiter({ maxRequests: 20, windowMs: 60_000 }))
app.use('/admin/*', rateLimiter({ maxRequests: 20, windowMs: 60_000 }))
app.use('/search', rateLimiter({ maxRequests: 30, windowMs: 60_000 }))
app.use('/webhooks/*', rateLimiter({ maxRequests: 30, windowMs: 60_000 }))

// Cache-control — public read endpoints
// /artists/apply has a GET that checks real-time status — exclude from public caching
app.use('/artists/apply/*', cacheControl('private, no-cache'))
app.use('/artists/apply', cacheControl('private, no-cache'))
app.use('/artists/*', cacheControl('public, max-age=300'))
app.use('/artists', cacheControl('public, max-age=300'))
app.use('/listings/*', cacheControl('public, max-age=300'))
app.use('/listings', cacheControl('public, max-age=300'))
app.use('/categories', cacheControl('public, max-age=3600'))
app.use('/tags', cacheControl('public, max-age=3600'))
app.use('/health/*', cacheControl('no-store'))
app.use('/health', cacheControl('no-store'))

// Cache-control — protected endpoints
app.use('/me/*', cacheControl('private, no-cache'))
app.use('/admin/*', cacheControl('private, no-cache'))

// Mount routes — /artists/apply MUST be before /artists to avoid /:slug collision
app.route('/health', createHealthRoutes(prisma))
app.route('/artists/apply', createApplicationRoutes(prisma))
app.route('/artists', createArtistRoutes(prisma))
app.route('/listings', createListingRoutes(prisma))
app.route('/categories', createCategoryRoutes(prisma))
app.route('/tags', createTagRoutes(prisma))
app.route('/search', createSearchRoutes(prisma))
app.route('/waitlist', createWaitlistRoutes(prisma))
app.route('/uploads', createUploadRoutes(prisma))
app.route('/me', createMeRoutes(prisma))
app.route('/admin', createAdminRoutes(prisma))
app.route('/webhooks', createWebhookRoutes(prisma))

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
