/**
 * User role types in the system
 * - buyer: Default role assigned to all users on signup
 * - artist: Assigned when artist application is approved
 * - admin: Platform staff with full access
 * - curator: Curatorial team with application review access
 * - moderator: Content moderation access
 */
export const UserRole = {
  BUYER: 'buyer',
  ARTIST: 'artist',
  ADMIN: 'admin',
  CURATOR: 'curator',
  MODERATOR: 'moderator',
} as const

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole]

/**
 * Artist profile status
 * - pending: Application submitted, awaiting review
 * - approved: Accepted artist, profile visible publicly
 * - suspended: Access revoked, profile hidden
 */
export const ArtistStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  SUSPENDED: 'suspended',
} as const

export type ArtistStatusType = (typeof ArtistStatus)[keyof typeof ArtistStatus]

/**
 * Listing availability status
 * - available: Listed and purchasable
 * - reserved_system: Locked during an active checkout session (time-boxed, 15 min)
 * - reserved_artist: Manually toggled by the artist (no expiry)
 * - sold: Purchase completed, piece moves to archive
 */
export const ListingStatus = {
  AVAILABLE: 'available',
  RESERVED_SYSTEM: 'reserved_system',
  RESERVED_ARTIST: 'reserved_artist',
  SOLD: 'sold',
} as const

export type ListingStatusType = (typeof ListingStatus)[keyof typeof ListingStatus]

/**
 * Listing type
 * - standard: A completed piece listed for immediate sale
 * - commission: A slot created after off-platform negotiation
 */
export const ListingType = {
  STANDARD: 'standard',
  COMMISSION: 'commission',
} as const

export type ListingTypeType = (typeof ListingType)[keyof typeof ListingType]

/**
 * Art categories
 * Platform launches with 9 categories
 */
export const Category = {
  CERAMICS: 'ceramics',
  PAINTING: 'painting',
  PRINT: 'print',
  JEWELRY: 'jewelry',
  ILLUSTRATION: 'illustration',
  PHOTOGRAPHY: 'photography',
  WOODWORKING: 'woodworking',
  FIBERS: 'fibers',
  MIXED_MEDIA: 'mixed_media',
} as const

export type CategoryType = (typeof Category)[keyof typeof Category]

/**
 * Commission workflow status
 */
export const CommissionStatus = {
  PROPOSED: 'proposed',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export type CommissionStatusType = (typeof CommissionStatus)[keyof typeof CommissionStatus]

/**
 * Order status
 */
export const OrderStatus = {
  PENDING: 'pending',
  PAID: 'paid',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  COMPLETE: 'complete',
  DISPUTED: 'disputed',
  REFUNDED: 'refunded',
} as const

export type OrderStatusType = (typeof OrderStatus)[keyof typeof OrderStatus]

/**
 * CV entry types for artist profiles
 */
export const CvEntryType = {
  EXHIBITION: 'exhibition',
  AWARD: 'award',
  EDUCATION: 'education',
  PRESS: 'press',
  RESIDENCY: 'residency',
  OTHER: 'other',
} as const

export type CvEntryTypeType = (typeof CvEntryType)[keyof typeof CvEntryType]

/**
 * Process media types
 */
export const ProcessMediaType = {
  PHOTO: 'photo',
  VIDEO: 'video',
} as const

export type ProcessMediaTypeType = (typeof ProcessMediaType)[keyof typeof ProcessMediaType]

/**
 * Artist application status
 * - pending: Application submitted, awaiting review
 * - approved: Accepted, artist profile will be created
 * - rejected: Not accepted at this time
 * - withdrawn: Applicant withdrew their application
 */
export const ApplicationStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
} as const

export type ApplicationStatusType = (typeof ApplicationStatus)[keyof typeof ApplicationStatus]
