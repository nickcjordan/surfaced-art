import { z } from 'zod'
import { Category, ListingStatus } from '@surfaced-art/types'

const categoryValues = Object.values(Category) as [string, ...string[]]
const statusValues = Object.values(ListingStatus) as [string, ...string[]]

/**
 * GET /artists query params
 */
export const artistsQuerySchema = z.object({
  category: z.enum(categoryValues).optional(),
  limit: z.coerce.number().int().min(1).optional().default(4)
    .transform((v) => Math.min(v, 50)),
})

/**
 * GET /listings query params
 */
export const listingsQuerySchema = z.object({
  category: z.enum(categoryValues).optional(),
  status: z.enum(statusValues).optional().default('available'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).optional().default(20).transform((v) => Math.min(v, 100)),
})

/**
 * GET /listings/:id path param
 */
export const listingIdSchema = z.object({
  id: z.string().uuid('Invalid listing ID format'),
})

/**
 * POST /waitlist body
 */
export const waitlistBodySchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
})
