import { execSync } from 'child_process'
import fs from 'node:fs'

const LAMBDA_ROOT = process.env.LAMBDA_TASK_ROOT ?? '/var/task'

// prisma is a direct dependency of @surfaced-art/migrate, so it resolves
// at the standard node_modules path — no workspace hoisting hacks needed.
const PRISMA_CLI = `${LAMBDA_ROOT}/node_modules/prisma/build/index.js`
const PRISMA_CMD = `node ${PRISMA_CLI}`

interface MigrateEvent {
  command: 'migrate' | 'force-reapply-baseline' | 'reset-baseline' | 'resolve-rolled-back' | 'seed'
  migration?: string
}

interface MigrateResult {
  success: boolean
  error?: string
}

export const handler = async (event: MigrateEvent): Promise<MigrateResult> => {
  const validCommands = ['migrate', 'force-reapply-baseline', 'reset-baseline', 'resolve-rolled-back', 'seed']
  if (!validCommands.includes(event.command)) {
    return { success: false, error: `Unknown command: ${event.command}` }
  }

  if (!fs.existsSync(LAMBDA_ROOT)) {
    return {
      success: false,
      error: `Invalid LAMBDA_TASK_ROOT: ${LAMBDA_ROOT} (directory does not exist)`,
    }
  }

  if (!fs.existsSync(PRISMA_CLI)) {
    return {
      success: false,
      error: `Prisma CLI not found at expected path: ${PRISMA_CLI}`,
    }
  }

  const execOpts = { cwd: LAMBDA_ROOT, encoding: 'utf-8' as const }

  // seed: populates the database with initial artist/listing data.
  // Delegates to seed-safe.ts which enforces a production safety check:
  // it queries the users table and refuses to run if any non-seed users
  // exist (cognito_id NOT LIKE 'seed-%'). Once real users sign up via
  // Cognito, seeding becomes impossible without manual DB intervention —
  // this is intentional to prevent accidental data overwrites.
  if (event.command === 'seed') {
    try {
      const tsxPath = `${LAMBDA_ROOT}/node_modules/.bin/tsx`
      const seedScript = `${LAMBDA_ROOT}/prisma/seed-safe.ts`

      if (!fs.existsSync(seedScript)) {
        return {
          success: false,
          error: `Seed script not found at ${seedScript}. Ensure the Dockerfile copies prisma/seed-safe.ts.`,
        }
      }

      const output = execSync(
        `node ${tsxPath} ${seedScript}`,
        execOpts
      )
      console.log('Seed output:', output)
      return { success: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('Seed failed:', message)
      return { success: false, error: message }
    }
  }

  // force-reapply-baseline: wipes the schema and runs all migrations from
  // scratch. Use on dev/staging when the database is in a broken state and
  // you want a clean rebuild. Never run in prod CI — use migrate instead.
  if (event.command === 'force-reapply-baseline') {
    try {
      const sql = `DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO PUBLIC;`
      execSync(
        `echo "${sql}" | ${PRISMA_CMD} db execute --stdin`,
        { ...execOpts, shell: '/bin/sh' }
      )
      console.log('Schema wiped — running all migrations from scratch')
      const output = execSync(`${PRISMA_CMD} migrate deploy`, execOpts)
      console.log('Migration output:', output)
      return { success: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('Force reapply baseline failed:', message)
      return { success: false, error: message }
    }
  }

  // reset-baseline: marks the baseline as rolled back so migrate deploy
  // will re-run its SQL. Retained for manual recovery edge cases.
  if (event.command === 'reset-baseline') {
    try {
      const output = execSync(
        `${PRISMA_CMD} migrate resolve --rolled-back 20250101000000_baseline`,
        execOpts
      )
      console.log('Baseline marked as rolled back:', output)
      return { success: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('Reset baseline failed:', message)
      return { success: false, error: message }
    }
  }

  // resolve-rolled-back: marks a failed migration as rolled back so
  // migrate deploy can re-apply it with corrected SQL. Requires the
  // migration name in event.migration.
  if (event.command === 'resolve-rolled-back') {
    if (!event.migration) {
      return { success: false, error: 'resolve-rolled-back requires a "migration" field with the migration name' }
    }
    // Validate migration name to prevent command injection (alphanumeric + underscores only)
    if (!/^[\w]+$/.test(event.migration)) {
      return { success: false, error: `Invalid migration name: ${event.migration}. Only alphanumeric characters and underscores are allowed.` }
    }
    try {
      const output = execSync(
        `${PRISMA_CMD} migrate resolve --rolled-back ${event.migration}`,
        execOpts
      )
      console.log('Migration marked as rolled back:', output)
      return { success: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('Resolve rolled-back failed:', message)
      return { success: false, error: message }
    }
  }

  // migrate: standard deployment migration — runs all pending migrations.
  // Works correctly on any clean database (fresh RDS, post-reset-schema).
  try {
    const output = execSync(`${PRISMA_CMD} migrate deploy`, execOpts)
    console.log('Migration output:', output)
    return { success: true }
  } catch (err: unknown) {
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      return {
        success: false,
        error: `Prisma CLI not found at ${PRISMA_CLI} (ENOENT). Check LAMBDA_TASK_ROOT and deployment artifacts.`,
      }
    }
    const message = err instanceof Error ? err.message : String(err)
    console.error('Migration failed:', message)
    return { success: false, error: message }
  }
}
