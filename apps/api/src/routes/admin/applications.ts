import { Hono } from 'hono'
import { Prisma } from '@surfaced-art/db'
import type { PrismaClient } from '@surfaced-art/db'
import { logger, generateSlug, isReservedSlug } from '@surfaced-art/utils'
import { adminReviewBody, adminApplicationsQuery } from '@surfaced-art/types'
import type {
  AdminApproveResponse,
  AdminRejectResponse,
  AdminApplicationListItem,
  AdminApplicationDetailResponse,
  PaginatedResponse,
} from '@surfaced-art/types'
import { sendEmail, ArtistAcceptance, ArtistRejection } from '@surfaced-art/email'
import type { AuthUser } from '../../middleware/auth'
import { notFound, conflict, validationError, internalError } from '../../errors'
import { logAdminAction } from '../../lib/audit'
import { createElement } from 'react'

/**
 * Look up a reviewer's display name by user ID.
 * Returns null if no reviewer or user not found.
 */
async function getReviewerName(prisma: PrismaClient, reviewedBy: string | null): Promise<string | null> {
  if (!reviewedBy) return null
  const reviewer = await prisma.user.findUnique({
    where: { id: reviewedBy },
    select: { fullName: true },
  })
  return reviewer?.fullName ?? null
}

export function createAdminApplicationRoutes(prisma: PrismaClient) {
  const app = new Hono<{ Variables: { user: AuthUser } }>()

  /**
   * GET /admin/applications
   * Paginated list of all applications with optional status/search filters.
   */
  app.get('/applications', async (c) => {
    const start = Date.now()

    const parsed = adminApplicationsQuery.safeParse({
      status: c.req.query('status'),
      search: c.req.query('search'),
      page: c.req.query('page'),
      limit: c.req.query('limit'),
    })

    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    const { status, search, page, limit } = parsed.data
    const skip = (page - 1) * limit

    const where: Prisma.ArtistApplicationWhereInput = {}

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [applications, total] = await Promise.all([
      prisma.artistApplication.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' },
      }),
      prisma.artistApplication.count({ where }),
    ])

    // Resolve reviewer names for reviewed applications
    const reviewerIds = [...new Set(
      applications
        .map((a) => a.reviewedBy)
        .filter((id): id is string => id !== null),
    )]
    const reviewerNames = new Map<string, string>()
    for (const id of reviewerIds) {
      const name = await getReviewerName(prisma, id)
      if (name) reviewerNames.set(id, name)
    }

    const data: AdminApplicationListItem[] = applications.map((a) => ({
      id: a.id,
      email: a.email,
      fullName: a.fullName,
      categories: a.categories,
      status: a.status,
      submittedAt: a.submittedAt.toISOString(),
      reviewedBy: a.reviewedBy,
      reviewedAt: a.reviewedAt?.toISOString() ?? null,
      reviewerName: a.reviewedBy ? (reviewerNames.get(a.reviewedBy) ?? null) : null,
    }))

    const response: PaginatedResponse<AdminApplicationListItem> = {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }

    logger.info('Admin applications listed', {
      page,
      limit,
      total,
      status: status ?? null,
      durationMs: Date.now() - start,
    })

    return c.json(response)
  })

  /**
   * GET /admin/applications/stats
   * Counts of applications by status for KPI display.
   */
  app.get('/applications/stats', async (c) => {
    const [pending, approved, rejected] = await Promise.all([
      prisma.artistApplication.count({ where: { status: 'pending' } }),
      prisma.artistApplication.count({ where: { status: 'approved' } }),
      prisma.artistApplication.count({ where: { status: 'rejected' } }),
    ])

    return c.json({ pending, approved, rejected })
  })

  /**
   * GET /admin/applications/:id
   * Full detail of a single application, including reviewer name.
   */
  app.get('/applications/:id', async (c) => {
    const start = Date.now()
    const { id } = c.req.param()

    const application = await prisma.artistApplication.findUnique({
      where: { id },
    })

    if (!application) {
      return notFound(c, 'Application not found')
    }

    const reviewerName = await getReviewerName(prisma, application.reviewedBy)

    const response: AdminApplicationDetailResponse = {
      id: application.id,
      email: application.email,
      fullName: application.fullName,
      instagramUrl: application.instagramUrl,
      websiteUrl: application.websiteUrl,
      statement: application.statement,
      exhibitionHistory: application.exhibitionHistory,
      categories: application.categories,
      status: application.status,
      submittedAt: application.submittedAt.toISOString(),
      reviewedBy: application.reviewedBy,
      reviewedAt: application.reviewedAt?.toISOString() ?? null,
      reviewerName,
      reviewNotes: application.reviewNotes,
    }

    logger.info('Admin application detail fetched', {
      applicationId: id,
      durationMs: Date.now() - start,
    })

    return c.json(response)
  })

  /**
   * POST /admin/artists/:userId/approve
   * Approve an artist application: update application status, create profile, grant role.
   */
  app.post('/artists/:userId/approve', async (c) => {
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

        // 2. Create artist profile (auto-approved — application review is the vetting step)
        const newProfile = await tx.artistProfile.create({
          data: {
            userId: targetUser.id,
            displayName: targetUser.fullName,
            slug,
            bio: application.statement ?? '',
            location: '',
            originZip: '',
            status: 'approved',
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

      // Audit log (fire-and-forget)
      void logAdminAction(prisma, {
        adminId: adminUser.id,
        action: 'application_approve',
        targetType: 'user',
        targetId: targetUser.id,
        details: { applicationId: application.id, slug: profile.slug },
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
  app.post('/artists/:userId/reject', async (c) => {
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

      // Audit log (fire-and-forget)
      void logAdminAction(prisma, {
        adminId: adminUser.id,
        action: 'application_reject',
        targetType: 'user',
        targetId: targetUser.id,
        details: { applicationId: application.id },
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

  /**
   * DELETE /admin/applications/:id
   * Permanently delete an application. Only pending or rejected applications can be deleted.
   * Approved applications cannot be deleted because they have associated artist profiles.
   */
  app.delete('/applications/:id', async (c) => {
    const start = Date.now()
    const adminUser = c.get('user')
    const { id } = c.req.param()

    const application = await prisma.artistApplication.findUnique({
      where: { id },
    })

    if (!application) {
      return notFound(c, 'Application not found')
    }

    if (application.status === 'approved') {
      return conflict(c, 'Cannot delete an approved application. The associated artist profile must be removed first.')
    }

    try {
      await prisma.artistApplication.delete({
        where: { id },
      })
    } catch (err) {
      // Handle race condition: another admin deleted between findUnique and delete
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        return notFound(c, 'Application not found')
      }
      throw err
    }

    // Audit log (fire-and-forget)
    void logAdminAction(prisma, {
      adminId: adminUser.id,
      action: 'application_delete',
      targetType: 'application',
      targetId: id,
      details: { email: application.email, fullName: application.fullName, status: application.status },
    })

    logger.info('Admin application deleted', {
      applicationId: id,
      email: application.email,
      deletedBy: adminUser.id,
      durationMs: Date.now() - start,
    })

    return c.json({ message: 'Application deleted successfully' })
  })

  return app
}

/**
 * Generate a unique slug by appending a numeric suffix if needed.
 * Skips reserved slugs (platform routes, brand terms, profanity).
 */
async function ensureUniqueSlug(prisma: PrismaClient, baseSlug: string): Promise<string> {
  let slug = baseSlug
  let suffix = 0

  while (true) {
    // Skip reserved slugs (platform routes, brand terms, profanity)
    if (isReservedSlug(slug)) {
      suffix++
      slug = `${baseSlug}-${suffix}`
      continue
    }

    const existing = await prisma.artistProfile.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!existing) return slug

    suffix++
    slug = `${baseSlug}-${suffix}`
  }
}
