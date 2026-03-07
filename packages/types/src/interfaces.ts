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
 * Platform-controlled tag for categorizing art
 * Tags are scoped to a category (or cross-cutting for style tags with null category)
 */
export interface Tag {
  id: string // UUID
  slug: string // Unique identifier
  label: string // Human-readable display label
  category: CategoryType | null // null = cross-cutting style tag
  sortOrder: number
}

/**
 * Tag assignment for an artist
 */
export interface ArtistTag {
  id: string // UUID
  artistId: string // FK -> artist_profiles.id
  tagId: string // FK -> tags.id
}

/**
 * Tag assignment for a listing
 */
export interface ListingTag {
  id: string // UUID
  listingId: string // FK -> listings.id
  tagId: string // FK -> tags.id
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
  width: number | null // Image pixel width (for aspect ratio)
  height: number | null // Image pixel height (for aspect ratio)
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
    websiteUrl: string | null
    instagramUrl: string | null
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

// ─── CV Entry API Response Types ──────────────────────────────────────

/**
 * Single CV entry as returned by the API.
 * Omits artistId since it's implied by the /me scope.
 */
export interface CvEntryResponse {
  id: string
  type: CvEntryTypeType
  title: string
  institution: string | null
  year: number
  description: string | null
  sortOrder: number
}

/**
 * Response from GET /me/cv-entries.
 */
export interface CvEntryListResponse {
  cvEntries: CvEntryResponse[]
}

// ─── Process Media API Response Types ─────────────────────────────────

/**
 * Single process media item as returned by the API.
 * Omits artistId since it's implied by the /me scope.
 */
export interface ProcessMediaResponse {
  id: string
  type: ProcessMediaTypeType
  url: string | null
  videoPlaybackId: string | null
  videoProvider: string | null
  sortOrder: number
  createdAt: string
}

/**
 * Response from GET /me/process-media.
 */
export interface ProcessMediaListResponse {
  processMedia: ProcessMediaResponse[]
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

// ─── Admin Management Response Types ────────────────────────────────

/**
 * Application list item for GET /admin/applications
 */
export interface AdminApplicationListItem {
  id: string
  email: string
  fullName: string
  categories: CategoryType[]
  status: ApplicationStatusType
  submittedAt: string
  reviewedBy: string | null
  reviewedAt: string | null
  reviewerName: string | null
}

/**
 * Full application detail for GET /admin/applications/:id
 */
export interface AdminApplicationDetailResponse {
  id: string
  email: string
  fullName: string
  instagramUrl: string | null
  websiteUrl: string | null
  statement: string
  exhibitionHistory: string | null
  categories: CategoryType[]
  status: ApplicationStatusType
  submittedAt: string
  reviewedBy: string | null
  reviewedAt: string | null
  reviewerName: string | null
  reviewNotes: string | null
}

/**
 * User list item for GET /admin/users
 */
export interface AdminUserListItem {
  id: string
  email: string
  fullName: string
  roles: UserRoleType[]
  createdAt: string
  lastActiveAt: string | null
  hasArtistProfile: boolean
}

/**
 * Full user detail for GET /admin/users/:id
 */
export interface AdminUserDetailResponse {
  id: string
  email: string
  fullName: string
  avatarUrl: string | null
  roles: { role: UserRoleType; grantedAt: string; grantedBy: string | null }[]
  createdAt: string
  lastActiveAt: string | null
  artistProfile: {
    id: string
    displayName: string
    slug: string
    status: ArtistStatusType
  } | null
  stats: {
    orderCount: number
    reviewCount: number
    saveCount: number
    followCount: number
  }
}

/**
 * Artist list item for GET /admin/artists
 */
export interface AdminArtistListItem {
  id: string
  userId: string
  displayName: string
  slug: string
  status: ArtistStatusType
  listingCount: number
  isDemo: boolean
  createdAt: string
}

/**
 * Full artist detail for GET /admin/artists/:id
 */
export interface AdminArtistDetailResponse {
  id: string
  userId: string
  displayName: string
  slug: string
  bio: string
  location: string
  websiteUrl: string | null
  instagramUrl: string | null
  originZip: string
  status: ArtistStatusType
  commissionsOpen: boolean
  coverImageUrl: string | null
  profileImageUrl: string | null
  applicationSource: string | null
  isDemo: boolean
  hasStripeAccount: boolean
  createdAt: string
  updatedAt: string
  user: { email: string; fullName: string; roles: UserRoleType[] }
  categories: CategoryType[]
  stats: {
    totalListings: number
    availableListings: number
    soldListings: number
    followerCount: number
  }
}

/**
 * Listing list item for GET /admin/listings
 */
export interface AdminListingListItem extends Listing {
  primaryImage: ListingImage | null
  artist: { displayName: string; slug: string }
}

/**
 * Full listing detail for GET /admin/listings/:id
 */
export interface AdminListingDetailResponse extends Listing {
  images: ListingImage[]
  artist: { id: string; displayName: string; slug: string; status: ArtistStatusType }
  orderCount: number
  reviewCount: number
}

/**
 * Response from POST /admin/users/:id/roles
 */
export interface AdminRoleGrantResponse {
  message: string
  role: {
    userId: string
    role: UserRoleType
    grantedAt: string
    grantedBy: string
  }
}

/**
 * Generic admin action response
 */
export interface AdminActionResponse {
  message: string
}

/**
 * Audit log entry for GET /admin/audit-log
 */
export interface AdminAuditLogEntry {
  id: string
  adminId: string
  adminName: string
  action: string
  targetType: string
  targetId: string
  details: Record<string, unknown> | null
  ipAddress: string | null
  createdAt: string
}

/**
 * Waitlist entry for GET /admin/waitlist
 */
export interface AdminWaitlistEntry {
  id: string
  email: string
  createdAt: string
}

/**
 * Response from POST /admin/listings/bulk-status
 */
export interface AdminBulkStatusResponse {
  updated: number
  failed: { id: string; error: string }[]
}

/**
 * Response from POST /admin/users/bulk-role
 */
export interface AdminBulkRoleGrantResponse {
  granted: number
  skipped: number
  failed: { id: string; error: string }[]
}

// ─── Listing Management API Response Types ────────────────────────────

/**
 * Single listing image as returned by the /me listing endpoints.
 * Omits listingId since it's implied by the listing scope.
 */
export interface MyListingImageResponse {
  id: string
  url: string
  isProcessPhoto: boolean
  sortOrder: number
  width: number | null
  height: number | null
  createdAt: string
}

/**
 * Single listing as returned by GET /me/listings/:id.
 * Includes images, omits artistId since it's implied by /me scope.
 */
export interface MyListingResponse {
  id: string
  type: ListingTypeType
  title: string
  description: string
  medium: string
  category: CategoryType
  price: number
  status: ListingStatusType
  isDocumented: boolean
  quantityTotal: number
  quantityRemaining: number
  artworkLength: number | null
  artworkWidth: number | null
  artworkHeight: number | null
  packedLength: number
  packedWidth: number
  packedHeight: number
  packedWeight: number
  editionNumber: number | null
  editionTotal: number | null
  reservedUntil: string | null
  createdAt: string
  updatedAt: string
  images: MyListingImageResponse[]
}

/**
 * Lightweight listing item for the paginated list at GET /me/listings.
 * Includes only the primary image (first by sortOrder).
 */
export interface MyListingListItem {
  id: string
  type: ListingTypeType
  title: string
  medium: string
  category: CategoryType
  price: number
  status: ListingStatusType
  isDocumented: boolean
  quantityTotal: number
  quantityRemaining: number
  createdAt: string
  updatedAt: string
  primaryImage: MyListingImageResponse | null
}

// ─── Stripe Connect Types ─────────────────────────────────────────────

/**
 * Stripe Connect onboarding status for an artist.
 * - not_started: no Stripe account created yet
 * - pending: account created but charges not yet enabled
 * - complete: account fully onboarded, charges enabled
 */
export type StripeOnboardingStatus = 'not_started' | 'pending' | 'complete'

/**
 * Response from POST /me/stripe/onboarding.
 * Contains the Stripe-hosted onboarding URL to redirect the artist to.
 */
export interface StripeOnboardingResponse {
  url: string
}

/**
 * Response from GET /me/stripe/status.
 * Returns the current Stripe Connect onboarding status.
 */
export interface StripeStatusResponse {
  status: StripeOnboardingStatus
  stripeAccountId: string | null
}

// ─── Search API Response Types ───────────────────────────────────────

/**
 * Lightweight listing item in search results.
 * Serializable (no Date objects) for the server/client boundary.
 */
export interface SearchListingItem {
  id: string
  title: string
  medium: string
  category: CategoryType
  price: number
  status: ListingStatusType
  primaryImageUrl: string | null
  primaryImageWidth: number | null
  primaryImageHeight: number | null
  artistName: string
  artistSlug: string
  rank: number
}

/**
 * Lightweight artist item in search results.
 * Serializable (no Date objects) for the server/client boundary.
 */
export interface SearchArtistItem {
  slug: string
  displayName: string
  location: string
  profileImageUrl: string | null
  coverImageUrl: string | null
  categories: CategoryType[]
  rank: number
}

/**
 * Combined search response from GET /search?q=...
 * Returns listings and artists as separate groups, each with their own total count.
 */
export interface SearchResponse {
  listings: {
    data: SearchListingItem[]
    total: number
  }
  artists: {
    data: SearchArtistItem[]
    total: number
  }
  query: string
}

// ─── Admin Order Response Types ──────────────────────────────────────

/**
 * Order list item for GET /admin/orders
 */
export interface AdminOrderListItem {
  id: string
  listingId: string
  buyerId: string
  artistId: string
  artworkPrice: number
  shippingCost: number
  platformCommission: number
  artistPayout: number
  taxAmount: number
  status: OrderStatusType
  shippingCarrier: string | null
  trackingNumber: string | null
  shippedAt: string | null
  deliveredAt: string | null
  createdAt: string
  updatedAt: string
  buyer: { id: string; email: string; fullName: string }
  artist: { id: string; displayName: string; slug: string }
  listing: { id: string; title: string }
}

/**
 * Full order detail for GET /admin/orders/:id
 */
export interface AdminOrderDetailResponse {
  id: string
  listingId: string
  buyerId: string
  artistId: string
  stripePaymentIntentId: string
  artworkPrice: number
  shippingCost: number
  platformCommission: number
  artistPayout: number
  taxAmount: number
  status: OrderStatusType
  shippingCarrier: string | null
  trackingNumber: string | null
  daysToFulfill: number | null
  shippedAt: string | null
  deliveredAt: string | null
  payoutReleasedAt: string | null
  createdAt: string
  updatedAt: string
  buyer: { id: string; email: string; fullName: string }
  artist: { id: string; displayName: string; slug: string }
  listing: { id: string; title: string; price: number }
  review: {
    id: string
    overallRating: number
    headline: string | null
    createdAt: string
  } | null
}

/**
 * Response from POST /admin/orders/:id/refund
 */
export interface AdminOrderRefundResponse {
  message: string
  refund: {
    stripeRefundId: string
    amount: number
    status: string
  }
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
