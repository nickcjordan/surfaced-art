import type { PrismaClient, Prisma } from '@surfaced-art/db'
import { logger } from '@surfaced-art/utils'

export type AuditTargetType =
  | 'user'
  | 'artist'
  | 'listing'
  | 'order'
  | 'application'
  | 'review'
  | 'waitlist'

export interface AuditLogParams {
  adminId: string
  action: string
  targetType: AuditTargetType
  targetId: string
  details?: Prisma.InputJsonValue
  ipAddress?: string
}

/**
 * Fire-and-forget audit log writer.
 * Writes to `admin_audit_log` table. Never throws — on failure,
 * logs the error to CloudWatch as a fallback.
 */
export async function logAdminAction(
  prisma: PrismaClient,
  params: AuditLogParams
): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId: params.adminId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        details: params.details,
        ipAddress: params.ipAddress,
      },
    })
  } catch (err) {
    logger.error('Failed to write admin audit log', {
      adminId: params.adminId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
