import { Hono } from 'hono'

export const healthRoutes = new Hono()

/**
 * GET /health
 * Health check endpoint for Lambda and monitoring
 */
healthRoutes.get('/', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})
