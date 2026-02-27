/**
 * Shared auth constants used by both the AuthProvider (client) and
 * Next.js middleware (edge runtime). Keep this file free of browser-only
 * or Node-only APIs so it can be imported in both contexts.
 */

/**
 * Non-sensitive marker cookie name checked by Next.js middleware.
 * The cookie value is always "1" — it does NOT contain the JWT.
 * Actual token validation happens on the API via the Authorization header.
 */
export const AUTH_COOKIE_NAME = 'sa-auth'
