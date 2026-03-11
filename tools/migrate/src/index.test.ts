import { describe, it, expect, vi, beforeEach } from 'vitest'
import { execSync } from 'child_process'
import fs from 'node:fs'

vi.mock('child_process', () => ({
  execSync: vi.fn(),
}))

vi.mock('node:fs', () => ({
  default: { existsSync: vi.fn(() => true) },
}))

const mockedExecSync = vi.mocked(execSync)
const mockedExistsSync = vi.mocked(fs.existsSync)

// Import after mocking so the module picks up the mock
const { handler } = await import('./index')

describe('migrate handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedExistsSync.mockReturnValue(true)
    process.env.LAMBDA_TASK_ROOT = '/var/task'
  })

  it('should return error for unknown commands', async () => {
    const result = await handler({ command: 'unknown' } as Parameters<typeof handler>[0])
    expect(result).toEqual({
      success: false,
      error: 'Unknown command: unknown',
    })
    expect(mockedExecSync).not.toHaveBeenCalled()
  })

  it('should return error when LAMBDA_TASK_ROOT does not exist', async () => {
    mockedExistsSync.mockReturnValueOnce(false)

    const result = await handler({ command: 'migrate' })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid LAMBDA_TASK_ROOT')
    expect(mockedExecSync).not.toHaveBeenCalled()
  })

  it('should return error when Prisma CLI is missing', async () => {
    mockedExistsSync.mockReturnValueOnce(true).mockReturnValueOnce(false)

    const result = await handler({ command: 'migrate' })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Prisma CLI not found')
    expect(mockedExecSync).not.toHaveBeenCalled()
  })

  // --- migrate ---

  it('should run migrate deploy directly', async () => {
    mockedExecSync.mockReturnValue('')

    const result = await handler({ command: 'migrate' })

    expect(result).toEqual({ success: true })
    expect(mockedExecSync).toHaveBeenCalledTimes(1)
    expect(mockedExecSync).toHaveBeenCalledWith(
      expect.stringContaining('migrate deploy'),
      expect.objectContaining({ encoding: 'utf-8' })
    )
  })

  it('should return error when migrate deploy fails', async () => {
    mockedExecSync.mockImplementationOnce(() => {
      throw new Error('migration failed: connection refused')
    })

    const result = await handler({ command: 'migrate' })

    expect(result).toEqual({
      success: false,
      error: 'migration failed: connection refused',
    })
  })

  it('should return ENOENT-specific error when prisma binary missing at runtime', async () => {
    mockedExecSync.mockImplementationOnce(() => {
      const err = new Error('spawn ENOENT') as NodeJS.ErrnoException
      err.code = 'ENOENT'
      throw err
    })

    const result = await handler({ command: 'migrate' })

    expect(result.success).toBe(false)
    expect(result.error).toContain('ENOENT')
    expect(result.error).toContain('Check LAMBDA_TASK_ROOT')
  })

  // --- force-reapply-baseline ---

  it('should run force-reapply-baseline: wipe schema then migrate deploy', async () => {
    mockedExecSync
      .mockReturnValueOnce('') // (1) DROP SCHEMA / CREATE SCHEMA
      .mockReturnValueOnce('') // (2) migrate deploy

    const result = await handler({ command: 'force-reapply-baseline' })

    expect(result).toEqual({ success: true })
    expect(mockedExecSync).toHaveBeenCalledTimes(2)
    expect(mockedExecSync).toHaveBeenCalledWith(
      expect.stringContaining('DROP SCHEMA public CASCADE'),
      expect.objectContaining({ encoding: 'utf-8', shell: '/bin/sh' })
    )
    expect(mockedExecSync).toHaveBeenCalledWith(
      expect.stringContaining('migrate deploy'),
      expect.objectContaining({ encoding: 'utf-8' })
    )
  })

  it('should return error when force-reapply-baseline fails', async () => {
    mockedExecSync.mockImplementationOnce(() => {
      throw new Error('migrate deploy failed: connection refused')
    })

    const result = await handler({ command: 'force-reapply-baseline' })

    expect(result).toEqual({
      success: false,
      error: 'migrate deploy failed: connection refused',
    })
  })

  // --- reset-baseline ---

  it('should run reset-baseline command', async () => {
    mockedExecSync.mockReturnValue('')

    const result = await handler({ command: 'reset-baseline' })

    expect(result).toEqual({ success: true })
    expect(mockedExecSync).toHaveBeenCalledTimes(1)
    expect(mockedExecSync).toHaveBeenCalledWith(
      expect.stringContaining(
        'migrate resolve --rolled-back 20250101000000_baseline'
      ),
      expect.objectContaining({ encoding: 'utf-8' })
    )
  })

  it('should return error when reset-baseline fails', async () => {
    mockedExecSync.mockImplementationOnce(() => {
      throw new Error('resolve --rolled-back failed')
    })

    const result = await handler({ command: 'reset-baseline' })

    expect(result).toEqual({
      success: false,
      error: 'resolve --rolled-back failed',
    })
  })

  // --- resolve-rolled-back ---

  it('should run resolve-rolled-back with provided migration name', async () => {
    mockedExecSync.mockReturnValue('')

    const result = await handler({
      command: 'resolve-rolled-back',
      migration: '20260307000000_categories_tags_restructure',
    })

    expect(result).toEqual({ success: true })
    expect(mockedExecSync).toHaveBeenCalledTimes(1)
    expect(mockedExecSync).toHaveBeenCalledWith(
      expect.stringContaining(
        'migrate resolve --rolled-back 20260307000000_categories_tags_restructure'
      ),
      expect.objectContaining({ encoding: 'utf-8' })
    )
  })

  it('should return error when resolve-rolled-back is missing migration name', async () => {
    const result = await handler({ command: 'resolve-rolled-back' })

    expect(result.success).toBe(false)
    expect(result.error).toContain('requires a "migration" field')
    expect(mockedExecSync).not.toHaveBeenCalled()
  })

  it('should return error when resolve-rolled-back fails', async () => {
    mockedExecSync.mockImplementationOnce(() => {
      throw new Error('resolve failed: migration not found')
    })

    const result = await handler({
      command: 'resolve-rolled-back',
      migration: '20260307000000_categories_tags_restructure',
    })

    expect(result).toEqual({
      success: false,
      error: 'resolve failed: migration not found',
    })
  })

  // --- seed ---

  it('should run seed command via tsx when seed script exists', async () => {
    mockedExecSync.mockReturnValue('')

    const result = await handler({ command: 'seed' })

    expect(result).toEqual({ success: true })
    expect(mockedExecSync).toHaveBeenCalledTimes(1)
    expect(mockedExecSync).toHaveBeenCalledWith(
      expect.stringContaining('seed-safe.ts'),
      expect.objectContaining({ encoding: 'utf-8' })
    )
  })

  it('should return error when seed script is missing', async () => {
    // LAMBDA_ROOT exists (true), Prisma CLI exists (true), seed script missing (false)
    mockedExistsSync
      .mockReturnValueOnce(true)   // LAMBDA_ROOT
      .mockReturnValueOnce(true)   // PRISMA_CLI
      .mockReturnValueOnce(false)  // seed-safe.ts

    const result = await handler({ command: 'seed' })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Seed script not found')
    expect(mockedExecSync).not.toHaveBeenCalled()
  })

  it('should return error when seed script fails', async () => {
    mockedExecSync.mockImplementationOnce(() => {
      throw new Error('SEED BLOCKED: Found 3 non-seed user(s)')
    })

    const result = await handler({ command: 'seed' })

    expect(result).toEqual({
      success: false,
      error: 'SEED BLOCKED: Found 3 non-seed user(s)',
    })
  })
})
