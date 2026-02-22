import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { handle } from 'hono/aws-lambda'
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'

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

type CommandEvent = {
  command: 'migrate'
}

const honoHandler = handle(app)

// Resolve Prisma CLI from node_modules directly — avoids depending on
// .bin symlinks (broken by workspace hoisting) or npx being available.
// prisma is a dep of @surfaced-art/db so npm installs it under that workspace.
const LAMBDA_ROOT = process.env.LAMBDA_TASK_ROOT ?? '/var/task'
const PRISMA_CLI = `${LAMBDA_ROOT}/packages/db/node_modules/prisma/build/index.js`
const PRISMA_MIGRATE_CMD = `node ${PRISMA_CLI} migrate deploy`

// Lambda handler — supports two invocation modes:
//   1. API Gateway (normal HTTP traffic) — delegated to Hono
//   2. Direct invocation with { command: 'migrate' } — runs Prisma migrations
//      from within the VPC so the private RDS instance is reachable.
export const handler = async (
  event: APIGatewayProxyEvent | CommandEvent,
  context: Context
): Promise<APIGatewayProxyResult | { success: boolean; error?: string }> => {
  if ('command' in event) {
    if (event.command === 'migrate') {
      const { execSync } = await import('child_process')
      try {
        const output = execSync(PRISMA_MIGRATE_CMD, {
          cwd: LAMBDA_ROOT,
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
    return { success: false, error: `Unknown command: ${event.command}` }
  }

  return honoHandler(event as unknown as Parameters<typeof honoHandler>[0], context)
}

// Export app for testing
export { app }
