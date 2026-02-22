import { execSync } from 'child_process'

const LAMBDA_ROOT = process.env.LAMBDA_TASK_ROOT ?? '/var/task'

// prisma is a direct dependency of @surfaced-art/migrate, so it resolves
// at the standard node_modules path — no workspace hoisting hacks needed.
const PRISMA_CLI = `${LAMBDA_ROOT}/node_modules/prisma/build/index.js`
const PRISMA_CMD = `node ${PRISMA_CLI}`

// The baseline migration was created from the initial schema that was
// bootstrapped with `prisma db push`. It must be marked as "already applied"
// before `prisma migrate deploy` can run, since the tables already exist.
const BASELINE_MIGRATION = '20250101000000_baseline'

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
        console.warn('Baseline resolve failed (proceeding with deploy):', msg)
      }
    }

    const output = execSync(`${PRISMA_CMD} migrate deploy`, execOpts)
    console.log('Migration output:', output)
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Migration failed:', message)
    return { success: false, error: message }
  }
}
