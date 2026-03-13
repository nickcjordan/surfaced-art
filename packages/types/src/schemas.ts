/**
 * Shared Zod validation schemas for the Surfaced Art API.
 *
 * These schemas are the single source of truth for request validation.
 * Both the API (server-side) and web app (client-side) import from here.
 */

import { z } from 'zod'
import { Category, CvEntryType, ListingStatus, ListingType, OrderStatus } from './enums'

// ============================================================================
// Helpers
// ============================================================================

const categoryValues = Object.values(Category) as [string, ...string[]]
const cvEntryTypeValues = Object.values(CvEntryType) as [string, ...string[]]
const statusValues = Object.values(ListingStatus) as [string, ...string[]]
const listingTypeValues = Object.values(ListingType) as [string, ...string[]]

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

/** GET /search query params */
export const searchQuery = z.object({
  q: z
    .string()
    .min(1, 'Search query is required')
    .max(200, 'Search query must be at most 200 characters')
    .transform((v) => sanitizeText(v))
    .pipe(z.string().min(1, 'Search query is required')),
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
  source: z.string().max(50).optional(),
  artistId: z.string().uuid('Invalid artist ID').optional(),
  listingId: z.string().uuid('Invalid listing ID').optional(),
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
  let text = input

  // Loop: strip HTML tags then decode entities until stable.
  // Using [^<>] in the tag regex avoids polynomial backtracking on
  // inputs with many '<' characters. Looping until stable handles
  // nested or double-encoded injection attempts.
  let prev = ''
  while (prev !== text) {
    prev = text
    text = text
      .replace(/<[^<>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&amp;/g, '&')
  }

  // Final strip after all decoding rounds
  text = text.replace(/<[^<>]*>/g, '')

  // Remove any remaining angle brackets that aren't part of complete tags
  // (defense-in-depth against incomplete tag injection like "<scr<script>ipt>")
  text = text.replace(/[<>]/g, '')

  return text.replace(/\s+/g, ' ').trim()
}

/** PUT /me/profile body — all fields optional for partial update */
/** Hex color validation — must be # followed by exactly 6 hex digits */
export const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color (e.g. #FF5733)')

/** PUT /me/profile body — all fields optional for partial update */
export const profileUpdateBody = z.object({
  bio: z.string().max(5000, 'Bio must be at most 5000 characters').optional(),
  location: z.string().max(200, 'Location must be at most 200 characters').optional(),
  websiteUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  instagramUrl: z.string().url('Invalid Instagram URL').optional().or(z.literal('')),
  profileImageUrl: z.string().url('Invalid image URL').nullable().optional(),
  coverImageUrl: z.string().url('Invalid image URL').nullable().optional(),
  accentColor: hexColor.nullable().optional(),
})

/** PUT /me/categories body — replace-all semantics */
export const categoriesUpdateBody = z.object({
  categories: z
    .array(z.enum(categoryValues))
    .min(1, 'Select at least one category'),
})

/** PUT /me/tags body — replace-all semantics */
export const tagsUpdateBody = z.object({
  tagIds: z
    .array(z.string().uuid('Invalid UUID format'))
    .max(50, 'Maximum 50 tags per artist'),
})

/** PUT /me/listings/:id/tags body — replace-all semantics */
export const listingTagsUpdateBody = z.object({
  tagIds: z
    .array(z.string().uuid('Invalid UUID format'))
    .max(20, 'Maximum 20 tags per listing'),
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

/** POST /me/process-media/photo body */
export const processMediaPhotoBody = z.object({
  url: z.string().url('Invalid URL'),
})

/** POST /me/process-media/video body */
export const processMediaVideoBody = z.object({
  videoPlaybackId: z.string().min(1, 'Playback ID is required'),
  videoProvider: z.literal('mux'),
})

/** PUT /me/process-media/reorder body */
export const processMediaReorderBody = z.object({
  orderedIds: z.array(z.string().uuid('Invalid UUID format')).min(1, 'At least one ID is required'),
})

/** POST /admin/artists/:userId/approve or /reject body */
export const adminReviewBody = z.object({
  reviewNotes: z.string().max(2000, 'Review notes must be at most 2000 characters').optional(),
})

// ============================================================================
// Listing management schemas (artist dashboard)
// ============================================================================

/** Positive dimension value (inches or lbs) */
const positiveDimension = z.number().positive('Must be a positive number')

/** POST /me/listings body */
export const listingCreateBody = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(5000, 'Description must be at most 5000 characters'),
  medium: z
    .string()
    .min(1, 'Medium is required')
    .max(200, 'Medium must be at most 200 characters'),
  category: z.enum(categoryValues),
  type: z.enum(listingTypeValues),
  price: z.number().int('Price must be a whole number (cents)').positive('Price must be greater than zero'),
  quantityTotal: z.number().int().min(1, 'Quantity must be at least 1').optional().default(1),
  // Artwork dimensions (optional — the piece itself, in inches)
  artworkLength: positiveDimension.nullable().optional(),
  artworkWidth: positiveDimension.nullable().optional(),
  artworkHeight: positiveDimension.nullable().optional(),
  // Packed dimensions (required — shipping box, in inches/lbs)
  packedLength: positiveDimension,
  packedWidth: positiveDimension,
  packedHeight: positiveDimension,
  packedWeight: positiveDimension,
  // Edition info (optional — for prints)
  editionNumber: z.number().int().positive().nullable().optional(),
  editionTotal: z.number().int().positive().nullable().optional(),
})

/** PUT /me/listings/:id body — all fields optional for partial update */
export const listingUpdateBody = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters')
    .optional(),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(5000, 'Description must be at most 5000 characters')
    .optional(),
  medium: z
    .string()
    .min(1, 'Medium is required')
    .max(200, 'Medium must be at most 200 characters')
    .optional(),
  category: z.enum(categoryValues).optional(),
  type: z.enum(listingTypeValues).optional(),
  price: z.number().int('Price must be a whole number (cents)').positive('Price must be greater than zero').optional(),
  quantityTotal: z.number().int().min(1, 'Quantity must be at least 1').optional(),
  artworkLength: positiveDimension.nullable().optional(),
  artworkWidth: positiveDimension.nullable().optional(),
  artworkHeight: positiveDimension.nullable().optional(),
  packedLength: positiveDimension.optional(),
  packedWidth: positiveDimension.optional(),
  packedHeight: positiveDimension.optional(),
  packedWeight: positiveDimension.optional(),
  editionNumber: z.number().int().positive().nullable().optional(),
  editionTotal: z.number().int().positive().nullable().optional(),
})

/** GET /me/listings query params */
export const myListingsQuery = z.object({
  status: z.enum(statusValues).optional(),
  category: z.enum(categoryValues).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .optional()
    .default(20)
    .transform((v) => Math.min(v, 100)),
})

/** PUT /me/listings/:id/availability body */
export const listingAvailabilityBody = z.object({
  status: z.enum(['available', 'reserved_artist']),
})

// ============================================================================
// Listing image management schemas
// ============================================================================

/** POST /me/listings/:id/images body */
export const listingImageBody = z.object({
  url: z.string().url('Invalid URL'),
  isProcessPhoto: z.boolean().optional().default(false),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
})

/** PUT /me/listings/:id/images/reorder body */
export const listingImageReorderBody = z.object({
  orderedIds: z.array(z.string().uuid('Invalid UUID format')).min(1, 'At least one ID is required'),
})

// ============================================================================
// Admin management schemas
// ============================================================================

/** GET /admin/applications query params */
export const adminApplicationsQuery = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'withdrawn'] as const).optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .optional()
    .default(20)
    .transform((v) => Math.min(v, 100)),
})

