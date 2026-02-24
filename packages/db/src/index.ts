import { PrismaClient } from './generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'

// Create a global PrismaClient instance to prevent multiple instances in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    // AWS RDS uses Amazon-issued certificates not in Node.js's default trust store.
    // The pg driver validates certificates by default (rejectUnauthorized: true),
    // causing P1010 DatabaseAccessDenied errors. Since Lambda and RDS communicate
    // within the same private VPC, disabling certificate validation is safe —
    // traffic is still TLS-encrypted, just without certificate pinning.
    ssl: process.env.NODE_ENV !== 'development' ? { rejectUnauthorized: false } : false,
  })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Re-export Prisma types
export * from './generated/prisma/client.js'

// Export the client instance as default
export default prisma
