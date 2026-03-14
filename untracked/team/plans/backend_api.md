# Backend/API Stage Plan — 2026-03-09

## Alpha

### Must Complete

**Goal: All public read endpoints work against real seed data. Internal testers can browse the site end-to-end without hitting errors.**

Nothing new to build. The existing API surface fully supports Alpha:

- All public GET endpoints are implemented and tested: `/artists`, `/artists/:slug`, `/listings`, `/listings/:id`, `/categories`, `/tags`, `/search`
- Waitlist `POST /waitlist` is working
- Artist application flow `POST /artists/apply` and `GET /artists/apply/check-email` are working
- Image pipeline (S3 upload -> Lambda processing -> CloudFront delivery) is operational
- Seed data is loaded for 24 demo artists (dev) and 3 real artists (prod)
- Cache-Control headers are set on all public endpoints
- Health checks (`/health`, `/health/db`) confirm Lambda + RDS connectivity

**Remaining work (minor):**

1. **Wire WaitlistWelcome email to `POST /waitlist`** -- the template exists but is dead code. Either wire it or delete it. This is a 30-minute fix but it's a loose end that will confuse testers.
2. **Add `X-Request-Id` middleware** -- generate a UUID per request, include in all structured log entries and response headers. Critical for debugging any issues testers report. No Linear issue exists; needs one created.
3. **Verify SES domain/sender in production** -- confirm that `SES_FROM_ADDRESS` is verified and out of SES sandbox for the production account. This is an AWS console check, not code.

### Exit Criteria

- All public read endpoints return correct data with 200 status for valid requests and proper 4xx for invalid
- `/health/db` returns 200 confirming RDS connectivity from Lambda
- WaitlistWelcome email is either wired or removed (no dead code)
- Structured logs include request IDs for traceability
- SES can send emails from production (not sandboxed)
- No 500 errors in CloudWatch for any public endpoint over a 24-hour test window

### Dependencies

- **Infrastructure team**: Confirm dev environment CloudFront + API Gateway URLs are stable and accessible
- **Frontend team**: Confirm which API base URL the frontend is hitting (dev vs prod)
- **COO/Ops**: Verify SES production access (domain verification, sandbox exit)

### Risks

- **SES sandbox** -- if still in sandbox mode, application confirmation and waitlist emails won't reach external testers. Low risk since this is an AWS support request (24-48hr turnaround).
- **Cold start latency** -- Lambda cold starts may surprise testers with 2-3 second initial loads. Not a blocker but worth setting expectations.

---

## Beta (Closed)

### Must Complete

**Goal: 10-25 real artists can sign up, get approved, build their profiles, manage listings, and complete Stripe onboarding. The API must be reliable enough that artists trust it with their professional presence.**

The authenticated artist flow is fully built (Phase 3 is complete). Beta-specific backend work:

1. **`GET /auth/me` endpoint (SUR-195)** -- returns current user's profile, roles, Stripe status. Required for admin UI and buyer account flows. This is the single most important missing backend piece for Beta because the admin UI (SUR-194) needs it to gate routes.

2. **Admin UI API support validation** -- the admin API is comprehensive (30+ endpoints), but several endpoints need end-to-end testing with real Cognito JWTs. Specifically:
   - `POST /admin/artists/:userId/approve` -- full flow with email sending
   - `POST /admin/artists/:userId/reject` -- full flow with email sending
   - `GET /admin/applications` with real application data
   - `GET /admin/artists` -- confirm all filter params work

3. **Stripe webhook idempotency** -- the current `POST /webhooks/stripe` handler for `account.updated` has no idempotency check. If Stripe retries (which it will), the handler re-processes. Add an idempotency layer using the event ID. No Linear issue exists.

4. **Artist terms acceptance tracking** -- SUR-173 covers the frontend page, but the API needs a field or table to record that an artist accepted the terms and when. Consider adding `termsAcceptedAt` to `ArtistProfile` schema. No backend-specific Linear issue exists for this.

