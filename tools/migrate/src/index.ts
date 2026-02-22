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
  command: 'migrate'
}

interface MigrateResult {
  success: boolean
  error?: string
}

export const handler = async (event: MigrateEvent): Promise<MigrateResult> => {
  if (event.command !== 'migrate') {
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
