import { describe, it, expect } from 'vitest'

// Note: Full integration tests require a database connection
// These are basic smoke tests to verify the module structure

describe('Database Package', () => {
  it('should export prisma client', async () => {
    // Dynamic import to avoid initialization without DATABASE_URL
    const dbModule = await import('./index')
    expect(dbModule).toHaveProperty('prisma')
    expect(dbModule).toHaveProperty('PrismaClient')
  })

  it('should export Prisma types', async () => {
    const dbModule = await import('./index')
    // Verify key Prisma exports are available
    expect(dbModule).toHaveProperty('Prisma')
  })
})
