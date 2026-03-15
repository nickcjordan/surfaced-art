/**
 * Centralized environment variable validation.
 *
 * Every required NEXT_PUBLIC_* var is read and validated here.
 * If a required variable is missing, the build (or dev server startup)
 * fails immediately with a clear error — no silent fallbacks to wrong URLs.
 *
 * Import from this module instead of reading process.env directly.
 */

/**
 * Validate that a statically-evaluated env var value is present.
 *
 * IMPORTANT: callers must pass `process.env.NEXT_PUBLIC_FOO` directly — NOT
 * `process.env[variableName]`. Next.js only inlines NEXT_PUBLIC_* values into
 * the client bundle when the access is a static property reference. Dynamic
 * bracket notation (process.env[variable]) is never replaced and returns
 * undefined at runtime in the browser.
 */
function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        'Check .env.local (local dev) or Vercel project settings (deploy).',
    )
  }
  return value
}

/** Canonical site URL (e.g. https://surfaced.art, https://dev.surfaced.art) */
export const SITE_URL = required(process.env.NEXT_PUBLIC_SITE_URL, 'NEXT_PUBLIC_SITE_URL')

/** Hono API base URL (API Gateway) */
export const API_URL = required(process.env.NEXT_PUBLIC_API_URL, 'NEXT_PUBLIC_API_URL')

/** Space-separated CDN origins for images (CloudFront) */
export const CDN_DOMAINS = required(process.env.NEXT_PUBLIC_CDN_DOMAINS, 'NEXT_PUBLIC_CDN_DOMAINS')

/** Primary CloudFront domain (bare hostname) for constructing image URLs — first entry of CDN_DOMAINS */
export const CLOUDFRONT_DOMAIN = CDN_DOMAINS.split(/\s+/)[0].replace(/^https?:\/\//, '')

/** Cognito user pool ID */
export const COGNITO_USER_POOL_ID = required(process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID, 'NEXT_PUBLIC_COGNITO_USER_POOL_ID')

/** Cognito app client ID */
export const COGNITO_CLIENT_ID = required(process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID, 'NEXT_PUBLIC_COGNITO_CLIENT_ID')

/** Cognito IDP origin for CSP connect-src — stable AWS service URL, not env-configurable */
export const COGNITO_IDP = 'https://cognito-idp.us-east-1.amazonaws.com'

/** PostHog ingest host — optional; analytics disabled when absent */
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST

/** PostHog project API key — optional; analytics disabled when absent */
export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY

/** PostHog environment tag — optional, defaults to 'dev' */
export const POSTHOG_ENV = process.env.NEXT_PUBLIC_POSTHOG_ENV || 'dev'
