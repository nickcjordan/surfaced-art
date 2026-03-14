# Backend/API Status Report — 2026-03-09

## Current State Summary

The backend API is a Hono framework application running on AWS Lambda, backed by PostgreSQL via Prisma ORM. Phases 1-3 are complete: the API has comprehensive public read endpoints, authenticated artist CRUD (profile, listings, CV, process media), a full admin API (4 tiers of endpoints), Stripe Connect onboarding, artist application flow with email notifications, and full-text search. Phase 4 (transactions/checkout) is entirely unbuilt — there is no checkout, payment capture, order creation, or buyer account flow yet.

## API Endpoints Inventory

### Public Endpoints (no auth)

| Method | Path | Purpose | Status |
|--------|------|---------|--------|
| GET | `/` | API info | Implemented |
| GET | `/health` | Lambda health check | Implemented |
| GET | `/health/db` | Database connectivity check | Implemented |
| GET | `/artists` | List approved artists (with category/limit filters) | Implemented |
| GET | `/artists/:slug` | Full artist profile with categories, tags, CV, process media, listings | Implemented |
| GET | `/listings` | Paginated listings with category/status filters | Implemented |
| GET | `/listings/:id` | Listing detail with all images, tags, artist summary | Implemented |
| GET | `/categories` | All categories with listing + artist counts | Implemented |
| GET | `/tags` | Platform tag vocabulary (optional category filter) | Implemented |
| GET | `/search` | Full-text search across listings and artists (PostgreSQL tsvector) | Implemented |
| POST | `/waitlist` | Email capture for buyer waitlist | Implemented |
| GET | `/artists/apply/check-email` | Check if application exists for email | Implemented |
| POST | `/artists/apply` | Submit artist application (sends confirmation + admin notification emails) | Implemented |

### Authenticated Artist Endpoints (`/me/*` — requires `artist` role)

| Method | Path | Purpose | Status |
|--------|------|---------|--------|
| GET | `/me/dashboard` | Artist dashboard data | Implemented |
| PUT | `/me/profile` | Update profile (bio, location, URLs, images) | Implemented |
| PUT | `/me/categories` | Update artist categories | Implemented |
| GET | `/me/tags` | Get artist's tags | Implemented |
| PUT | `/me/tags` | Update artist tags | Implemented |
| GET | `/me/cv-entries` | List CV entries | Implemented |
| POST | `/me/cv-entries` | Create CV entry | Implemented |
| PUT | `/me/cv-entries/reorder` | Reorder CV entries | Implemented |
| PUT | `/me/cv-entries/:id` | Update CV entry | Implemented |
| DELETE | `/me/cv-entries/:id` | Delete CV entry | Implemented |
| GET | `/me/process-media` | List process media | Implemented |
| POST | `/me/process-media/photo` | Add process photo | Implemented |
| POST | `/me/process-media/video` | Add process video (Mux reference) | Implemented |
| PUT | `/me/process-media/reorder` | Reorder process media | Implemented |
| DELETE | `/me/process-media/:id` | Delete process media | Implemented |
| GET | `/me/listings` | List artist's own listings | Implemented |
| POST | `/me/listings` | Create listing | Implemented |
| GET | `/me/listings/:id` | Get own listing detail | Implemented |
| PUT | `/me/listings/:id` | Update listing | Implemented |
| DELETE | `/me/listings/:id` | Delete listing | Implemented |
| POST | `/me/listings/:id/images` | Add listing image | Implemented |
| DELETE | `/me/listings/:id/images/:imageId` | Delete listing image | Implemented |
| PUT | `/me/listings/:id/images/reorder` | Reorder listing images | Implemented |
| PUT | `/me/listings/:id/availability` | Toggle listing available/hidden/reserved_artist | Implemented |
| PUT | `/me/listings/:id/tags` | Update listing tags | Implemented |
| POST | `/me/stripe/onboarding` | Generate Stripe Connect onboarding link | Implemented |
| GET | `/me/stripe/status` | Check Stripe onboarding completion | Implemented |

### Upload Endpoints (requires `artist` or `admin` role)

