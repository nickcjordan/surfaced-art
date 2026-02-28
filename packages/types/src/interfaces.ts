import type {
  UserRoleType,
  ArtistStatusType,
  ListingStatusType,
  ListingTypeType,
  CategoryType,
  CommissionStatusType,
  OrderStatusType,
  CvEntryTypeType,
  ProcessMediaTypeType,
  ApplicationStatusType,
} from './enums'

/**
 * Base authentication record for every person on the platform
 */
export interface User {
  id: string // UUID
  cognitoId: string
  email: string
  fullName: string
  avatarUrl: string | null
  preferences: Record<string, unknown> | null // JSONB
  lastActiveAt: Date | null
  acquisitionUtmSource: string | null
  acquisitionUtmMedium: string | null
  acquisitionUtmCampaign: string | null
  acquisitionSelfReported: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Role assignment for a user
 * A user can hold multiple roles simultaneously
 */
export interface UserRole {
  id: string // UUID
  userId: string // FK -> users.id
  role: UserRoleType
  grantedAt: Date
  grantedBy: string | null // FK -> users.id, null for system-assigned
}

/**
 * Artist profile, created when a user is accepted as an artist
 */
export interface ArtistProfile {
  id: string // UUID
  userId: string // FK -> users.id
  displayName: string
  slug: string // Unique, used in URL
  bio: string
  location: string
  websiteUrl: string | null
  instagramUrl: string | null
  stripeAccountId: string | null // Set after Stripe Connect onboarding
  originZip: string // Required for shipping rate calculation
  status: ArtistStatusType
  commissionsOpen: boolean
  coverImageUrl: string | null
  profileImageUrl: string | null
  applicationSource: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Category assignment for an artist
 * An artist can work across multiple categories
 */
export interface ArtistCategory {
  id: string // UUID
  artistId: string // FK -> artist_profiles.id
  category: CategoryType
}

/**
 * CV entry for artist profile
 * Exhibition history, awards, education, press, residencies
 */
export interface ArtistCvEntry {
  id: string // UUID
  artistId: string // FK -> artist_profiles.id
  type: CvEntryTypeType
  title: string
  institution: string | null
  year: number
  description: string | null
  sortOrder: number
}

/**
 * Process media for artist profile
 * Photos and videos showing the artist making their work
 */
export interface ArtistProcessMedia {
  id: string // UUID
  artistId: string // FK -> artist_profiles.id
  type: ProcessMediaTypeType
  url: string | null // CloudFront URL for photos
  videoAssetId: string | null // Video provider's internal asset ID
  videoPlaybackId: string | null // Video provider's public playback ID
  videoProvider: string | null // e.g., "mux"
  sortOrder: number
  createdAt: Date
}

/**
 * Core listing entity
 * All monetary values in cents
 */
export interface Listing {
  id: string // UUID
  artistId: string // FK -> artist_profiles.id
  type: ListingTypeType
  title: string
  description: string
  medium: string
  category: CategoryType
  price: number // In cents
  status: ListingStatusType
  isDocumented: boolean // True when at least one process photo exists
  quantityTotal: number // For editions
  quantityRemaining: number // Decrements on sale
  // Artwork dimensions (the piece itself, in inches)
  artworkLength: number | null
  artworkWidth: number | null
  artworkHeight: number | null
  // Packed dimensions (shipping box, in inches) - required for Shippo
  packedLength: number
  packedWidth: number
  packedHeight: number
  packedWeight: number // In lbs
  // Edition info
  editionNumber: number | null
  editionTotal: number | null
  // System reservation
  reservedUntil: Date | null // Checked on read
  createdAt: Date
  updatedAt: Date
}

/**
 * Listing image
 */
export interface ListingImage {
  id: string // UUID
  listingId: string // FK -> listings.id
  url: string // CloudFront URL
  isProcessPhoto: boolean // Behind-the-scenes photo
  sortOrder: number
  createdAt: Date
}

/**
 * Commission details
 * Only exists when listing.type = 'commission'
 */
export interface Commission {
  id: string // UUID
  listingId: string // FK -> listings.id
  buyerId: string // FK -> users.id
  description: string
  timelineDays: number | null
  status: CommissionStatusType
  acceptedAt: Date | null
  daysToComplete: number | null // Calculated on completion
  notes: string | null // Internal notes, artist-only
  createdAt: Date
  updatedAt: Date
}

/**
 * Commission progress update
 */
export interface CommissionUpdate {
  id: string // UUID
  commissionId: string // FK -> commissions.id
  content: string
  imageUrl: string | null // CloudFront URL
  createdAt: Date
}

/**
 * Order record
 * All financial values snapshotted at purchase time, in cents
 */
export interface Order {
  id: string // UUID
  listingId: string // FK -> listings.id
  buyerId: string // FK -> users.id
  artistId: string // FK -> artist_profiles.id (denormalized)
  stripePaymentIntentId: string
  artworkPrice: number // In cents
  shippingCost: number // In cents, pass-through (no commission)
  platformCommission: number // In cents, 30% of artwork_price
  artistPayout: number // In cents, 70% of artwork_price
  taxAmount: number // In cents, from Stripe Tax
  status: OrderStatusType
  shippingCarrier: string | null
  trackingNumber: string | null
  daysToFulfill: number | null // Days from created_at to shipped_at
  shippedAt: Date | null
  deliveredAt: Date | null
  payoutReleasedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Review from buyer
 * Multi-dimensional ratings
 */
export interface Review {
  id: string // UUID
  orderId: string // FK -> orders.id
  listingId: string // FK -> listings.id (denormalized)
  buyerId: string // FK -> users.id
  artistId: string // FK -> artist_profiles.id (denormalized)
  ratingProduct: number // 1-5
  ratingCommunication: number // 1-5
  ratingPackaging: number // 1-5
  overallRating: number // Computed weighted average
  headline: string | null
  content: string | null
  arrivedDamaged: boolean // Flag, doesn't affect rating
  arrivedLate: boolean // Flag, doesn't affect rating
  shippingIssue: boolean // Flag, doesn't affect rating
  artistResponse: string | null
  artistRespondedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Saved listing (bookmark)
 * No inventory hold
 */
export interface Save {
  id: string // UUID
  userId: string // FK -> users.id
  listingId: string // FK -> listings.id
  createdAt: Date
}

/**
 * Artist follow
 * For notifications when new work is listed
 */
export interface Follow {
  id: string // UUID
  userId: string // FK -> users.id
  artistId: string // FK -> artist_profiles.id
  createdAt: Date
}

/**
 * Waitlist email capture
 */
export interface Waitlist {
  id: string // UUID
  email: string
  createdAt: Date
}

// ─── API Response Types ─────────────────────────────────────────────

/**
 * Listing with its images, as returned within an artist profile response
 */
export interface ListingWithImages extends Listing {
  images: ListingImage[]
}

/**
 * Full artist profile response for GET /artists/:slug
 * Contains the profile plus all related data needed to render the page
 */
export interface ArtistProfileResponse extends Omit<ArtistProfile, 'userId' | 'stripeAccountId' | 'originZip' | 'applicationSource'> {
  categories: CategoryType[]
  cvEntries: ArtistCvEntry[]
  processMedia: ArtistProcessMedia[]
  listings: ListingWithImages[]
}

/**
 * Lightweight artist item for the artists list on the homepage.
 * Returned by GET /artists (approved artists, optional `?limit=N`).
 */
export interface FeaturedArtistItem {
  slug: string
  displayName: string
  location: string
  profileImageUrl: string | null
  coverImageUrl: string | null
  categories: CategoryType[]
}

// ─── Categories API Response Types ─────────────────────────────────

/**
 * Category with listing count for GET /categories
 * Always includes all enum values, even those with zero listings
 */
export interface CategoryWithCount {
  category: CategoryType
  count: number
  artistCount: number
}

// ─── Listings API Response Types ────────────────────────────────────

/**
 * Lightweight artist summary embedded in listing responses
 */
export interface ArtistSummary {
  displayName: string
  slug: string
  profileImageUrl: string | null
  location: string
}

/**
 * Artist summary with categories, used in listing detail response
 */
export interface ArtistSummaryWithCategories extends ArtistSummary {
  categories: CategoryType[]
}

/**
 * A single listing in the paginated list response.
 * Includes primary image (first by sort_order) and lightweight artist summary.
 */
export interface ListingListItem extends Listing {
  primaryImage: ListingImage | null
  artist: ArtistSummary
}

/**
 * Full listing detail response for GET /listings/:id.
 * Includes all images sorted by sort_order and artist summary with categories.
 */
export interface ListingDetailResponse extends Listing {
  images: ListingImage[]
  artist: ArtistSummaryWithCategories
}

/**
 * Generic paginated response envelope
 */
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ─── Artist Application Types ─────────────────────────────────────────

/**
 * Artist application record
 * Submitted via the public /apply form, reviewed externally
 */
export interface ArtistApplication {
  id: string // UUID
  email: string
  fullName: string
  instagramUrl: string | null
  websiteUrl: string | null
  statement: string
  exhibitionHistory: string | null
  categories: CategoryType[]
  status: ApplicationStatusType
  submittedAt: Date
  updatedAt: Date
}

/**
 * Response from POST /artists/apply
 */
export interface ApplicationSubmitResponse {
  message: string
  applicationId: string
}

// ─── Upload Types ───────────────────────────────────────────────────

/**
 * Response from POST /uploads/presigned-url
 * Contains everything the client needs to POST a file directly to S3.
 */
export interface PresignedPostResponse {
  url: string // S3 endpoint to POST to
  fields: Record<string, string> // Form fields (policy, signature, key, etc.)
  key: string // The S3 object key
  expiresIn: number // Seconds until URL expires
}

// ─── Dashboard API Response Types ──────────────────────────────────

/**
 * Individual field completion status for the profile completion indicator.
 */
export interface ProfileCompletionField {
  label: string
  complete: boolean
}

/**
 * Dashboard response for GET /me/dashboard.
 * Returns the artist's profile summary, completion status, and listing counts.
 */
export interface DashboardResponse {
  profile: {
    id: string
    displayName: string
    slug: string
    bio: string
    location: string
    profileImageUrl: string | null
    coverImageUrl: string | null
    status: ArtistStatusType
    stripeAccountId: string | null
    categories: CategoryType[]
  }
  completion: {
    percentage: number // 0-100
    fields: ProfileCompletionField[]
  }
  stats: {
    totalListings: number
    availableListings: number
    soldListings: number
    totalViews: number // Placeholder: always 0 until analytics
  }
}

// ─── Profile Update API Response Types ─────────────────────────────

/**
 * Response from PUT /me/profile.
 * Returns the updated profile fields so the frontend can update its local state.
 */
export interface ProfileUpdateResponse {
  id: string
  displayName: string
  slug: string
  bio: string
  location: string
  websiteUrl: string | null
  instagramUrl: string | null
  profileImageUrl: string | null
  coverImageUrl: string | null
  status: ArtistStatusType
}

// ─── Categories Update API Response Types ─────────────────────────────

/**
 * Response from PUT /me/categories.
 * Returns the updated category list.
 */
export interface CategoriesUpdateResponse {
  categories: CategoryType[]
}

// ─── Admin API Response Types ────────────────────────────────────────

/**
 * Response from POST /admin/artists/:userId/approve
 */
export interface AdminApproveResponse {
  message: string
  profile: {
    id: string
    slug: string
    displayName: string
  }
}

/**
 * Response from POST /admin/artists/:userId/reject
 */
export interface AdminRejectResponse {
  message: string
}

// ─── API Error Types ──────────────────────────────────────────────────

/**
 * Standardized API error response shape.
 * All error responses from the API follow this format.
 */
export interface ApiError {
  error: {
    code: string // Machine-readable: "NOT_FOUND", "VALIDATION_ERROR", etc.
    message: string // Human-readable description
    details?: unknown // Field-level validation errors when applicable
  }
}