5. **Rate limiter hardening** -- the current in-memory rate limiter resets on Lambda cold starts. For Beta this is acceptable (low traffic), but document the limitation. Consider whether DynamoDB-backed rate limiting is needed before MVP.

### Exit Criteria

- `/auth/me` endpoint deployed and returning correct roles for authenticated users
- Admin can approve/reject artist applications end-to-end (API -> email -> role assignment -> profile creation)
- All 58 authenticated `/me/*` artist endpoints work with real Cognito JWTs (not just test mocks)
- Stripe Connect onboarding completes successfully for at least one test artist
- Stripe webhook handles `account.updated` idempotently (duplicate events don't cause errors)
- Application emails (confirmation + admin notification + acceptance/rejection) deliver reliably via SES
- No unhandled 500 errors on any artist dashboard API call over a 7-day test window

### Dependencies

- **Frontend team**: Admin UI (SUR-194, SUR-196, SUR-197) needs `/auth/me` before it can be built
- **COO/Ops**: Artist terms content (SUR-173) -- backend needs to know what to track
- **COO/Ops**: Finalize artist onboarding email copy for acceptance/rejection emails
- **Infrastructure team**: Confirm Cognito user pool is configured for production sign-ups (Google OAuth credentials are a placeholder per CLAUDE.md)

### Risks

- **Cognito OAuth not configured** -- Google OAuth credentials are placeholders. If Beta artists need social login, this blocks. Email/password auth works as fallback.
- **SES sending limits** -- SES has per-second and daily sending limits. With 10-25 artists this is fine, but confirm the limits.
- **Stripe Connect test mode vs live mode** -- Beta artists doing Stripe onboarding in test mode won't have real bank accounts connected. Clarify with COO whether Beta uses Stripe test mode or live mode. This affects whether artists see real money flows.

---

## MVP

### Must Complete

**Goal: A buyer can browse, select a listing, see shipping rates, pay, and receive the artwork. An artist can fulfill the order and receive their payout. The full revenue loop works.**

This is the biggest backend milestone. Everything here is unbuilt (Phase 4).

1. **Checkout flow backend (SUR-99)** -- the core revenue path:
   - `POST /shipping/rates` -- Shippo integration: accept buyer zip + listing packed dimensions/weight + artist origin_zip, return rate options. New Shippo SDK integration needed.
   - `POST /checkout/session` -- create Stripe PaymentIntent with Stripe Tax calculation, atomically set listing to `reserved_system` with 15-minute `reservedUntil` TTL, return client secret
   - `POST /webhooks/stripe` -- expand to handle `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`. On success: create `Order` record, set listing to `sold`, send confirmation emails. On failure: release reservation.
   - Atomic listing reservation: `UPDATE listings SET status = 'reserved_system', reserved_until = NOW() + interval '15 min' WHERE id = $1 AND status = 'available'` with row-level locking

2. **Post-purchase fulfillment (SUR-100)**:
   - `PUT /me/orders/:id/tracking` -- artist adds tracking number + carrier, sets `shippedAt`, records `daysToFulfill`
   - `POST /me/orders/:id/confirm-delivery` -- buyer confirms delivery, sets `deliveredAt`
   - Payout release logic: after delivery confirmation, call Stripe Transfer API to move `artistPayout` to artist's Connected Account. Set `payoutReleasedAt`.
   - `GET /me/orders` -- buyer order history (list with status, tracking info)
   - `GET /me/orders/:id` -- buyer order detail

3. **Transactional email templates (SUR-157)**:
   - Order confirmation (to buyer) -- artwork details, shipping address, estimated delivery
   - New order notification (to artist) -- buyer info, shipping deadline
   - Shipping notification (to buyer) -- tracking number + carrier link
   - Delivery confirmation (to buyer) -- prompt to confirm + leave review
   - Payout release notification (to artist) -- amount, Stripe dashboard link

4. **Buyer accounts - saves/follows (SUR-98, partial)**:
   - `POST /me/saves/:listingId`, `DELETE /me/saves/:listingId`, `GET /me/saves` -- bookmark listings
   - `POST /me/follows/:artistId`, `DELETE /me/follows/:artistId`, `GET /me/follows` -- follow artists
   - These are simple CRUD on existing tables (`Save`, `Follow`) with existing indexes

5. **Disputes table schema (SUR-183)**:
   - Add `Dispute` model to schema: `orderId`, `buyerId`, `artistId`, `reason`, `status` (open/under_review/resolved_buyer/resolved_artist/closed), `resolution`, `createdAt`, `resolvedAt`
   - Migration to add the table
   - No API endpoints yet (admin handles disputes manually via existing order status updates)

6. **Data retention / soft-delete ADR (SUR-167)**:
   - Decide: soft-delete columns on User, ArtistProfile, Listing vs. a separate `deletions` audit table
   - Required before real user data exists -- once you have data, the migration cost doubles

7. **Artist incentive program schema (SUR-160)**:
   - Add `commissionRate` (decimal), `tier` (enum: founding/early/standard), `tierExpiresAt` to `ArtistProfile`
   - Commission calculation in checkout must use per-artist rate instead of hardcoded 30%
   - Migration + seed data for founding artist rates

8. **Refund/dispute policies - backend (SUR-174, backend portion)**:
   - `DELETE /me/account` -- data deletion endpoint (cascade delete user data, anonymize order records)
   - Integrate with Stripe: cancel any pending payouts, prevent future charges

### Exit Criteria

- End-to-end purchase: browse listing -> get shipping rates -> pay -> order created -> artist ships -> buyer confirms -> artist gets paid. All steps work.
- Stripe PaymentIntent created with correct amounts (artwork price + shipping + tax - commission split)
- Stripe Transfer sends correct payout to artist's Connected Account after delivery
- Listing reservation prevents double-purchase (concurrent checkout test passes)
- Expired reservations automatically release (listing returns to `available` on read)
- All 5 transactional email templates render correctly and deliver via SES
- Buyer can view order history and individual order detail
- Saves and follows work (create, delete, list)
- Disputes table exists in schema with proper indexes
- Data retention ADR is written and approved
- Variable commission rates work for founding artists (20% instead of 30%)
- Account deletion endpoint works and anonymizes order history

### Dependencies

- **COO/Ops**: Shippo account setup + API key. This is a hard blocker -- no Shippo account means no shipping rates.
- **COO/Ops**: Stripe live mode configuration. Need to decide: does MVP use Stripe test mode or live mode?
- **COO/Ops**: Stripe Tax configuration -- which tax jurisdictions are enabled?
- **COO/Ops**: Refund policy decisions -- what's the refund window? Full refund only, or partial? Under what conditions?
- **COO/Ops**: Artist incentive program decisions -- confirm founding tier commission rate (20%), duration (2 years), number of founding slots (8-15)
- **Frontend team**: Checkout UI needs API contract defined (request/response shapes for shipping rates and payment session)
- **Infrastructure team**: May need increased RDS instance size if load testing (SUR-177) reveals connection issues

### Risks

- **Shippo integration complexity** -- Shippo API has changed significantly. Rate calculation for art (oversized, fragile) may need special handling. Budget extra time for edge cases.
- **Stripe Tax setup** -- Stripe Tax requires merchant of record configuration. If the platform is the merchant of record (which it is for commission-based sales), this has legal implications. COO must confirm tax collection strategy.
- **Payout timing** -- the current schema tracks `payoutReleasedAt` but doesn't enforce a hold period. Should there be a 3-7 day hold after delivery confirmation before releasing payout? This is a business decision that affects the API logic.
- **Concurrent checkout race conditions** -- listing reservation must be atomic. PostgreSQL row-level locks handle this, but the implementation must be correct. Test with concurrent requests.
- **Lambda concurrency under payment load** -- Stripe webhooks can spike during high-activity periods. Lambda concurrency + RDS connections could be a bottleneck. SUR-177 (load testing) should validate this.

---

## MMP (Minimum Marketable Product)

### Must Complete

**Goal: Polished enough to actively recruit artists beyond the founding cohort. API is reliable, performant, and handles edge cases gracefully.**

1. **Review system (SUR-101)**:
   - `POST /reviews` -- buyer submits review (3 ratings + headline + content + shipping flags). Requires `delivered` order status. One review per order.
   - `GET /listings/:id/reviews` -- public reviews for a listing
   - `GET /artists/:slug/reviews` -- public reviews for an artist (aggregated)
   - `PUT /me/reviews/:id/response` -- artist responds to a review
   - Server-side `overallRating` computation (weighted average of product/communication/packaging)
   - Review display in public listing and artist endpoints (aggregate rating + count)
   - Review structured data in API responses (SUR-117)
   - Admin review moderation (SUR-8, SUR-147) -- soft-delete with `deletedAt`/`deletedBy`

2. **Buyer notifications for followed artists (SUR-159)**:
   - When an artist creates a new listing, email followers
   - Rate-limit notification sends (batch, not per-follower-per-listing)
   - Unsubscribe mechanism (either unfollow or email preference)

3. **API versioning** -- add `/v1/` prefix to all routes:
   - Mount all existing routes under `/v1/`
   - Keep root `/health` and `/` as-is (unversioned)
   - Update all frontend API calls to use `/v1/`
   - No Linear issue exists; needs one created

4. **Request tracing middleware** -- if not done in Alpha:
   - `X-Request-Id` header generation
   - Correlation ID propagation to all log entries
   - Include in error responses for support tickets

5. **Secrets Manager migration (SUR-163)**:
   - Move `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `COGNITO_USER_POOL_ID`, `SES_FROM_ADDRESS` from Lambda env vars to AWS Secrets Manager
   - Add secret rotation support for database credentials
   - Update Terraform to provision secrets and grant Lambda read access

6. **Load testing (SUR-177)**:
   - k6 scripts for: browse flow (homepage -> category -> listing), checkout flow (shipping rates -> payment -> order), search
   - Baseline metrics: P50/P95 latency, error rate under 50/100/200 concurrent users
   - Identify breaking points (RDS connections, Lambda concurrency)

7. **Incident severity levels (SUR-180)**:
   - P1/P2/P3 definitions with response expectations
   - Post-incident review template
   - Not code, but the API team needs to define what constitutes a P1 for the API (payment failures, data loss, auth bypass)

8. **Admin financial reporting (SUR-9)**:
   - `GET /admin/reports/revenue` -- total revenue, commission earned, artist payouts, by time period
   - `GET /admin/reports/artists/:id/financials` -- per-artist financial summary
   - These endpoints exist in the Linear backlog as ready but depend on orders existing

### Exit Criteria

- Review system works end-to-end: buyer reviews -> public display -> artist response -> admin moderation
- Artist aggregate ratings appear on profile and listing pages (via API)
- Followed artist notifications deliver when new listings are posted
- All API routes are under `/v1/` prefix
- All requests have `X-Request-Id` in logs and response headers
- Secrets rotated out of Lambda env vars into Secrets Manager
- Load test results documented: system handles 100 concurrent users without degradation
- Financial reporting endpoints return correct data for completed orders
- Incident response playbook exists with severity definitions

### Dependencies

- **COO/Ops**: Review moderation policy -- what triggers removal? Profanity? Defamation? Both?
- **COO/Ops**: Notification frequency policy -- how often can a buyer be emailed? Daily digest vs per-listing?
- **Infrastructure team**: Secrets Manager provisioning in Terraform
- **Infrastructure team**: May need RDS instance upgrade based on load testing results
- **Frontend team**: API versioning change requires frontend URL updates (coordinated deployment)

### Risks

- **API versioning migration** -- adding `/v1/` prefix to 60+ endpoints requires a coordinated frontend/backend deploy. If done wrong, the site goes down. Recommend a blue-green deployment or a temporary redirect from old paths to `/v1/` paths.
- **Review spam** -- without CAPTCHA or rate limiting on review submissions, bad actors could spam reviews. The rate limiter covers this but validate the limits are appropriate.
- **Load testing reveals RDS bottleneck** -- db.t3.micro has limited connections. If load testing shows this, upgrading RDS is straightforward but has cost implications.
- **Secrets Manager cold start impact** -- fetching secrets from Secrets Manager on every Lambda cold start adds ~100-200ms latency. Consider caching secrets in-memory with a TTL.

---

## GA (General Availability)

### Must Complete

**Goal: The API handles real traffic at scale, payments flow reliably, and operational processes exist for all edge cases.**

1. **Commission flow (SUR-102)**:
   - `POST /commissions` -- buyer proposes commission to artist
   - `PUT /me/commissions/:id/accept` -- artist accepts
   - `POST /me/commissions/:id/updates` -- artist posts progress update with optional image
   - `PUT /me/commissions/:id/complete` -- artist marks complete, triggers payment
   - Commission-specific email templates (proposal received, accepted, update posted, completed)
   - Commission listing type integration with checkout flow

2. **Feature flags strategy (SUR-184)**:
   - ADR on approach: env vars vs DB table vs PostHog feature flags
   - Implementation for gradual rollout of new features
   - Kill switches for misbehaving features (e.g., disable checkout if Stripe is down)

3. **AWS WAF on API Gateway** (referenced in SUR-64):
   - Managed rules for common attacks (SQL injection, XSS)
   - Rate limiting at the WAF level (supplement application-level rate limiter)
   - Geographic restrictions if needed

4. **Distributed rate limiting**:
   - Replace in-memory rate limiter with DynamoDB-backed (or ElastiCache Redis) rate limiting
   - Consistent across Lambda instances
   - Required once traffic exceeds what a single Lambda handles

5. **Webhook reliability hardening**:
   - Idempotency keys for all Stripe webhook event types
   - Dead letter queue for failed webhook processing
   - Retry logic with exponential backoff
   - Monitoring/alerting on webhook failures

6. **OpenAPI documentation**:
   - Auto-generate OpenAPI spec from Hono routes + Zod schemas
   - Serve at `/v1/docs` (or external hosting)
   - Required for third-party integrations and onboarding future developers

7. **Database performance**:
   - Query profiling for all checkout-related queries
   - Index optimization based on real query patterns
   - Connection pooling review (RDS Proxy if needed)
   - Read replica consideration for public browse endpoints

### Exit Criteria

- Commission flow works end-to-end: proposal -> acceptance -> updates -> completion -> payment
- Feature flags can enable/disable any feature without a deploy
- WAF blocks common attack patterns (verified with test payloads)
- Rate limiter works correctly across multiple Lambda instances
- Webhook processing is idempotent and reliable (no duplicate orders, no lost events)
- OpenAPI spec is accurate and serves as the API contract
- Database handles production query patterns without slow queries (P95 < 200ms)
- All operational runbooks exist for common support scenarios (refund, dispute, account issues)

### Dependencies

- **COO/Ops**: Commission policies -- deposit structure, timeline enforcement, cancellation terms
- **COO/Ops**: Support processes -- who handles disputes? What's the SLA?
- **Infrastructure team**: WAF provisioning, RDS Proxy if needed, DynamoDB table for rate limiting
- **Frontend team**: Commission UI, feature flag integration in frontend components

### Risks

- **Commission flow complexity** -- commissions involve multi-step state machines, partial payments, and timeline enforcement. This is the most complex feature in the entire platform. Budget accordingly.
- **WAF false positives** -- managed rules can block legitimate requests (especially art descriptions with special characters). Need a tuning period.
- **Rate limiter migration** -- switching from in-memory to distributed rate limiting during live traffic requires careful rollout. Run both in parallel initially.

---

## Technical Debt Roadmap

### Alpha
- Remove or wire `WaitlistWelcome` dead code template
- Add request ID middleware (prevents debugging headaches in all future stages)

### Beta
- Add Stripe webhook idempotency (event ID deduplication)
- Document in-memory rate limiter limitation for future reference
- Clean up `platform.ts` admin route mounting inconsistency (waitlist routes mounted at `/` instead of `/waitlist`)

### MVP
- Refactor `me.ts` route file (1500+ lines) into sub-module directory structure (same pattern as admin routes)
- Add API versioning (`/v1/` prefix) -- technically a feature but also debt prevention. The longer this waits, the more painful it becomes.
- Add database query logging/profiling in non-production environments

### MMP
- Migrate secrets to Secrets Manager (SUR-163) -- should have been done earlier but manageable at this stage
- Replace in-memory rate limiter with distributed solution (preparing for GA traffic)
- Add database migration safety checks (prevent destructive migrations in production)

### GA
- Full OpenAPI documentation generation
- Comprehensive API integration test suite (not just unit tests with mocked Prisma)
- Automated dependency update pipeline (Dependabot + automated test + auto-merge for patch versions)

---

## New Work Discovered

1. **`X-Request-Id` middleware** -- no Linear issue exists. Every stage benefits from this. Should be created as a small standalone issue and done in Alpha.

2. **Stripe webhook idempotency** -- no Linear issue. The current webhook handler will process duplicate events. Needs an issue created, target Beta.

3. **Artist terms acceptance tracking** -- SUR-173 covers the frontend page but there's no backend-specific tracking. Need a `termsAcceptedAt` field on `ArtistProfile` and an API endpoint to record acceptance. Should be a sub-task of SUR-173 or a standalone issue.

4. **`me.ts` refactor** -- this file is 1500+ lines (same problem the admin routes had pre-refactor). No Linear issue exists. Should be done before MVP adds more `/me/*` endpoints (order history, reviews, commissions).

5. **Shippo integration spike** -- before SUR-99 is estimated, someone should do a 2-4 hour spike on the Shippo API to understand rate calculation for oversized art packages. The API may have changed since the original spec was written.

6. **Payout hold period decision** -- the current schema has `payoutReleasedAt` but no hold period logic. The business needs to decide: release immediately on delivery confirmation, or hold for N days? This affects the checkout/fulfillment API logic and must be decided before SUR-100 is implemented.

7. **Tax collection strategy** -- Stripe Tax requires decisions about merchant of record, nexus, and tax jurisdictions. This is a COO/legal decision that directly affects the checkout API implementation. Must be resolved before SUR-99.

---

## Priority Conflicts

1. **SUR-7 and SUR-9 are marked "Ready" in Phase 3 project but depend on orders existing.** The admin order management (SUR-7) and financial reporting (SUR-9) endpoints are already implemented (SUR-146, done). These appear to be duplicate issues created by automation. Recommend closing SUR-7 as duplicate of SUR-146 (done), and staging SUR-9 for MMP when real order data will exist.

2. **SUR-8 (admin review moderation) is marked "Ready" but reviews don't exist yet.** This endpoint can't be meaningfully tested until the review system (SUR-101) is built. Recommend staging SUR-8 for MMP alongside SUR-101, not as a standalone "Ready" item.

3. **SUR-10 (admin impersonation with session banner) is "Ready" but SUR-151 (read-only impersonation) is already done.** SUR-10 describes a more complex JWT-based impersonation system. The existing read-only impersonation endpoints (SUR-151) are sufficient through MMP. SUR-10 should be GA or post-GA unless there's a specific Beta/MVP need for full session impersonation.

4. **SUR-163 (Secrets Manager migration) is labeled "blocked" but has no actual blocker.** It's marked as blocked in the Linear backlog but the status report shows it's just deferred. Recommend unblocking and staging for MMP -- it should be done before real payment secrets are in production.

5. **SUR-102 (commissions) is in the Phase 4 backlog but should be GA, not MVP.** The checkout flow (SUR-99) and fulfillment (SUR-100) are the critical path for MVP. Commissions add significant complexity and should ship after the standard purchase loop is proven. The current backlog groups them together in Phase 4 which implies equal priority -- they are not equal.

6. **SUR-177 (load testing) is labeled "blocked" and in Phase 4 but should be MMP.** Load testing should happen after the checkout flow exists (MVP) but before actively marketing the platform (MMP). It's currently blocked on the checkout flow not existing, which is correct, but it should be explicitly scheduled between MVP and MMP milestones.
