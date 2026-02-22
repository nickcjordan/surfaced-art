import { describe, it, expect, vi, beforeEach } from 'vitest'
import { execSync } from 'child_process'

vi.mock('child_process', () => ({
  execSync: vi.fn(),
}))

const mockedExecSync = vi.mocked(execSync)

// Import after mocking so the module picks up the mock
const { handler } = await import('./index')

describe('migrate handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return error for unknown commands', async () => {
    const result = await handler({ command: 'unknown' as 'migrate' })
    expect(result).toEqual({
      success: false,
      error: 'Unknown command: unknown',
    })
    expect(mockedExecSync).not.toHaveBeenCalled()
  })

  it('should run baseline resolve and migrate deploy', async () => {
    mockedExecSync.mockReturnValue('')

    const result = await handler({ command: 'migrate' })

    expect(result).toEqual({ success: true })
    expect(mockedExecSync).toHaveBeenCalledTimes(2)
    expect(mockedExecSync).toHaveBeenCalledWith(
      expect.stringContaining('migrate resolve --applied 20250101000000_baseline'),
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

  it('should continue when baseline resolve fails with unexpected error', async () => {
    mockedExecSync
      .mockImplementationOnce(() => {
        throw new Error('some unexpected resolve error')
      })
      .mockReturnValueOnce('')

    const result = await handler({ command: 'migrate' })

    expect(result).toEqual({ success: true })
    expect(mockedExecSync).toHaveBeenCalledTimes(2)
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
})
