/**
 * Security headers for all Next.js responses.
 * Extracted into a shared module so both next.config.ts and tests can use it.
 *
 * CSP domains are driven by environment variables so staging/preview
 * environments work without code changes:
 *
 *   NEXT_PUBLIC_CDN_DOMAINS  — space-separated CloudFront (or other CDN) origins for img-src
 *   NEXT_PUBLIC_API_URL      — API origin for connect-src
 */

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

const CDN_DOMAINS_TRIMMED = required('NEXT_PUBLIC_CDN_DOMAINS').trim()
const API_ORIGIN = required('NEXT_PUBLIC_API_URL').trim()
const COGNITO_IDP_TRIMMED = 'https://cognito-idp.us-east-1.amazonaws.com'
const POSTHOG_HOST_TRIMMED = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim()
// Vercel Live is injected into preview/development deployments but not production
const VERCEL_LIVE =
  process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production'
    ? 'https://vercel.live'
    : undefined

const CSP_DIRECTIVES = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval'${POSTHOG_HOST_TRIMMED ? ` ${POSTHOG_HOST_TRIMMED}` : ''}${VERCEL_LIVE ? ` ${VERCEL_LIVE}` : ''}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  `img-src 'self' data: ${CDN_DOMAINS_TRIMMED}`,
  `connect-src 'self' ${API_ORIGIN} ${COGNITO_IDP_TRIMMED}${POSTHOG_HOST_TRIMMED ? ` ${POSTHOG_HOST_TRIMMED}` : ''}${VERCEL_LIVE ? ` ${VERCEL_LIVE}` : ''}`,
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
