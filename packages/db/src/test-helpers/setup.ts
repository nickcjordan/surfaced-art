import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PACKAGE_ROOT = path.resolve(__dirname, '../../')

let container: StartedPostgreSqlContainer | null = null
let prismaClient: PrismaClient | null = null

/**
 * Start a disposable PostgreSQL container and run Prisma migrations.
 * Call this in `beforeAll` of integration test suites.
 * Returns a connected PrismaClient instance.
 */
export async function setupTestDatabase(): Promise<PrismaClient> {
  // Start PostgreSQL container (matches production RDS version)
  container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('surfaced_art_test')
    .withUsername('test')
    .withPassword('test')
    .start()

  const connectionString = container.getConnectionUri()

  // Run Prisma migrations against the test container.
  // cwd must be packages/db so Prisma 7.x can locate prisma.config.ts.
  execSync('npx prisma migrate deploy', {
    cwd: DB_PACKAGE_ROOT,
    env: { ...process.env, DATABASE_URL: connectionString },
    stdio: 'pipe',
  })

  // Create PrismaClient connected to the test container
  const adapter = new PrismaPg({ connectionString })
  prismaClient = new PrismaClient({
    adapter,
    log: ['error'],
  })

  return prismaClient
}

/**
 * Tear down the test database container.
 * Call this in `afterAll` of integration test suites.
 */
export async function teardownTestDatabase(): Promise<void> {
  if (prismaClient) {
    await prismaClient.$disconnect()
    prismaClient = null
  }
  if (container) {
    await container.stop()
    container = null
  }
}

/**
 * Truncate all tables between tests for isolation.
 * Call this in `beforeEach` of integration test suites.
 * Uses TRUNCATE CASCADE to handle foreign key dependencies.
 */
export async function cleanupDatabase(prisma: PrismaClient): Promise<void> {
  // Tables in reverse dependency order (children first)
  const tables = [
    'commission_updates',
    'commissions',
    'reviews',
    'orders',
    'saves',
    'follows',
    'listing_images',
    'listings',
    'artist_process_media',
    'artist_cv_entries',
    'artist_categories',
    'artist_profiles',
    'user_roles',
    'users',
    'artist_applications',
    'waitlist',
  ]

  // Use raw SQL TRUNCATE with CASCADE for speed and simplicity
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tables.map((t) => `"${t}"`).join(', ')} CASCADE`
  )
}