| Method | Path | Purpose | Status |
|--------|------|---------|--------|
| POST | `/uploads/presigned-url` | Generate presigned S3 POST URL for direct upload | Implemented |

### Webhook Endpoints

| Method | Path | Purpose | Status |
|--------|------|---------|--------|
| POST | `/webhooks/stripe` | Stripe webhook handler (account.updated only) | Implemented |

### Admin Endpoints (`/admin/*` — requires `admin` role)

| Method | Path | Purpose | Status |
|--------|------|---------|--------|
| GET | `/admin/applications` | List applications (paginated, filterable by status) | Implemented |
| GET | `/admin/applications/:id` | Application detail | Implemented |
| POST | `/admin/artists/:userId/approve` | Approve application, create artist profile + role | Implemented |
| POST | `/admin/artists/:userId/reject` | Reject application | Implemented |
| GET | `/admin/users` | List users (paginated, filterable) | Implemented |
| GET | `/admin/users/:id` | User detail with roles | Implemented |
| POST | `/admin/users/:id/roles` | Grant role to user | Implemented |
| DELETE | `/admin/users/:id/roles/:role` | Revoke role from user | Implemented |
| GET | `/admin/artists` | List artist profiles (filterable by status) | Implemented |
| GET | `/admin/artists/:id` | Artist profile detail | Implemented |
| PUT | `/admin/artists/:id` | Update artist profile | Implemented |
| POST | `/admin/artists/:id/suspend` | Suspend artist | Implemented |
| POST | `/admin/artists/:id/unsuspend` | Unsuspend artist | Implemented |
| GET | `/admin/listings` | List listings (paginated, filterable) | Implemented |
| GET | `/admin/listings/:id` | Listing detail | Implemented |
| PUT | `/admin/listings/:id` | Update listing | Implemented |
| POST | `/admin/listings/:id/hide` | Hide listing | Implemented |
| POST | `/admin/listings/:id/unhide` | Unhide listing | Implemented |
| GET | `/admin/orders` | List orders (paginated, filterable by status/buyer/artist/date) | Implemented |
| GET | `/admin/orders/:id` | Order detail with buyer, artist, listing, review | Implemented |
| POST | `/admin/orders/:id/refund` | Initiate Stripe refund (full or partial) | Implemented |
| PUT | `/admin/orders/:id/status` | Manual order status update with transition validation | Implemented |
| GET | `/admin/audit-log` | Query admin audit log (paginated, filterable) | Implemented |
| GET | `/admin/audit-log/user/:userId` | Audit log entries for specific admin | Implemented |
| GET | `/admin/waitlist` | List waitlist entries (paginated, searchable) | Implemented |
| DELETE | `/admin/waitlist/:id` | Delete waitlist entry | Implemented |
| POST | `/admin/listings/bulk-status` | Bulk status change for multiple listings | Implemented |
| POST | `/admin/users/bulk-role` | Bulk role grant for multiple users | Implemented |
| POST | `/admin/impersonate/:userId` | Start impersonation session (read-only) | Implemented |
| GET | `/admin/impersonate/:userId/dashboard` | View user's dashboard as admin | Implemented |
| GET | `/admin/impersonate/:userId/listings` | View user's listings as admin | Implemented |

### NOT Implemented (Phase 4 — Transactions)

| Method | Path | Purpose | Status |
|--------|------|---------|--------|
| POST | `/checkout` | Create checkout session with Shippo rates + Stripe payment | Missing |
| POST | `/orders` | Create order after payment capture | Missing |
| GET | `/me/orders` | Buyer order history | Missing |
| PUT | `/me/orders/:id/tracking` | Artist adds tracking number | Missing |
| POST | `/me/orders/:id/confirm-delivery` | Buyer confirms delivery | Missing |
| POST | `/reviews` | Submit review (post-delivery) | Missing |
| GET | `/me/saves` | Buyer's saved listings | Missing |
| POST | `/me/saves/:listingId` | Save a listing | Missing |
| DELETE | `/me/saves/:listingId` | Unsave a listing | Missing |
| GET | `/me/follows` | Buyer's followed artists | Missing |
| POST | `/me/follows/:artistId` | Follow an artist | Missing |
| DELETE | `/me/follows/:artistId` | Unfollow an artist | Missing |
| POST | `/commissions` | Create commission proposal | Missing |
| Various | `/webhooks/stripe` (payment_intent.*) | Payment lifecycle webhooks | Missing |

