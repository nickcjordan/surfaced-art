import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logAdminAction } from './audit'
import type { PrismaClient } from '@surfaced-art/db'

// Suppress logger output during tests
vi.mock('@surfaced-art/utils', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

import { logger } from '@surfaced-art/utils'

// ─── Test helpers ────────────────────────────────────────────────────

function createMockPrisma(overrides?: { createRejects?: boolean }) {
  return {
    adminAuditLog: {
      create: overrides?.createRejects
        ? vi.fn().mockRejectedValue(new Error('DB connection failed'))
        : vi.fn().mockResolvedValue({ id: 'audit-uuid-1' }),
    },
  } as unknown as PrismaClient
}

describe('logAdminAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should write an audit log entry with all required fields', async () => {
    const prisma = createMockPrisma()

    await logAdminAction(prisma, {
      adminId: 'admin-uuid-123',
      action: 'artist.approve',
      targetType: 'application',
      targetId: 'app-uuid-456',
    })

    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith({
      data: {
        adminId: 'admin-uuid-123',
        action: 'artist.approve',
        targetType: 'application',
        targetId: 'app-uuid-456',
        details: undefined,
        ipAddress: undefined,
      },
    })
  })

  it('should include optional details and ipAddress when provided', async () => {
    const prisma = createMockPrisma()

    await logAdminAction(prisma, {
      adminId: 'admin-uuid-123',
      action: 'artist.suspend',
      targetType: 'artist',
      targetId: 'artist-uuid-789',
      details: { reason: 'Terms violation', previousStatus: 'approved' },
      ipAddress: '192.168.1.1',
    })

    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith({
      data: {
        adminId: 'admin-uuid-123',
        action: 'artist.suspend',
        targetType: 'artist',
        targetId: 'artist-uuid-789',
        details: { reason: 'Terms violation', previousStatus: 'approved' },
        ipAddress: '192.168.1.1',
      },
    })
  })

  it('should never throw — swallows errors silently', async () => {
    const prisma = createMockPrisma({ createRejects: true })

    // Should not throw
    await expect(
      logAdminAction(prisma, {
        adminId: 'admin-uuid-123',
        action: 'artist.approve',
        targetType: 'application',
        targetId: 'app-uuid-456',
      })
    ).resolves.toBeUndefined()
  })

  it('should log error to CloudWatch when DB write fails', async () => {
    const prisma = createMockPrisma({ createRejects: true })

    await logAdminAction(prisma, {
      adminId: 'admin-uuid-123',
      action: 'artist.approve',
      targetType: 'application',
      targetId: 'app-uuid-456',
    })

    expect(logger.error).toHaveBeenCalledWith(
      'Failed to write admin audit log',
      expect.objectContaining({
        adminId: 'admin-uuid-123',
        action: 'artist.approve',
        targetType: 'application',
        targetId: 'app-uuid-456',
        error: 'DB connection failed',
      })
    )
  })

  it('should handle non-Error rejection objects gracefully', async () => {
    const prisma = {
      adminAuditLog: {
        create: vi.fn().mockRejectedValue('string error'),
      },
    } as unknown as PrismaClient

    await expect(
      logAdminAction(prisma, {
        adminId: 'admin-uuid-123',
        action: 'listing.hide',
        targetType: 'listing',
        targetId: 'listing-uuid-999',
      })
    ).resolves.toBeUndefined()

    expect(logger.error).toHaveBeenCalledWith(
      'Failed to write admin audit log',
      expect.objectContaining({
        error: 'string error',
      })
    )
  })
})
