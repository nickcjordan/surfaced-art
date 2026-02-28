import { Hono } from 'hono'
import type { PrismaClient } from '@surfaced-art/db'
import { logger, generateSlug } from '@surfaced-art/utils'
import { adminReviewBody } from '@surfaced-art/types'
import type { AdminApproveResponse, AdminRejectResponse } from '@surfaced-art/types'
import { sendEmail, ArtistAcceptance, ArtistRejection } from '@surfaced-art/email'
import { authMiddleware, requireRole, type AuthUser } from '../middleware/auth'
import { notFound, conflict, validationError, internalError } from '../errors'
import { createElement } from 'react'

export function createAdminRoutes(prisma: PrismaClient) {
  const admin = new Hono<{ Variables: { user: AuthUser } }>()

  admin.use('*', authMiddleware(prisma))
  admin.use('*', requireRole('admin'))

  /**
   * POST /admin/artists/:userId/approve
   * Approve an artist application: update application status, create profile, grant role.
   */
  admin.post('/artists/:userId/approve', async (c) => {
    const start = Date.now()
    const adminUser = c.get('user')
    const { userId } = c.req.param()

    const body = await c.req.json().catch(() => ({}))
    const parsed = adminReviewBody.safeParse(body)
    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    try {
      // Look up the target user
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { roles: true },
      })

      if (!targetUser) {
        return notFound(c, 'User not found')
      }

      // Check if already an artist
      if (targetUser.roles.some((r) => r.role === 'artist')) {
        return conflict(c, 'User already has artist role')
      }

      // Find pending application by email match
      const application = await prisma.artistApplication.findFirst({
        where: { email: targetUser.email, status: 'pending' },
      })

      if (!application) {
        return notFound(c, 'No pending application found for this user')
      }

      // Generate unique slug
      const baseSlug = generateSlug(targetUser.fullName)
      const slug = await ensureUniqueSlug(prisma, baseSlug)

      // Execute approval in a transaction
      const profile = await prisma.$transaction(async (tx) => {
        // 1. Update application status
        await tx.artistApplication.update({
          where: { id: application.id },
          data: {
            status: 'approved',
            reviewedBy: adminUser.id,
            reviewedAt: new Date(),
            reviewNotes: parsed.data.reviewNotes ?? null,
          },
        })

        // 2. Create artist profile
        const newProfile = await tx.artistProfile.create({
          data: {
            userId: targetUser.id,
            displayName: targetUser.fullName,
            slug,
            bio: application.statement ?? '',
            location: '',
            originZip: '',
          },
        })

        // 3. Grant artist role
        await tx.userRole.create({
          data: {
            userId: targetUser.id,
            role: 'artist',
            grantedBy: adminUser.id,
          },
        })

        return newProfile
      })

      logger.info('Artist application approved', {
        userId: targetUser.id,
        profileId: profile.id,
        slug: profile.slug,
        approvedBy: adminUser.id,
        durationMs: Date.now() - start,
      })

      // Send acceptance email (fire-and-forget)
      sendEmail({
        to: targetUser.email,
        subject: 'Welcome to Surfaced Art',
        template: createElement(ArtistAcceptance, { artistName: targetUser.fullName }),
      }).catch((err) => {
        logger.error('Failed to send acceptance email', {
          userId: targetUser.id,
          error: err instanceof Error ? err.message : String(err),
        })
      })

      const response: AdminApproveResponse = {
        message: 'Artist application approved successfully',
        profile: {
          id: profile.id,
          slug: profile.slug,
          displayName: profile.displayName,
        },
      }

      return c.json(response)
    } catch (err) {
      logger.error('Artist approval failed', {
        userId,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
      })
      return internalError(c)
    }
  })

  /**
   * POST /admin/artists/:userId/reject
   * Reject an artist application: update application status and send notification.
   */
  admin.post('/artists/:userId/reject', async (c) => {
    const start = Date.now()
    const adminUser = c.get('user')
    const { userId } = c.req.param()

    const body = await c.req.json().catch(() => ({}))
    const parsed = adminReviewBody.safeParse(body)
    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    try {
      // Look up the target user
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!targetUser) {
        return notFound(c, 'User not found')
      }

      // Find pending application by email match
      const application = await prisma.artistApplication.findFirst({
        where: { email: targetUser.email, status: 'pending' },
      })

      if (!application) {
        return notFound(c, 'No pending application found for this user')
      }

      // Update application status
      await prisma.artistApplication.update({
        where: { id: application.id },
        data: {
          status: 'rejected',
          reviewedBy: adminUser.id,
          reviewedAt: new Date(),
          reviewNotes: parsed.data.reviewNotes ?? null,
        },
      })

      logger.info('Artist application rejected', {
        userId: targetUser.id,
        applicationId: application.id,
        rejectedBy: adminUser.id,
        durationMs: Date.now() - start,
      })

      // Send rejection email (fire-and-forget)
      sendEmail({
        to: targetUser.email,
        subject: 'Update on Your Surfaced Art Application',
        template: createElement(ArtistRejection, { artistName: targetUser.fullName }),
      }).catch((err) => {
        logger.error('Failed to send rejection email', {
          userId: targetUser.id,
          error: err instanceof Error ? err.message : String(err),
        })
      })

      const response: AdminRejectResponse = {
        message: 'Artist application rejected',
      }

      return c.json(response)
    } catch (err) {
      logger.error('Artist rejection failed', {
        userId,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
      })
      return internalError(c)
    }
  })

  return admin
}

/**
 * Generate a unique slug by appending a numeric suffix if needed.
 */
async function ensureUniqueSlug(prisma: PrismaClient, baseSlug: string): Promise<string> {
  let slug = baseSlug
  let suffix = 1

  while (true) {
    const existing = await prisma.artistProfile.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!existing) return slug

    suffix++
    slug = `${baseSlug}-${suffix}`
  }
}