## Data Model Status

### Schema Completeness
- **19 models** defined in `schema.prisma` covering all entities from the data model spec
- **10 enums** for type-safe status/category values
- **7 migrations** applied, latest: `20260307000000_categories_tags_restructure`
- All monetary values properly stored as `Int` (cents)
- All primary keys are UUIDs
- `searchVector` fields (tsvector) on `ArtistProfile` and `Listing` for full-text search
- `ListingImage` has `width`/`height` fields for aspect ratio calculations
- Proper indexes on foreign keys, status fields, and composite lookups

### Models Present and Fully Migrated
- `User`, `UserRole`, `ArtistProfile`, `ArtistCategory`, `Tag`, `ArtistTag`, `ListingTag`
- `ArtistCvEntry`, `ArtistProcessMedia`, `Listing`, `ListingImage`
- `Commission`, `CommissionUpdate`, `Order`, `Review`, `Save`, `Follow`
- `Waitlist`, `AdminAuditLog`, `ArtistApplication`

### Data Model Gaps
- **No `disputes` table** — SUR-183 (backlog) plans this for before Phase 4
- **No `payouts` table** — payout tracking is a field on `Order` (`payoutReleasedAt`) but there is no dedicated payout ledger
- **No `notifications` table** — for in-app notification tracking (deferred to post-launch)
- **No `custom_accent_color`** on artist profiles — explicitly deferred for per-artist theming
- **No soft-delete columns** — SUR-167 (backlog) plans a data retention policy ADR
- **No variable commission rate field** — SUR-160 plans artist incentive program schema changes

## Payment/Order Flow

### What's Implemented (Stripe Connect Onboarding)
- `POST /me/stripe/onboarding` — creates Stripe Standard Connect account, generates account link
- `GET /me/stripe/status` — queries Stripe API for `charges_enabled` status
- `POST /webhooks/stripe` — handles `account.updated` events (logs onboarding progress)
- `stripeAccountId` stored on `ArtistProfile`
- Stripe SDK pinned to API version `2026-02-25.clover`

### What's Implemented (Admin Order Management)
- `GET /admin/orders` — list/filter orders
- `GET /admin/orders/:id` — order detail
- `POST /admin/orders/:id/refund` — Stripe refund (full or partial) with audit logging
- `PUT /admin/orders/:id/status` — status transition with validation (pending -> paid -> shipped -> delivered -> complete, with dispute/refund branches)

### What's Missing (Buyer Checkout — SUR-99)
- **No checkout flow** — no Shippo rate calculation, no Stripe PaymentIntent creation
- **No listing reservation logic** — `reserved_system` status exists in schema but no endpoint sets it during checkout
- **No order creation endpoint** — the `Order` table exists but nothing writes to it
- **No Stripe Tax integration** — tax calculation not implemented
- **No payment confirmation webhook** — only `account.updated` is handled; `payment_intent.succeeded` and other payment events are not

### What's Missing (Post-Purchase — SUR-100)
- **No tracking/fulfillment endpoints** — artist cannot add tracking number
- **No delivery confirmation** — no buyer-side confirmation
- **No payout release logic** — no mechanism to release artist payouts after delivery
- **No Stripe Transfer/payout API calls** — only Connect onboarding exists

### What's Missing (Buyer Accounts — SUR-98)
- **No saved listings endpoints** — `Save` model exists but no API routes
- **No followed artists endpoints** — `Follow` model exists but no API routes
- **No buyer order history** — no `/me/orders` endpoint

### What's Missing (Reviews — SUR-101)
- **No review submission endpoint** — `Review` model exists but no API routes
- **No artist response endpoint**
- **No review display on listing/artist pages**

### What's Missing (Commissions — SUR-102)
- **No commission flow** — `Commission` and `CommissionUpdate` models exist but no API routes

## Email System

