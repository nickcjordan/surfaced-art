import { readFileSync } from 'fs'
import { PrismaClient } from './generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'

// Create a global PrismaClient instance to prevent multiple instances in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Build the SSL configuration for the pg driver adapter.
 *
 * Strategy (in priority order):
 * 1. Development — no SSL (local PostgreSQL doesn't use it)
 * 2. Explicit CA bundle — if DB_SSL_CA_PATH is set, load it and enable full
 *    certificate verification. In Lambda, NODE_EXTRA_CA_CERTS achieves the
 *    same thing at the runtime level; this option exists for non-Lambda
 *    environments or when finer control is needed.
 * 3. DB_SSL_REJECT_UNAUTHORIZED=false — opt-in escape hatch to disable
 *    certificate verification. This is a deliberate security trade-off:
 *    traffic is still TLS-encrypted but vulnerable to MITM if routing is
 *    compromised. Acceptable in tightly-controlled VPC environments where
 *    CA management is impractical, but not a blanket recommendation.
 * 4. Default — SSL enabled with full certificate verification. Requires
 *    NODE_EXTRA_CA_CERTS to be set in the Lambda environment so Node.js
 *    trusts the Amazon RDS CA certificates.
 */
function buildSslConfig(): boolean | { rejectUnauthorized: boolean; ca?: string } {
  if (process.env.NODE_ENV === 'development') {
    return false
  }

  if (process.env.DB_SSL_CA_PATH) {
    return { rejectUnauthorized: true, ca: readFileSync(process.env.DB_SSL_CA_PATH, 'utf8') }
  }

  if (process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false') {
    return { rejectUnauthorized: false }
  }

  return true
}

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    ssl: buildSslConfig(),
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
