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
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://surfacedart.com')
    const { SITE_URL } = await import('../site-config')
    expect(SITE_URL).toBe('https://surfacedart.com')
  })

  it('works for dev environment URL', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://dev.surfacedart.com')
    const { SITE_URL } = await import('../site-config')
    expect(SITE_URL).toBe('https://dev.surfacedart.com')
  })

  it('throws if NEXT_PUBLIC_SITE_URL is not set', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    await expect(import('../site-config')).rejects.toThrow('NEXT_PUBLIC_SITE_URL is required')
  })
})
