import { Hono } from 'hono'
import type { PrismaClient } from '@surfaced-art/db'
import { logger } from '@surfaced-art/utils'
import { adminBulkListingStatusBody, adminBulkRoleGrantBody } from '@surfaced-art/types'
import type {
  AdminBulkStatusResponse,
  AdminBulkRoleGrantResponse,
} from '@surfaced-art/types'
import type { AuthUser } from '../../middleware/auth'
import { validationError } from '../../errors'
import { logAdminAction } from '../../lib/audit'
import { triggerRevalidation } from '../../lib/revalidation'

export function createAdminBulkRoutes(prisma: PrismaClient) {
  const app = new Hono<{ Variables: { user: AuthUser } }>()

  /**
   * POST /admin/listings/bulk-status
   * Change status of multiple listings at once (max 100).
   * Processed in a transaction. Each change audit-logged.
   */
  app.post('/listings/bulk-status', async (c) => {
    const start = Date.now()
    const adminUser = c.get('user')

    const body = await c.req.json().catch(() => ({}))
    const parsed = adminBulkListingStatusBody.safeParse(body)
    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    const { listingIds, status, reason } = parsed.data

    // Find which listings actually exist
    const existingListings = await prisma.listing.findMany({
      where: { id: { in: listingIds } },
      select: { id: true, category: true, artist: { select: { slug: true } } },
    })

    const existingIds = new Set(existingListings.map((l) => l.id))
    const failed: { id: string; error: string }[] = []

    // Report not-found IDs
    for (const id of listingIds) {
      if (!existingIds.has(id)) {
        failed.push({ id, error: 'Listing not found' })
      }
    }

    const idsToUpdate = listingIds.filter((id) => existingIds.has(id))

    // Update in transaction
    let updated = 0
    if (idsToUpdate.length > 0) {
      const result = await prisma.$transaction(async (tx) => {
        return tx.listing.updateMany({
          where: { id: { in: idsToUpdate } },
          data: { status: status as Parameters<typeof tx.listing.updateMany>[0]['data']['status'] },
        })
      })
      updated = result.count
    }

    // Audit log (fire-and-forget)
    void logAdminAction(prisma, {
      adminId: adminUser.id,
      action: 'listing_bulk_status',
      targetType: 'listing',
      targetId: idsToUpdate[0] ?? listingIds[0] ?? 'bulk',
      details: {
        listingIds: idsToUpdate,
        status,
        reason,
        updated,
        failed: failed.length,
      },
    })

    // Trigger ISR revalidation for affected listings
    for (const listing of existingListings) {
      if (idsToUpdate.includes(listing.id)) {
        triggerRevalidation({
          type: 'listing',
          id: listing.id,
          category: listing.category,
          artistSlug: listing.artist.slug,
        })
      }
    }

    const response: AdminBulkStatusResponse = { updated, failed }

    logger.info('Admin bulk listing status change', {
      requested: listingIds.length,
      updated,
      failed: failed.length,
      status,
      changedBy: adminUser.id,
      durationMs: Date.now() - start,
    })

    return c.json(response)
  })

  /**
   * POST /admin/users/bulk-role
   * Grant a role to multiple users at once (max 100).
   * Skips users who already have the role.
   */
  app.post('/users/bulk-role', async (c) => {
    const start = Date.now()
    const adminUser = c.get('user')

    const body = await c.req.json().catch(() => ({}))
    const parsed = adminBulkRoleGrantBody.safeParse(body)
    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    const { userIds, role } = parsed.data

    // Find which users exist
    const existingUsers = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true },
    })

    const existingUserIds = new Set(existingUsers.map((u) => u.id))
    const failed: { id: string; error: string }[] = []

    // Report not-found users
    for (const id of userIds) {
      if (!existingUserIds.has(id)) {
        failed.push({ id, error: 'User not found' })
      }
    }

    const validUserIds = userIds.filter((id) => existingUserIds.has(id))

    // Find which users already have the role
    const existingRoles = await prisma.userRole.findMany({
      where: { userId: { in: validUserIds }, role },
      select: { userId: true },
    })

    const alreadyHasRole = new Set(existingRoles.map((r) => r.userId))
    const skipped = validUserIds.filter((id) => alreadyHasRole.has(id)).length
    const toGrant = validUserIds.filter((id) => !alreadyHasRole.has(id))

    // Create roles for users who don't have them yet
    let granted = 0
    if (toGrant.length > 0) {
      await prisma.userRole.createMany({
        data: toGrant.map((userId) => ({
          userId,
          role,
          grantedBy: adminUser.id,
        })),
      })
      granted = toGrant.length
    }

    // Audit log (fire-and-forget)
    void logAdminAction(prisma, {
      adminId: adminUser.id,
      action: 'user_bulk_role_grant',
      targetType: 'user',
      targetId: toGrant[0] ?? validUserIds[0] ?? userIds[0] ?? 'bulk',
      details: {
        userIds: toGrant,
        role,
        granted,
        skipped,
        failed: failed.length,
      },
    })

    const response: AdminBulkRoleGrantResponse = { granted, skipped, failed }

    logger.info('Admin bulk role grant', {
      requested: userIds.length,
      granted,
      skipped,
      failed: failed.length,
      role,
      grantedBy: adminUser.id,
      durationMs: Date.now() - start,
    })

    return c.json(response)
  })

  return app
}