### Infrastructure
- Uses AWS SES via `@aws-sdk/client-ses`
- React Email for template rendering (HTML + plaintext)
- Rate limiting built in (`rate-limiter.ts`)
- From address: configurable via `SES_FROM_ADDRESS` env var
- Admin email: `surfacedartllc@gmail.com`
- Configuration set support for SES tracking

### Templates Implemented (5)
| Template | Used By | Status |
|----------|---------|--------|
| `ArtistApplicationConfirmation` | `POST /artists/apply` | Working (fire-and-forget) |
| `AdminApplicationNotification` | `POST /artists/apply` | Working (fire-and-forget) |
| `ArtistAcceptance` | `POST /admin/artists/:userId/approve` | Working |
| `ArtistRejection` | `POST /admin/artists/:userId/reject` | Working |
| `WaitlistWelcome` | Not wired to any endpoint | Template exists, not sent |

### Templates Missing (SUR-157 — Phase 4)
- Order confirmation (to buyer)
- New order notification (to artist)
- Shipping notification with tracking link
- Delivery confirmation
- Payout release notification
- Review prompt (post-delivery)
- Commission lifecycle emails

### SES Configuration
- SES region defaults to `us-east-1`
- No evidence of production domain verification status in codebase (would be in AWS console)
- Configuration set name is optional (may not be configured)

## Image Processing Pipeline

### Architecture: S3 Upload -> Lambda -> CloudFront
- **Upload**: Artists request presigned S3 POST URLs via `POST /uploads/presigned-url`
  - Supports JPEG, PNG content types
  - 10MB max file size, 5-minute URL expiry
  - Key pattern: `uploads/{context}/{userId}/{uuid}.{ext}`
  - Requires `artist` or `admin` role
- **Processing**: `apps/image-processor/` — Lambda triggered by S3 PutObject events
  - Generates 3 WebP variants: 400w, 800w, 1200w
  - Quality: 82 (art gallery grade)
  - No upscaling — smaller images produce fewer variants
  - Output key pattern: `{original-key-without-ext}/{width}w.webp`
  - Cache-Control: `public, max-age=31536000, immutable`
- **Delivery**: CloudFront CDN
  - Prod: `dmfu4c7s6z2cc.cloudfront.net` (bucket: `surfaced-art-prod-media`)
  - Dev: `d2agn4aoo0e7ji.cloudfront.net` (bucket: `surfaced-art-dev-media`)

### Pipeline Status
- Fully deployed and operational (confirmed per MEMORY.md)
- ECR-based Lambda (container image, not ZIP)
- Seed images uploaded for 24 demo artists (dev) and 3 real artists (prod)
- Image dimensions (width/height) stored on `ListingImage` for frontend aspect ratio

## Middleware Stack

| Middleware | Purpose | Status |
|-----------|---------|--------|
| Security headers | CSP, HSTS, X-Content-Type-Options, etc. | Implemented |
| CORS | Configured for frontend URL + localhost + Vercel previews | Implemented |
| Rate limiting | Per-route limits (5-30 req/min depending on endpoint) | Implemented |
| Cache-Control | Public caching for read endpoints, private for auth endpoints | Implemented |
| Auth (JWT) | Cognito JWT verification via `aws-jwt-verify` | Implemented |
| Optional Auth | Same as auth but doesn't block unauthenticated requests | Implemented |
| Role check | `requireRole()` and `requireAnyRole()` helpers | Implemented |
| Audit logging | Fire-and-forget writes to `admin_audit_log` table | Implemented |
| ISR revalidation | Fire-and-forget POST to frontend revalidation endpoint | Implemented |

### Auth Architecture
- AWS Cognito User Pool for identity (Terraform module exists)
- JWT `id` tokens verified server-side
- Auto-provisioning: first authenticated request creates `User` record + `buyer` role
- Role-based access: `buyer`, `artist`, `admin`, `curator`, `moderator`

## Key Findings

