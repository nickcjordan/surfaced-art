import { describe, it, expect } from 'vitest'
import { SECURITY_HEADERS } from '../security-headers'

const REQUIRED_HEADERS = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '0' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

describe('security headers config', () => {
  for (const { key, value } of REQUIRED_HEADERS) {
    it(`should include ${key} header with correct value`, () => {
      const header = SECURITY_HEADERS.find((h) => h.key === key)
      expect(header).toBeDefined()
      expect(header!.value).toBe(value)
    })
  }

  it('should include Content-Security-Policy header', () => {
    const csp = SECURITY_HEADERS.find((h) => h.key === 'Content-Security-Policy')
    expect(csp).toBeDefined()
    expect(csp!.value).toContain("default-src 'self'")
    expect(csp!.value).toContain("frame-ancestors 'none'")
  })

  it('CSP should allow CloudFront CDN domains for images', () => {
    const csp = SECURITY_HEADERS.find((h) => h.key === 'Content-Security-Policy')!
    expect(csp.value).toContain('dmfu4c7s6z2cc.cloudfront.net')
    expect(csp.value).toContain('d2agn4aoo0e7ji.cloudfront.net')
  })

  it('CSP should allow Google Fonts for font loading', () => {
    const csp = SECURITY_HEADERS.find((h) => h.key === 'Content-Security-Policy')!
    expect(csp.value).toContain('fonts.googleapis.com')
    expect(csp.value).toContain('fonts.gstatic.com')
  })

  it('CSP should allow API domain for fetch requests', () => {
    const csp = SECURITY_HEADERS.find((h) => h.key === 'Content-Security-Policy')!
    expect(csp.value).toContain('api.surfaced.art')
  })

  it('CSP should disallow framing (clickjacking protection)', () => {
    const csp = SECURITY_HEADERS.find((h) => h.key === 'Content-Security-Policy')!
    expect(csp.value).toContain("frame-ancestors 'none'")
  })
})
