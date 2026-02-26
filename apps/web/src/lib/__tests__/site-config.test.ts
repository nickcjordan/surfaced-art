import { describe, it, expect } from 'vitest'
import { SITE_URL } from '../site-config'

describe('site-config', () => {
  it('exports SITE_URL as the canonical production URL', () => {
    expect(SITE_URL).toBe('https://surfaced.art')
  })

  it('SITE_URL does not have a trailing slash', () => {
    expect(SITE_URL.endsWith('/')).toBe(false)
  })
})