/** GET /admin/users query params */
export const adminUsersQuery = z.object({
  search: z.string().max(200).optional(),
  role: z.enum(['buyer', 'artist', 'admin', 'curator', 'moderator'] as const).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .optional()
    .default(20)
    .transform((v) => Math.min(v, 100)),
})

/** GET /admin/artists query params */
export const adminArtistsQuery = z.object({
  status: z.enum(['pending', 'approved', 'suspended'] as const).optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .optional()
    .default(20)
    .transform((v) => Math.min(v, 100)),
})

/** GET /admin/listings query params */
export const adminListingsQuery = z.object({
  status: z.enum([...statusValues, 'hidden'] as [string, ...string[]]).optional(),
  artistId: z.string().uuid().optional(),
  category: z.enum(categoryValues).optional(),
  priceMin: z.coerce.number().int().min(0).optional(),
  priceMax: z.coerce.number().int().min(0).optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .optional()
    .default(20)
    .transform((v) => Math.min(v, 100)),
})

/** POST /admin/users/:id/roles body */
export const adminRoleGrantBody = z.object({
  role: z.enum(['buyer', 'artist', 'admin', 'curator', 'moderator'] as const),
})

/** POST /admin/artists/:id/suspend body */
export const adminSuspendBody = z.object({
  reason: z.string().min(1, 'Reason is required').max(2000),
})

