import type { MiddlewareHandler } from 'hono'

/**
 * Security headers middleware for the API.
 * Since the API only serves JSON responses, the CSP is very restrictive.
 */
export function securityHeaders(): MiddlewareHandler {
  return async (c, next) => {
    await next()

    c.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
    c.header('X-Content-Type-Options', 'nosniff')
    c.header('X-Frame-Options', 'DENY')
    c.header('X-XSS-Protection', '0')
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
    c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    c.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'")
  }
}
