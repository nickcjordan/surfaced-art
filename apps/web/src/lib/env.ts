/**
 * Centralized environment variable validation.
 *
 * Every required NEXT_PUBLIC_* var is read and validated here.
 * If a required variable is missing, the build (or dev server startup)
 * fails immediately with a clear error — no silent fallbacks to wrong URLs.
 *
 * Import from this module instead of reading process.env directly.
 */

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        'Check .env.local (local dev) or Vercel project settings (deploy).',
    )
  }
  return value
}

/** Canonical site URL (e.g. https://surfaced.art, https://dev.surfaced.art) */
export const SITE_URL = required('NEXT_PUBLIC_SITE_URL')

/** Hono API base URL (API Gateway) */
export const API_URL = required('NEXT_PUBLIC_API_URL')

/** Space-separated CDN origins for images (CloudFront) */
export const CDN_DOMAINS = required('NEXT_PUBLIC_CDN_DOMAINS')

/** Cognito user pool ID */
export const COGNITO_USER_POOL_ID = required('NEXT_PUBLIC_COGNITO_USER_POOL_ID')

/** Cognito app client ID */
export const COGNITO_CLIENT_ID = required('NEXT_PUBLIC_COGNITO_CLIENT_ID')

/** Cognito IDP origin for CSP connect-src (stable AWS service URL) */
export const COGNITO_IDP =
  process.env.NEXT_PUBLIC_COGNITO_IDP ?? 'https://cognito-idp.us-east-1.amazonaws.com'

/** PostHog ingest host (stable third-party URL) */
export const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'

/** PostHog project API key (optional — analytics disabled if unset) */
export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? ''