/** PUT /admin/artists/:id body */
export const adminArtistUpdateBody = z.object({
  displayName: z.string().min(1).max(200).optional(),
  slug: slugParam.optional(),
  bio: z.string().max(5000).optional(),
  location: z.string().max(200).optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  instagramUrl: z.string().url().optional().or(z.literal('')),
  profileImageUrl: z.string().url().nullable().optional(),
  coverImageUrl: z.string().url().nullable().optional(),
  originZip: z.string().max(10).optional(),
  status: z.enum(['pending', 'approved', 'suspended'] as const).optional(),
  isDemo: z.boolean().optional(),
  accentColor: hexColor.nullable().optional(),
})

/** PUT /admin/listings/:id body — extends listing update with status */
export const adminListingUpdateBody = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  medium: z.string().min(1).max(200).optional(),
  category: z.enum(categoryValues).optional(),
  type: z.enum(listingTypeValues).optional(),
  price: z.number().int().positive().optional(),
  status: z.enum([...statusValues, 'hidden'] as [string, ...string[]]).optional(),
  quantityTotal: z.number().int().min(1).optional(),
  artworkLength: z.number().positive().nullable().optional(),
  artworkWidth: z.number().positive().nullable().optional(),
  artworkHeight: z.number().positive().nullable().optional(),
  packedLength: z.number().positive().optional(),
  packedWidth: z.number().positive().optional(),
  packedHeight: z.number().positive().optional(),
  packedWeight: z.number().positive().optional(),
  editionNumber: z.number().int().positive().nullable().optional(),
  editionTotal: z.number().int().positive().nullable().optional(),
})

/** POST /admin/listings/:id/hide body */
export const adminListingHideBody = z.object({
  reason: z.string().min(1, 'Reason is required').max(2000),
})

/** GET /admin/audit-log query params */
export const adminAuditLogQuery = z.object({
  adminId: z.string().uuid().optional(),
  targetType: z.string().max(50).optional(),
  targetId: z.string().uuid().optional(),
  action: z.string().max(100).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .optional()
    .default(20)
    .transform((v) => Math.min(v, 100)),
})

/** GET /admin/waitlist query params */
export const adminWaitlistQuery = z.object({
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .optional()
    .default(20)
    .transform((v) => Math.min(v, 100)),
})

/** GET /admin/orders query params */
const orderStatusValues = Object.values(OrderStatus) as [string, ...string[]]

export const adminOrdersQuery = z.object({
  status: z.enum(orderStatusValues).optional(),
  buyerId: z.string().uuid().optional(),
  artistId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .optional()
    .default(20)
    .transform((v) => Math.min(v, 100)),
})

/** POST /admin/orders/:id/refund body */
export const adminOrderRefundBody = z.object({
  reason: z.string().min(1, 'Reason is required').max(2000),
  amount: z.number().int().positive('Amount must be positive').optional(),
})

// 'pending' is the initial state — no status can transition *to* pending,
// so it is excluded from the update body to surface invalid requests at the
// schema layer rather than with a confusing transition-guard error.
const orderStatusUpdateValues = orderStatusValues.filter(
  (s) => s !== 'pending',
) as [string, ...string[]]

