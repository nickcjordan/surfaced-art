import type { MiddlewareHandler } from 'hono'

/**
 * Sets Cache-Control header on successful GET/HEAD responses.
 * Disabled when CACHE_DISABLED=true (e.g., in dev environment).
 */
export function cacheControl(directive: string): MiddlewareHandler {
  return async (c, next) => {
    await next()
    if (process.env.CACHE_DISABLED === 'true') return
    if (c.req.method !== 'GET' && c.req.method !== 'HEAD') return
    if (c.res.status >= 400) return
    c.header('Cache-Control', directive)
  }
}
