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
  })

  it('should return error for unknown commands', async () => {
    const result = await handler({ command: 'unknown' })
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

  it('should run baseline resolve and migrate deploy', async () => {
    mockedExecSync.mockReturnValue('')

    const result = await handler({ command: 'migrate' })

    expect(result).toEqual({ success: true })
    expect(mockedExecSync).toHaveBeenCalledTimes(2)
    expect(mockedExecSync).toHaveBeenCalledWith(
      expect.stringContaining(
        'migrate resolve --applied 20250101000000_baseline'
      ),
      expect.objectContaining({ encoding: 'utf-8' })
    )
    expect(mockedExecSync).toHaveBeenCalledWith(
      expect.stringContaining('migrate deploy'),
      expect.objectContaining({ encoding: 'utf-8' })
    )
  })

  it('should continue when baseline is already applied', async () => {
    mockedExecSync
      .mockImplementationOnce(() => {
        throw new Error('already recorded as applied')
      })
      .mockReturnValueOnce('')

    const result = await handler({ command: 'migrate' })

    expect(result).toEqual({ success: true })
    expect(mockedExecSync).toHaveBeenCalledTimes(2)
  })

  it('should fail fast when baseline resolve fails with unexpected error', async () => {
    mockedExecSync.mockImplementationOnce(() => {
      throw new Error('some unexpected resolve error')
    })

    const result = await handler({ command: 'migrate' })

    expect(result).toEqual({
      success: false,
      error: 'Baseline resolve failed: some unexpected resolve error',
    })
    expect(mockedExecSync).toHaveBeenCalledTimes(1)
  })

  it('should return error when migrate deploy fails', async () => {
    mockedExecSync
      .mockReturnValueOnce('')
      .mockImplementationOnce(() => {
        throw new Error('migration failed: connection refused')
      })

    const result = await handler({ command: 'migrate' })

    expect(result).toEqual({
      success: false,
      error: 'migration failed: connection refused',
    })
  })

  it('should return ENOENT-specific error when prisma binary missing at runtime', async () => {
    mockedExecSync
      .mockReturnValueOnce('')
      .mockImplementationOnce(() => {
        const err = new Error('spawn ENOENT') as NodeJS.ErrnoException
        err.code = 'ENOENT'
        throw err
      })

    const result = await handler({ command: 'migrate' })

    expect(result.success).toBe(false)
    expect(result.error).toContain('ENOENT')
    expect(result.error).toContain('Check LAMBDA_TASK_ROOT')
  })
})