/** PUT /admin/orders/:id/status body */
export const adminOrderStatusUpdateBody = z.object({
  status: z.enum(orderStatusUpdateValues),
  reason: z.string().min(1, 'Reason is required').max(2000),
})

/** POST /admin/listings/bulk-status body */
export const adminBulkListingStatusBody = z.object({
  listingIds: z
    .array(z.string().uuid())
    .min(1, 'At least one listing ID is required')
    .max(100, 'Maximum 100 listings per request'),
  status: z.enum([...statusValues, 'hidden'] as [string, ...string[]]),
  reason: z.string().min(1, 'Reason is required').max(2000),
})

/** POST /admin/users/bulk-role body */
export const adminBulkRoleGrantBody = z.object({
  userIds: z
    .array(z.string().uuid())
    .min(1, 'At least one user ID is required')
    .max(100, 'Maximum 100 users per request'),
  role: z.enum(['buyer', 'artist', 'admin', 'curator', 'moderator'] as const),
})

// ============================================================================
// Inferred types (derive TypeScript types from schemas)
// ============================================================================

export type SearchQuery = z.infer<typeof searchQuery>
export type ArtistsQuery = z.infer<typeof artistsQuery>
export type ListingsQuery = z.infer<typeof listingsQuery>
export type WaitlistBody = z.infer<typeof waitlistBody>
export type ArtistApplicationBody = z.infer<typeof artistApplicationBody>
export type CheckEmailQuery = z.infer<typeof checkEmailQuery>
export type PresignedUrlBody = z.infer<typeof presignedUrlBody>
export type ProfileUpdateBody = z.infer<typeof profileUpdateBody>
export type CategoriesUpdateBody = z.infer<typeof categoriesUpdateBody>
export type TagsUpdateBody = z.infer<typeof tagsUpdateBody>
export type ListingTagsUpdateBody = z.infer<typeof listingTagsUpdateBody>
export type CvEntryBody = z.infer<typeof cvEntryBody>
export type CvEntryReorderBody = z.infer<typeof cvEntryReorderBody>
export type ProcessMediaPhotoBody = z.infer<typeof processMediaPhotoBody>
export type ProcessMediaVideoBody = z.infer<typeof processMediaVideoBody>
export type ProcessMediaReorderBody = z.infer<typeof processMediaReorderBody>
export type AdminReviewBody = z.infer<typeof adminReviewBody>
export type ListingCreateBody = z.infer<typeof listingCreateBody>
export type ListingUpdateBody = z.infer<typeof listingUpdateBody>
export type MyListingsQuery = z.infer<typeof myListingsQuery>
export type ListingAvailabilityBody = z.infer<typeof listingAvailabilityBody>
export type ListingImageBody = z.infer<typeof listingImageBody>
export type ListingImageReorderBody = z.infer<typeof listingImageReorderBody>
export type AdminApplicationsQuery = z.infer<typeof adminApplicationsQuery>
export type AdminUsersQuery = z.infer<typeof adminUsersQuery>
export type AdminArtistsQuery = z.infer<typeof adminArtistsQuery>
export type AdminListingsQuery = z.infer<typeof adminListingsQuery>
export type AdminRoleGrantBody = z.infer<typeof adminRoleGrantBody>
export type AdminSuspendBody = z.infer<typeof adminSuspendBody>
export type AdminArtistUpdateBody = z.infer<typeof adminArtistUpdateBody>
export type AdminListingUpdateBody = z.infer<typeof adminListingUpdateBody>
export type AdminListingHideBody = z.infer<typeof adminListingHideBody>
export type AdminAuditLogQuery = z.infer<typeof adminAuditLogQuery>
export type AdminWaitlistQuery = z.infer<typeof adminWaitlistQuery>
export type AdminOrdersQuery = z.infer<typeof adminOrdersQuery>
export type AdminOrderRefundBody = z.infer<typeof adminOrderRefundBody>
export type AdminOrderStatusUpdateBody = z.infer<typeof adminOrderStatusUpdateBody>
export type AdminBulkListingStatusBody = z.infer<typeof adminBulkListingStatusBody>
export type AdminBulkRoleGrantBody = z.infer<typeof adminBulkRoleGrantBody>
