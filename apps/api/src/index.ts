import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { handle } from 'hono/aws-lambda'
import type { APIGatewayProxyResult, Context } from 'aws-lambda'

import { healthRoutes } from './routes/health'

// Create Hono app
const app = new Hono()

// Middleware
app.use('*', logger())
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
  console.error('Error:', err)
  return c.json({ error: 'Internal server error' }, 500)
})

const honoHandler = handle(app)

// Lambda handler — supports two invocation modes:
//   1. API Gateway (normal HTTP traffic) — delegated to Hono
//   2. Direct invocation with { command: 'migrate' } — runs Prisma migrations
//      from within the VPC so the private RDS instance is reachable.
export const handler = async (
  event: Record<string, unknown>,
  context: Context
): Promise<APIGatewayProxyResult | { success: boolean; error?: string }> => {
  if ('command' in event) {
    if (event.command === 'migrate') {
      const { execSync } = await import('child_process')
      try {
        const output = execSync('node_modules/.bin/prisma migrate deploy', {
          cwd: process.env.LAMBDA_TASK_ROOT ?? '/var/task',
          encoding: 'utf-8',
        })
        console.log('Migration output:', output)
        return { success: true }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        console.error('Migration failed:', message)
        return { success: false, error: message }
      }
    }
    return { success: false, error: `Unknown command: ${event.command as string}` }
  }

  return honoHandler(event as unknown as Parameters<typeof honoHandler>[0], context)
}

// Export app for testing
export { app }
