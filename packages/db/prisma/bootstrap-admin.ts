/**
 * Bootstrap admin — grants the admin role to an existing user by email.
 *
 * The user must already exist in the database, meaning they must have
 * signed in at least once via Cognito (which auto-provisions a buyer
 * account via the auth middleware).
 *
 * This script is invoked by the migrate Lambda's `bootstrap-admin` command.
 * It receives the target email via the BOOTSTRAP_EMAIL environment variable.
 *
 * Idempotent: if the user already has the admin role, it logs a message
 * and exits successfully.
 */
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set.')
  process.exit(1)
}

if (!process.env.BOOTSTRAP_EMAIL) {
  console.error('ERROR: BOOTSTRAP_EMAIL is not set.')
  process.exit(1)
}

const email = process.env.BOOTSTRAP_EMAIL

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === 'development'
      ? false
      : process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false'
        ? { rejectUnauthorized: false }
        : true,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  // Find the user by email
  const user = await prisma.user.findUnique({
    where: { email },
    include: { roles: true },
  })

  if (!user) {
    throw new Error(
      `User not found with email ${email}. ` +
      'The user must sign in at least once via Cognito before bootstrapping admin access.'
    )
  }

  // Check if already admin
  const hasAdminRole = user.roles.some((r) => r.role === 'admin')
  if (hasAdminRole) {
    console.log(`User ${email} (${user.id}) already has admin role. No changes made.`)
    return
  }

  // Grant admin role
  await prisma.userRole.create({
    data: {
      userId: user.id,
      role: 'admin',
    },
  })

  console.log(`Admin role granted to ${email} (${user.id}).`)
}

main()
  .catch((err) => {
    console.error(err.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
