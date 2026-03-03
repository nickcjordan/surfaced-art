/**
 * Grant or revoke the `admin` role for an existing user by email.
 *
 * This solves the bootstrap problem: someone must be admin before the
 * admin API can be used, but nobody is admin yet.  Run this script
 * once against the production database to promote the first admin.
 *
 * Prerequisites:
 *   - DATABASE_URL environment variable must be set
 *   - The target user must already exist (i.e. they signed up via Cognito)
 *
 * Usage:
 *   npx tsx scripts/grant-admin.ts --email admin@example.com
 *   npx tsx scripts/grant-admin.ts --email admin@example.com --revoke
 */

import { PrismaClient } from '../packages/db/src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(): { email: string; revoke: boolean } {
  const args = process.argv.slice(2)
  let email: string | undefined
  let revoke = false

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) {
      email = args[i + 1]
      i++ // skip next arg (the value)
    } else if (args[i] === '--revoke') {
      revoke = true
    }
  }

  if (!email) {
    console.error(
      'Usage:\n' +
        '  npx tsx scripts/grant-admin.ts --email <email>\n' +
        '  npx tsx scripts/grant-admin.ts --email <email> --revoke'
    )
    process.exit(1)
  }

  return { email, revoke }
}

// ---------------------------------------------------------------------------
// Database connection
// ---------------------------------------------------------------------------

if (!process.env.DATABASE_URL) {
  console.error(
    'ERROR: DATABASE_URL environment variable is not set.\n' +
      'Set it in your .env file or export it before running:\n' +
      '  export DATABASE_URL="postgresql://user:password@host:5432/dbname"\n' +
      '  npx tsx scripts/grant-admin.ts --email admin@example.com'
  )
  process.exit(1)
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// ---------------------------------------------------------------------------
// Grant / Revoke logic
// ---------------------------------------------------------------------------

async function grantAdmin(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    console.error(
      `ERROR: No user found with email "${email}".\n` +
        'The user must sign up (via Cognito) before they can be granted admin.'
    )
    process.exit(1)
  }

  // Check if the role already exists (idempotent)
  const existing = await prisma.userRole.findUnique({
    where: { userId_role: { userId: user.id, role: 'admin' } },
  })

  if (existing) {
    console.log(`User "${email}" is already an admin. No changes made.`)
    return
  }

  await prisma.userRole.create({
    data: {
      userId: user.id,
      role: 'admin',
      grantedBy: null, // system-granted (bootstrap)
    },
  })

  console.log(`Admin role granted to "${email}".`)
}

async function revokeAdmin(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    console.error(
      `ERROR: No user found with email "${email}".\n` +
        'The user must sign up (via Cognito) before their roles can be managed.'
    )
    process.exit(1)
  }

  const existing = await prisma.userRole.findUnique({
    where: { userId_role: { userId: user.id, role: 'admin' } },
  })

  if (!existing) {
    console.log(`User "${email}" does not have the admin role. No changes made.`)
    return
  }

  await prisma.userRole.delete({
    where: { userId_role: { userId: user.id, role: 'admin' } },
  })

  console.log(`Admin role revoked from "${email}".`)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const { email, revoke } = parseArgs()

const action = revoke ? revokeAdmin : grantAdmin

action(email)
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e: unknown) => {
    console.error('Unexpected error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
