import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('site-config', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('exports SITE_URL from NEXT_PUBLIC_SITE_URL env var', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://surfaced.art')
    const { SITE_URL } = await import('../site-config')
    expect(SITE_URL).toBe('https://surfaced.art')
  })

  it('works for dev environment URL', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://dev.surfaced.art')
    const { SITE_URL } = await import('../site-config')
    expect(SITE_URL).toBe('https://dev.surfaced.art')
  })

  it('throws when NEXT_PUBLIC_SITE_URL is not set', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    await expect(import('../site-config')).rejects.toThrow('NEXT_PUBLIC_SITE_URL')
  })
})
