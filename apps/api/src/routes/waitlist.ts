import { Hono } from 'hono'
import type { PrismaClient } from '@surfaced-art/db'
import { validateEmail, logger } from '@surfaced-art/utils'

export function createWaitlistRoutes(prisma: PrismaClient) {
  const waitlist = new Hono()

  /**
   * POST /waitlist
   * Accepts an email and stores it in the waitlist table.
   * Returns the same success message for duplicates to avoid leaking
   * whether an email is already registered.
   */
  waitlist.post('/', async (c) => {
    const start = Date.now()
    const body = await c.req.json().catch(() => ({}))
    const email = typeof body.email === 'string' ? body.email.trim() : ''

    if (!email) {
      return c.json({ error: 'Email is required' }, 400)
    }

    if (!validateEmail(email)) {
      return c.json({ error: 'Invalid email address' }, 400)
    }

    const normalizedEmail = email.toLowerCase()

    try {
      await prisma.waitlist.create({
        data: { email: normalizedEmail },
      })

      logger.info('Waitlist signup', {
        durationMs: Date.now() - start,
      })

      return c.json({ message: 'Successfully joined the waitlist' }, 201)
    } catch (err: unknown) {
      // Handle duplicate email (Prisma unique constraint violation P2002)
      if (
        err instanceof Error &&
        'code' in err &&
        (err as Record<string, unknown>).code === 'P2002'
      ) {
        logger.info('Waitlist duplicate signup attempt', {
          durationMs: Date.now() - start,
        })
        return c.json({ message: 'Successfully joined the waitlist' }, 200)
      }

      logger.error('Waitlist signup failed', {
        errorMessage: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
      })
      return c.json({ error: 'Internal server error' }, 500)
    }
  })

  return waitlist
}
