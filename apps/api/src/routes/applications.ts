import { Hono } from 'hono'
import type { PrismaClient, CategoryType } from '@surfaced-art/db'
import { logger } from '@surfaced-art/utils'
import { artistApplicationBody, checkEmailQuery, sanitizeText } from '@surfaced-art/types'
import { badRequest, validationError, conflict, internalError } from '../errors'

export function createApplicationRoutes(prisma: PrismaClient) {
  const applications = new Hono()

  /**
   * GET /artists/apply/check-email?email=...
   * Check if an application already exists for the given email.
   * Returns { exists: false } if the email is new or has a rejected/withdrawn application.
   */
  applications.get('/check-email', async (c) => {
    const parsed = checkEmailQuery.safeParse({ email: c.req.query('email') })
    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    const normalizedEmail = parsed.data.email.trim().toLowerCase()

    const existing = await prisma.artistApplication.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, status: true },
    })

    // Allow reapplication for rejected/withdrawn
    if (!existing || existing.status === 'rejected' || existing.status === 'withdrawn') {
      return c.json({ exists: false })
    }

    return c.json({ exists: true, status: existing.status })
  })

  /**
   * POST /artists/apply
   * Submit an artist application.
   * Creates an ArtistApplication record with status=pending.
   */
  applications.post('/', async (c) => {
    const start = Date.now()

    const body = await c.req.json().catch(() => null)
    if (body === null) {
      return badRequest(c, 'Invalid JSON payload')
    }

    const parsed = artistApplicationBody.safeParse(body)
    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    const {
      fullName,
      email,
      instagramUrl,
      websiteUrl,
      statement,
      exhibitionHistory,
      categories,
    } = parsed.data

    const normalizedEmail = email.trim().toLowerCase()
    const sanitizedFullName = sanitizeText(fullName)
    const sanitizedStatement = sanitizeText(statement)
    const sanitizedHistory = exhibitionHistory ? sanitizeText(exhibitionHistory) : null

    // Check for existing application
    const existing = await prisma.artistApplication.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, status: true },
    })

    if (existing) {
      // Pending or approved — reject duplicate
      if (existing.status === 'pending') {
        return conflict(c, 'An application with this email is already under review')
      }
      if (existing.status === 'approved') {
        return conflict(c, 'This email is already associated with an approved artist')
      }

      // Rejected or withdrawn — allow resubmission by updating existing record
      const updated = await prisma.artistApplication.update({
        where: { id: existing.id },
        data: {
          fullName: sanitizedFullName,
          instagramUrl: instagramUrl || null,
          websiteUrl: websiteUrl || null,
          statement: sanitizedStatement,
          exhibitionHistory: sanitizedHistory,
          categories: categories as CategoryType[],
          status: 'pending',
        },
      })

      logger.info('Artist application resubmitted', {
        applicationId: updated.id,
        durationMs: Date.now() - start,
      })

      return c.json(
        { message: 'Application submitted successfully', applicationId: updated.id },
        201
      )
    }

    // New application
    try {
      const application = await prisma.artistApplication.create({
        data: {
          email: normalizedEmail,
          fullName: sanitizedFullName,
          instagramUrl: instagramUrl || null,
          websiteUrl: websiteUrl || null,
          statement: sanitizedStatement,
          exhibitionHistory: sanitizedHistory,
          categories: categories as CategoryType[],
        },
      })

      logger.info('Artist application submitted', {
        applicationId: application.id,
        durationMs: Date.now() - start,
      })

      // TODO: Send confirmation email to applicant (depends on #177)
      // TODO: Send notification email to admin team (depends on #177)

      return c.json(
        { message: 'Application submitted successfully', applicationId: application.id },
        201
      )
    } catch (err: unknown) {
      logger.error('Artist application submission failed', {
        errorMessage: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
      })
      return internalError(c)
    }
  })

  return applications
}
