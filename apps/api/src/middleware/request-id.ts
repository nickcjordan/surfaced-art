import { randomUUID } from 'node:crypto'
import type { MiddlewareHandler } from 'hono'

/**
 * Adds an X-Request-Id header to every response.
 * If the incoming request already has an X-Request-Id, it is preserved (passthrough).
 * Otherwise a new UUID v4 is generated.
 */
export function requestId(): MiddlewareHandler {
  return async (c, next) => {
    const id = c.req.header('X-Request-Id') ?? randomUUID()
    c.set('requestId', id)
    await next()
    c.header('X-Request-Id', id)
  }
}