### What's Working Well
- **API design is consistent and well-structured** — Zod validation on all endpoints, standardized error responses, structured logging with duration metrics
- **Admin API is surprisingly comprehensive** — 30+ endpoints covering applications, users, artists, listings, orders, audit, bulk operations, and impersonation
- **Image pipeline is production-ready** — upload -> process -> CDN delivery chain is fully operational
- **Email infrastructure is solid** — React Email templates, SES integration, rate limiting, fire-and-forget pattern
- **Search is properly implemented** — PostgreSQL full-text search with `tsvector` columns and `ts_rank` ordering
- **Security middleware is thorough** — rate limiting, CORS, security headers, JWT verification all in place
- **Test coverage is good** — every route file has a corresponding `.test.ts` file, plus integration tests for key flows
- **Expired reservation handling** — `reserved_system` listings with expired `reservedUntil` are treated as `available` on read (no background job needed)

### What's Not Working / Incomplete
- **Stripe webhook is thin** — only handles `account.updated`; no payment lifecycle events
- **WaitlistWelcome email template exists but is never sent** — not wired to any endpoint
- **No `/auth/me` endpoint** — SUR-195 (backlog, ready) plans this for admin UI foundation
- **No Shippo integration at all** — shipping rate calculation is entirely missing
- **Admin order endpoints exist but orders can't be created** — the admin can manage/refund orders that don't exist yet

## Gaps & Concerns

### Critical for Launch (Phase 4 blockers)
- **Checkout flow (SUR-99)**: Shippo rates, Stripe PaymentIntent, listing reservation, order creation — this is the core revenue path
- **Post-purchase fulfillment (SUR-100)**: Tracking, delivery confirmation, payout release
- **Buyer accounts (SUR-98)**: Saves, follows, order history
- **Transactional email templates (SUR-157)**: Order confirmation, shipping, delivery, payout, review prompt

### Important Pre-Launch
- **Disputes table (SUR-183)**: Schema needed before real transactions
- **Data retention/soft-delete policy (SUR-167)**: ADR needed before handling real user data
- **Load testing (SUR-177)**: k6 tests for checkout/browse before processing real payments
- **Secrets Manager migration (SUR-163)**: Env vars -> AWS Secrets Manager for rotation/audit
- **Refund/dispute policies (SUR-174)**: Content pages + data deletion workflow

### Architecture Concerns
- **No API versioning** — the API has no `/v1/` prefix. Adding it later with existing consumers will be painful.
- **Rate limiter is in-memory** — works for single Lambda instance but resets on cold starts. Not a problem at current scale but won't work under real load.
- **No request ID / correlation ID middleware** — makes tracing requests across Lambda invocations harder
- **Stripe webhook has no idempotency handling** — if Stripe retries a webhook, the handler will process it again

## Unplanned Work Discovered

1. **WaitlistWelcome email is dead code** — template exists in the email package, exported from `index.ts`, but no endpoint or route sends it. Either wire it to `POST /waitlist` or remove it.

2. **Admin order endpoints are orphaned** — `GET/POST /admin/orders/*` exist with full Stripe refund integration, but there's no way to create orders in the system. These endpoints will return empty results until the checkout flow (SUR-99) is built.

3. **No API versioning prefix** — all routes are mounted at root (`/artists`, `/listings`, etc.). Consider adding `/v1/` before the API surface grows further. The longer this is deferred, the more painful the migration.

4. **No request tracing** — add a `X-Request-Id` middleware that generates a UUID per request and includes it in all log entries. Critical for debugging production issues.

5. **Commission/CommissionUpdate models are fully defined in schema but have zero API surface** — no Linear issue exists specifically for the commission API endpoints (SUR-102 covers the full flow including frontend). Consider whether backend-only commission endpoints should be a separate issue.

6. **Save and Follow models have zero API surface** — tables exist, indexes exist, but no endpoints. These are covered by SUR-98 (buyer accounts) but could be built independently as backend-only work.

7. **`platform.ts` admin route mounts at `/` instead of `/waitlist`** — the waitlist admin endpoints are `app.get('/waitlist', ...)` inside `platform.ts` which is mounted via `admin.route('/', createAdminPlatformRoutes(prisma))`. This works but is inconsistent with how other admin routes are mounted (e.g., `admin.route('/orders', ...)`) and could cause routing confusion if more platform-level endpoints are added.
