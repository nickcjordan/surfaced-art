import { execSync } from 'child_process'
import fs from 'node:fs'

const LAMBDA_ROOT = process.env.LAMBDA_TASK_ROOT ?? '/var/task'

// prisma is a direct dependency of @surfaced-art/migrate, so it resolves
// at the standard node_modules path — no workspace hoisting hacks needed.
const PRISMA_CLI = `${LAMBDA_ROOT}/node_modules/prisma/build/index.js`
const PRISMA_CMD = `node ${PRISMA_CLI}`

// The baseline migration was created from the initial schema that was
// bootstrapped with `prisma db push`. Configurable via env var so schema
// changes or baseline regeneration don't require code changes.
const BASELINE_MIGRATION =
  process.env.BASELINE_MIGRATION ?? '20250101000000_baseline'

interface MigrateEvent {
  command: 'migrate' | 'reset-baseline' | 'force-reapply-baseline' | 'seed'
}

interface MigrateResult {
  success: boolean
  error?: string
}

export const handler = async (event: MigrateEvent): Promise<MigrateResult> => {
  const validCommands = ['migrate', 'reset-baseline', 'force-reapply-baseline', 'seed']
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

  // force-reapply-baseline: recovers a database that is in any of these states:
  //   1. Completely fresh (no schema, no _prisma_migrations table)
  //   2. Partially initialised (some types/tables exist, migrations in failed state)
  //   3. Fully initialised but subsequent migrations failed
  //
  // Strategy:
  //   a. Resolve any failed/in-progress migration records as rolled-back (clears P3009)
  //   b. Check whether the baseline tables actually exist in the DB
  //   c. If they exist → mark baseline as applied (skip re-running its SQL)
  //      If they don't → delete the baseline record so migrate deploy re-runs it
  //   d. Run migrate deploy
  if (event.command === 'force-reapply-baseline') {
    try {
      // Step a: resolve any failed/in-progress migrations as rolled-back
      const resolveFailedSql = `UPDATE _prisma_migrations SET rolled_back_at = now() WHERE finished_at IS NULL AND rolled_back_at IS NULL AND started_at IS NOT NULL;`
      try {
        execSync(
          `echo "${resolveFailedSql}" | ${PRISMA_CMD} db execute --stdin`,
          { ...execOpts, shell: '/bin/sh' }
        )
        console.log('Resolved any in-progress/failed migrations as rolled-back')
      } catch {
        console.log('No _prisma_migrations table yet (fresh DB), skipping resolve step')
      }

      // Step b: check if baseline tables exist (use "users" as the canonical indicator)
      let baselineTablesExist = false
      try {
        const checkSql = `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users');`
        const result = execSync(
          `echo "${checkSql}" | ${PRISMA_CMD} db execute --stdin`,
          { ...execOpts, shell: '/bin/sh' }
        )
        baselineTablesExist = String(result).includes('true')
        console.log(`Baseline tables exist: ${baselineTablesExist}`)
      } catch {
        console.log('Could not check baseline tables, assuming they do not exist')
      }

      if (baselineTablesExist) {
        // Step c (tables exist): mark baseline as applied so migrate deploy skips its SQL
        try {
          execSync(
            `${PRISMA_CMD} migrate resolve --applied ${BASELINE_MIGRATION}`,
            execOpts
          )
          console.log('Baseline marked as applied (tables already exist)')
        } catch (resolveErr: unknown) {
          const msg = resolveErr instanceof Error ? resolveErr.message : String(resolveErr)
          if (msg.includes('already recorded') || msg.includes('already been applied')) {
            console.log('Baseline already applied, skipping')
          } else {
            console.error('Baseline resolve failed:', msg)
            return { success: false, error: `Baseline resolve failed: ${msg}` }
          }
        }
      } else {
        // Step c (tables missing): delete the baseline record so migrate deploy re-runs its SQL
        const deleteSql = `DELETE FROM _prisma_migrations WHERE migration_name = '${BASELINE_MIGRATION}';`
        try {
          execSync(
            `echo "${deleteSql}" | ${PRISMA_CMD} db execute --stdin`,
            { ...execOpts, shell: '/bin/sh' }
          )
          console.log('Deleted baseline record — baseline SQL will be re-executed')
        } catch {
          console.log('No baseline record to delete (fresh DB), continuing')
        }
      }

      // Step d: run migrate deploy
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
  // will re-run its SQL. Use when the _prisma_migrations table records
  // the baseline as applied but the actual tables are missing (e.g. after
  // a database recreate).
  if (event.command === 'reset-baseline') {
    try {
      const output = execSync(
        `${PRISMA_CMD} migrate resolve --rolled-back ${BASELINE_MIGRATION}`,
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

  try {
    // Mark the baseline migration as already applied (DB was created
    // with db push). No-ops after the first successful run; Prisma
    // errors with "already recorded" once the baseline is in the table.
    try {
      execSync(
        `${PRISMA_CMD} migrate resolve --applied ${BASELINE_MIGRATION}`,
        execOpts
      )
      console.log('Baseline migration marked as applied')
    } catch (resolveErr: unknown) {
      const msg =
        resolveErr instanceof Error ? resolveErr.message : String(resolveErr)
      if (
        msg.includes('already recorded') ||
        msg.includes('already been applied')
      ) {
        console.log('Baseline already applied, skipping')
      } else {
        console.error('Baseline resolve failed:', msg)
        return { success: false, error: `Baseline resolve failed: ${msg}` }
      }
    }

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
