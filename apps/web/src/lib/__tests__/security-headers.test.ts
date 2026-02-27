import { describe, it, expect, vi } from 'vitest'

const REQUIRED_HEADERS = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '0' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

/** Import (or re-import) the module so env var changes take effect. */
async function loadHeaders() {
  const mod = await import('../security-headers')
  return mod.SECURITY_HEADERS
}

describe('security headers config', () => {
  for (const { key, value } of REQUIRED_HEADERS) {
    it(`should include ${key} header with correct value`, async () => {
      const headers = await loadHeaders()
      const header = headers.find((h) => h.key === key)
      expect(header).toBeDefined()
      expect(header!.value).toBe(value)
    })
  }

  it('should include Content-Security-Policy header', async () => {
    const headers = await loadHeaders()
    const csp = headers.find((h) => h.key === 'Content-Security-Policy')
    expect(csp).toBeDefined()
    expect(csp!.value).toContain("default-src 'self'")
    expect(csp!.value).toContain("frame-ancestors 'none'")
  })

  it('CSP should allow CloudFront CDN domains for images by default', async () => {
    const headers = await loadHeaders()
    const csp = headers.find((h) => h.key === 'Content-Security-Policy')!
    expect(csp.value).toContain('dmfu4c7s6z2cc.cloudfront.net')
    expect(csp.value).toContain('d2agn4aoo0e7ji.cloudfront.net')
  })

  it('CSP should allow Google Fonts for font loading', async () => {
    const headers = await loadHeaders()
    const csp = headers.find((h) => h.key === 'Content-Security-Policy')!
    expect(csp.value).toContain('fonts.googleapis.com')
    expect(csp.value).toContain('fonts.gstatic.com')
  })

  it('CSP should allow API domain for fetch requests by default', async () => {
    const headers = await loadHeaders()
    const csp = headers.find((h) => h.key === 'Content-Security-Policy')!
    expect(csp.value).toContain('api.surfaced.art')
  })

  it('CSP should allow Cognito IDP for authentication by default', async () => {
    const headers = await loadHeaders()
    const csp = headers.find((h) => h.key === 'Content-Security-Policy')!
    expect(csp.value).toContain('cognito-idp.us-east-1.amazonaws.com')
  })

  it('CSP should disallow framing (clickjacking protection)', async () => {
    const headers = await loadHeaders()
    const csp = headers.find((h) => h.key === 'Content-Security-Policy')!
    expect(csp.value).toContain("frame-ancestors 'none'")
  })
})

describe('CSP environment overrides', () => {
  it('should use NEXT_PUBLIC_CDN_DOMAINS for img-src when set', async () => {
    vi.stubEnv('NEXT_PUBLIC_CDN_DOMAINS', 'https://staging-cdn.example.com')
    // Re-import to pick up new env
    vi.resetModules()
    const { SECURITY_HEADERS } = await import('../security-headers')
    const csp = SECURITY_HEADERS.find((h) => h.key === 'Content-Security-Policy')!
    expect(csp.value).toContain('staging-cdn.example.com')
    expect(csp.value).not.toContain('dmfu4c7s6z2cc.cloudfront.net')
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('should use NEXT_PUBLIC_API_URL for connect-src when set', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.staging.surfaced.art')
    vi.resetModules()
    const { SECURITY_HEADERS } = await import('../security-headers')
    const csp = SECURITY_HEADERS.find((h) => h.key === 'Content-Security-Policy')!
    expect(csp.value).toContain('api.staging.surfaced.art')
    expect(csp.value).not.toContain('api.surfaced.art')
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('should use NEXT_PUBLIC_COGNITO_IDP for connect-src when set', async () => {
    vi.stubEnv('NEXT_PUBLIC_COGNITO_IDP', 'https://cognito-idp.eu-west-1.amazonaws.com')
    vi.resetModules()
    const { SECURITY_HEADERS } = await import('../security-headers')
    const csp = SECURITY_HEADERS.find((h) => h.key === 'Content-Security-Policy')!
    expect(csp.value).toContain('cognito-idp.eu-west-1.amazonaws.com')
    expect(csp.value).not.toContain('cognito-idp.us-east-1.amazonaws.com')
    vi.unstubAllEnvs()
    vi.resetModules()
  })
})
