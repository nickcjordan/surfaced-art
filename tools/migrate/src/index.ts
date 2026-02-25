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
  command: 'migrate' | 'reset-baseline' | 'force-reapply-baseline'
}

interface MigrateResult {
  success: boolean
  error?: string
}

export const handler = async (event: MigrateEvent): Promise<MigrateResult> => {
  const validCommands = ['migrate', 'reset-baseline', 'force-reapply-baseline']
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

  // force-reapply-baseline: deletes the baseline record from
  // _prisma_migrations then runs migrate deploy, which will see the
  // baseline as pending and execute its SQL. Use when the migration is
  // recorded as "applied" but the actual tables are missing (e.g. after
  // a database recreate) and reset-baseline fails because Prisma only
  // allows --rolled-back on migrations in a failed state.
  if (event.command === 'force-reapply-baseline') {
    try {
      // Use prisma db execute to run raw SQL that removes the stale record
      const deleteSql = `DELETE FROM _prisma_migrations WHERE migration_name = '${BASELINE_MIGRATION}';`
      execSync(
        `echo "${deleteSql}" | ${PRISMA_CMD} db execute --stdin`,
        { ...execOpts, shell: '/bin/sh' }
      )
      console.log('Deleted baseline record from _prisma_migrations')

      // Now run migrate deploy — it will see the baseline as pending
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
