import { describe, it, expect } from 'vitest'

// Note: Full integration tests require a database connection.
// These smoke tests verify module structure. The dynamic import
// triggers PrismaClient initialization which attempts a pg connection,
// so we allow extra time for the connection to fail gracefully.

describe('Database Package', () => {
  it('should export prisma client', async () => {
    const dbModule = await import('./index')
    expect(dbModule).toHaveProperty('prisma')
    expect(dbModule).toHaveProperty('PrismaClient')
  }, 15_000)

  it('should export Prisma types', async () => {
    const dbModule = await import('./index')
    // Verify key Prisma exports are available
    expect(dbModule).toHaveProperty('Prisma')
  }, 15_000)
})
