import { Hono } from 'hono'
import type { PrismaClient } from '@surfaced-art/db'

export function createHealthRoutes(prisma: PrismaClient) {
  const health = new Hono()

  /**
   * GET /health
   * Basic health check — confirms Lambda is running
   */
  health.get('/', (c) => {
    return c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    })
  })

  /**
   * GET /health/db
   * Database connectivity check — verifies Prisma can reach RDS
   * and that the schema is applied (tables exist)
   */
  health.get('/db', async (c) => {
    const start = Date.now()
    const checks: Record<string, { status: string; error?: string }> = {}

    // Check 1: Can we connect and run a raw query?
    try {
      const result = await prisma.$queryRawUnsafe<{ now: Date }[]>('SELECT NOW() as now')
      checks.connection = { status: 'ok' }
      if (result[0]) {
        checks.connection.status = 'ok'
      }
    } catch (err) {
      checks.connection = {
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      }
    }

    // Check 2: Do the expected tables exist?
    try {
      // Query a core table with a lightweight count-limited query
      await prisma.artistProfile.findFirst({ select: { id: true } })
      checks.schema = { status: 'ok' }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('does not exist')) {
        checks.schema = {
          status: 'error',
          error: 'Tables missing — run migrations (force-reapply-baseline if needed)',
        }
      } else {
        checks.schema = { status: 'error', error: message }
      }
    }

    const allOk = Object.values(checks).every((c) => c.status === 'ok')
    const durationMs = Date.now() - start

    return c.json(
      {
        status: allOk ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        durationMs,
        checks,
      },
      allOk ? 200 : 503
    )
  })

  return health
}
