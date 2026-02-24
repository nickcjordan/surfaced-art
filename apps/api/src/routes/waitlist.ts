import { Hono } from 'hono'
import type { PrismaClient } from '@surfaced-art/db'
import { Prisma } from '@surfaced-art/db'
import { logger } from '@surfaced-art/utils'
import { badRequest, validationError, internalError } from '../errors'
import { waitlistBodySchema } from '../schemas'

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

    const body = await c.req.json().catch(() => null)
    if (body === null) {
      return badRequest(c, 'Invalid JSON payload')
    }

    const parsed = waitlistBodySchema.safeParse(body)
    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    const normalizedEmail = parsed.data.email.trim().toLowerCase()

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
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        logger.info('Waitlist duplicate signup attempt', {
          durationMs: Date.now() - start,
        })
        return c.json({ message: 'Successfully joined the waitlist' }, 200)
      }

      logger.error('Waitlist signup failed', {
        errorMessage: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
      })
      return internalError(c)
    }
  })

  return waitlist
}
