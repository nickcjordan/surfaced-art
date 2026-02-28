/**
 * Shared Zod validation schemas for the Surfaced Art API.
 *
 * These schemas are the single source of truth for request validation.
 * Both the API (server-side) and web app (client-side) import from here.
 */

import { z } from 'zod'
import { Category, CvEntryType, ListingStatus } from './enums'

// ============================================================================
// Helpers
// ============================================================================

const categoryValues = Object.values(Category) as [string, ...string[]]
const cvEntryTypeValues = Object.values(CvEntryType) as [string, ...string[]]
const statusValues = Object.values(ListingStatus) as [string, ...string[]]

// ============================================================================
// Primitive validators (reusable building blocks)
// ============================================================================

/** Validates a URL-safe slug: lowercase alphanumeric + hyphens, 2-50 chars */
export const slugParam = z
  .string()
  .min(2, 'Slug must be at least 2 characters')
  .max(50, 'Slug must be at most 50 characters')
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    'Slug must be lowercase alphanumeric with single hyphens, not starting or ending with a hyphen',
  )

/** Validates a UUID v4 string */
export const uuidParam = z.string().uuid('Invalid UUID format')

// ============================================================================
// Query schemas (for GET endpoints)
// ============================================================================

/** Shared pagination query params */
export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .optional()
    .default(20)
    .transform((v) => Math.min(v, 100)),
})

/** GET /artists query params */
export const artistsQuery = z.object({
  category: z.enum(categoryValues).optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .optional()
    .default(4)
    .transform((v) => Math.min(v, 50)),
})

/** GET /listings query params */
export const listingsQuery = z.object({
  category: z.enum(categoryValues).optional(),
  status: z.enum(statusValues).optional().default('available'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .optional()
    .default(20)
    .transform((v) => Math.min(v, 100)),
})

// ============================================================================
// Request body schemas
// ============================================================================

/** POST /waitlist body */
export const waitlistBody = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
})

/** POST /artists/apply body */
export const artistApplicationBody = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be at most 100 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  instagramUrl: z.string().url('Invalid Instagram URL').optional().or(z.literal('')),
  websiteUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  statement: z
    .string()
    .min(50, 'Artist statement must be at least 50 characters')
    .max(5000, 'Artist statement must be at most 5000 characters'),
  exhibitionHistory: z
    .string()
    .max(5000, 'Exhibition history must be at most 5000 characters')
    .optional()
    .or(z.literal('')),
  categories: z
    .array(z.enum(categoryValues))
    .min(1, 'Select at least one category'),
})

/** GET /artists/apply/check-email query */
export const checkEmailQuery = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
})

/** POST /uploads/presigned-url body */
export const presignedUrlBody = z.object({
  context: z.enum(['profile', 'cover', 'listing', 'process']),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
})

// ============================================================================
// Path param wrappers (for route param validation)
// ============================================================================

/** GET /artists/:slug path param */
export const artistSlugParam = z.object({
  slug: slugParam,
})

/** GET /listings/:id path param */
export const listingIdParam = z.object({
  id: uuidParam,
})

// ============================================================================
// XSS sanitization
// ============================================================================

/**
 * Strips HTML tags, decodes common HTML entities used for injection,
 * trims whitespace, and collapses multiple spaces.
 *
 * Use on any user-supplied text (bios, descriptions, titles) before storage.
 */
export function sanitizeText(input: string): string {
  return (
    input
      // Decode HTML entities that could be used for injection
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      // Strip all HTML tags
      .replace(/<[^>]*>/g, '')
      // Collapse multiple spaces to single space
      .replace(/\s+/g, ' ')
      .trim()
  )
}

/** PUT /me/profile body — all fields optional for partial update */
export const profileUpdateBody = z.object({
  bio: z.string().max(5000, 'Bio must be at most 5000 characters').optional(),
  location: z.string().max(200, 'Location must be at most 200 characters').optional(),
  websiteUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  instagramUrl: z.string().url('Invalid Instagram URL').optional().or(z.literal('')),
  profileImageUrl: z.string().url('Invalid image URL').nullable().optional(),
  coverImageUrl: z.string().url('Invalid image URL').nullable().optional(),
})

/** PUT /me/categories body — replace-all semantics */
export const categoriesUpdateBody = z.object({
  categories: z
    .array(z.enum(categoryValues))
    .min(1, 'Select at least one category'),
})

/** POST /me/cv-entries or PUT /me/cv-entries/:id body */
export const cvEntryBody = z.object({
  type: z.enum(cvEntryTypeValues),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters'),
  institution: z
    .string()
    .max(200, 'Institution must be at most 200 characters')
    .optional()
    .or(z.literal('')),
  year: z.number().int().min(1900, 'Year must be 1900 or later').max(2100, 'Year must be 2100 or earlier'),
  description: z
    .string()
    .max(2000, 'Description must be at most 2000 characters')
    .optional()
    .or(z.literal('')),
})

/** PUT /me/cv-entries/reorder body */
export const cvEntryReorderBody = z.object({
  orderedIds: z.array(z.string().uuid('Invalid UUID format')).min(1, 'At least one ID is required'),
})

/** POST /admin/artists/:userId/approve or /reject body */
export const adminReviewBody = z.object({
  reviewNotes: z.string().max(2000, 'Review notes must be at most 2000 characters').optional(),
})

// ============================================================================
// Inferred types (derive TypeScript types from schemas)
// ============================================================================

export type ArtistsQuery = z.infer<typeof artistsQuery>
export type ListingsQuery = z.infer<typeof listingsQuery>
export type WaitlistBody = z.infer<typeof waitlistBody>
export type ArtistApplicationBody = z.infer<typeof artistApplicationBody>
export type CheckEmailQuery = z.infer<typeof checkEmailQuery>
export type PresignedUrlBody = z.infer<typeof presignedUrlBody>
export type ProfileUpdateBody = z.infer<typeof profileUpdateBody>
export type CategoriesUpdateBody = z.infer<typeof categoriesUpdateBody>
export type CvEntryBody = z.infer<typeof cvEntryBody>
export type CvEntryReorderBody = z.infer<typeof cvEntryReorderBody>
export type AdminReviewBody = z.infer<typeof adminReviewBody>
