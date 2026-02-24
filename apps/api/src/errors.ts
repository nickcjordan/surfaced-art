import type { Context } from 'hono'
import type { ZodError } from 'zod'
import type { ApiError } from '@surfaced-art/types'

/**
 * Create a standardized error response body.
 */
function errorBody(code: string, message: string, details?: unknown): ApiError {
  const body: ApiError = { error: { code, message } }
  if (details !== undefined) {
    body.error.details = details
  }
  return body
}

/**
 * 404 Not Found
 */
export function notFound(c: Context, message: string) {
  return c.json(errorBody('NOT_FOUND', message), 404)
}

/**
 * 400 Bad Request
 */
export function badRequest(c: Context, message: string, details?: unknown) {
  return c.json(errorBody('BAD_REQUEST', message, details), 400)
}

/**
 * 400 Validation Error (from Zod)
 */
export function validationError(c: Context, zodError: ZodError) {
  const details = zodError.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }))
  return c.json(errorBody('VALIDATION_ERROR', 'Validation failed', details), 400)
}

/**
 * 500 Internal Server Error
 */
export function internalError(c: Context) {
  return c.json(errorBody('INTERNAL_ERROR', 'Internal server error'), 500)
}
