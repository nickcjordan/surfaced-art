/**
 * Security headers for all Next.js responses.
 * Extracted into a shared module so both next.config.ts and tests can use it.
 *
 * CSP domains are driven by environment variables so staging/preview
 * environments work without code changes:
 *
 *   NEXT_PUBLIC_CDN_DOMAINS  — space-separated CloudFront (or other CDN) origins for img-src
 *   NEXT_PUBLIC_API_URL      — API origin for connect-src
 *   NEXT_PUBLIC_COGNITO_IDP  — Cognito IDP origin for connect-src
 */

const CDN_DOMAINS = (
  process.env.NEXT_PUBLIC_CDN_DOMAINS ??
  'https://dmfu4c7s6z2cc.cloudfront.net https://d2agn4aoo0e7ji.cloudfront.net'
).trim()

const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ?? 'https://api.surfaced.art'
).trim()

const COGNITO_IDP = (
  process.env.NEXT_PUBLIC_COGNITO_IDP ??
  'https://cognito-idp.us-east-1.amazonaws.com'
).trim()

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  `img-src 'self' data: ${CDN_DOMAINS}`,
  `connect-src 'self' ${API_ORIGIN} ${COGNITO_IDP}`,
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
