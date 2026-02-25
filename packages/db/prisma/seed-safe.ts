/**
 * Safe seed wrapper for Lambda invocation.
 *
 * This script wraps the shared seed logic with a production safety check:
 * before seeding, it queries the users table and aborts if any non-seed
 * users exist (cognito_id NOT LIKE 'seed-%'). This prevents accidental
 * overwrites once real users have signed up.
 *
 * The underlying seed logic uses upsert for users/profiles (idempotent)
 * but deletes and re-creates listings, categories, CV entries, and process
 * media per artist. That delete-recreate pattern is safe for seed data
 * but would destroy real user-created listings — hence the safety guard.
 */
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { artistConfigs } from './seed-data'
import { seedArtist } from './seed-logic'

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set.')
  process.exit(1)
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  // SSL config mirrors packages/db/src/index.ts — in Lambda the
  // NODE_EXTRA_CA_CERTS env var handles RDS CA trust at the runtime level.
  ssl:
    process.env.NODE_ENV === 'development'
      ? false
      : process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false'
        ? { rejectUnauthorized: false }
        : true,
})

const prisma = new PrismaClient({ adapter })

// ============================================================================
// Safety check
// ============================================================================

async function checkSafeToSeed(): Promise<{ safe: boolean; reason?: string }> {
  try {
    const realUsers = await prisma.user.count({
      where: {
        NOT: { cognitoId: { startsWith: 'seed-' } },
      },
    })

    if (realUsers > 0) {
      return {
        safe: false,
        reason:
          `Found ${realUsers} non-seed user(s) in the database. ` +
          'Seeding is blocked to prevent overwriting production data. ' +
          'To re-seed, manually remove real users first or use a fresh database.',
      }
    }

    return { safe: true }
  } catch (err) {
    // If the users table doesn't exist yet, seeding would fail anyway
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('does not exist')) {
      return {
        safe: false,
        reason: 'The users table does not exist. Run migrations first.',
      }
    }
    return { safe: false, reason: `Safety check failed: ${message}` }
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('Running production safety check...')
  const { safe, reason } = await checkSafeToSeed()

  if (!safe) {
    console.error(`SEED BLOCKED: ${reason}`)
    process.exit(1)
  }

  console.log('Safety check passed. Starting seed...')

  for (const config of artistConfigs) {
    const result = await prisma.$transaction(async (tx) => {
      return seedArtist(tx, config)
    })
    console.log(`  Seeded artist: ${result.profile.displayName} (${result.profile.slug})`)
  }

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
