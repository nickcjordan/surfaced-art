/**
 * Security headers for all Next.js responses.
 * Extracted into a shared module so both next.config.ts and tests can use it.
 */

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https://dmfu4c7s6z2cc.cloudfront.net https://d2agn4aoo0e7ji.cloudfront.net",
  "connect-src 'self' https://api.surfaced.art",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
]

export const SECURITY_HEADERS = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-XSS-Protection',
    value: '0',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: CSP_DIRECTIVES.join('; '),
  },
]
