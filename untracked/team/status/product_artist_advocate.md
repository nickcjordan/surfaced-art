# Product / Artist Advocate Status Report — 2026-03-09

## Current State Summary

Surfaced Art is a curated digital gallery for handmade art positioned in the gap between unfiltered marketplaces (Etsy) and exclusive fine art platforms (Singulart, Saatchi Art). As of today, Phases 1-3 are complete: the platform has a deployed public gallery, artist application/onboarding flow, artist dashboard with profile and listing management, and Stripe Connect integration. Phase 4 (Transactions) — which enables real purchases — has not started. The platform functions as a recruiting tool for prospective founding artists but cannot process a single sale.

## Phase Completion Status

| Phase | Name | Plan | Status | What Remains |
|-------|------|------|--------|-------------|
| 1 | Foundation | Monorepo, CI/CD, AWS infra, Prisma schema | **Complete** | Nothing |
| 2 | Artist Profile (Read-Only) | Public gallery, artist profiles, listings, categories, homepage, waitlist | **~95% Complete** | SUR-6: Demo seed image URL verification (blocked on COO generating remaining AI images); SUR-154: Notion-to-S3 image pipeline parent tracking |
| 3 | Artist Onboarding | Auth, application, acceptance, dashboard, profile editor, listing management, Stripe Connect | **~95% Complete** | SUR-8: Admin review moderation API (Ready); SUR-9: Admin financial reporting API (Ready); SUR-201: Sensitive content flag (Backlog); SUR-161: Founding artist badge (Blocked on incentive program) |
| 4 | Transactions | Buyer accounts, checkout, Shippo shipping, Stripe payments, fulfillment, reviews, commissions | **Not Started** | ~25 issues in backlog. Core: checkout flow (SUR-99), buyer accounts (SUR-98), fulfillment (SUR-100), reviews (SUR-101), commissions (SUR-102), transactional emails (SUR-157), notification schema (SUR-182), disputes table (SUR-183) |

## Artist Journey Assessment

Walking through the full artist experience end-to-end:

### 1. Discovery: /for-artists
- **Exists and functional.** Dedicated landing page with value proposition, gallery positioning, commission details
- Links to /apply. Good CTA flow

### 2. Application: /apply
- **Exists and functional.** Full application form: name, email, Instagram, website, statement, exhibition history, category selection
- Validates against Zod schema on the backend
- Duplicate email detection built in
- Application creates a record in `artist_applications` table
- **Gap:** No process photo upload during application (Vision doc specifies process photos as part of application). Application is text-only
- **Gap:** Confirmation email sends via SES, but applicant has no way to check application status after submission

### 3. Review Process
- Admin API endpoints exist: `GET /admin/applications` (paginated, filterable), `POST /admin/applications/:id/approve`, `POST /admin/applications/:id/reject`
- Approval triggers: role assignment, slug generation, acceptance email (gallery-tone)
- Rejection sends a rejection email
- Audit logging on all admin actions
- **Gap:** No admin UI exists. Reviews must happen via API calls (Bruno collection or curl). The Vision doc says "reviewed in Airtable or Notion" but no integration exists
- **Gap:** No jury scoring rubric integrated into the platform (rubric exists in Notion: "Artist Jury Scoring Rubric v1.0")

### 4. Onboarding Post-Acceptance
- Sign-in page exists with email/password auth via Cognito
- Google and Apple OAuth are infrastructure-ready but credentials not yet configured (listed in Future Infrastructure Tasks in CLAUDE.md)
- **Gap:** No guided onboarding wizard or checklist email. Artist gets an acceptance email, then has to figure out the dashboard on their own
- **Gap:** No onboarding content/packaging guidance pages exist yet

### 5. Dashboard: /dashboard
- **Exists and functional.** Shows: welcome header, profile completion indicator with checklist, quick stats (total/available/sold listings, total views), Stripe Connect CTA, quick action links
- Profile completion tracks: display name, bio, location, profile photo, cover image, categories
- Stripe Connect integration works: generates onboarding link, redirects to Stripe-hosted flow, webhook confirms completion

### 6. Profile Editor: /dashboard/profile
- **Exists and functional.** Full profile form: bio, location, social links, profile photo upload, cover image upload
- CV entry management: add/edit/delete/reorder (exhibitions, awards, education, press, residencies)
- Process media grid: upload photos, drag to reorder, delete
- Pre-signed S3 URL generation for direct browser-to-S3 uploads
- Image processor Lambda generates WebP variants automatically

### 7. Listing Management: /dashboard/listings
- **Exists and functional.** List view with status indicators
- Create/edit forms with all required fields: title, description, medium, category, price, artwork dimensions, packed dimensions, packed weight, edition info
- Multi-image upload with drag-to-reorder
- Availability toggle (available/reserved_artist)
- Delete functionality
- **Gap:** No process photo flagging on listing images (Vision doc mentions "flag process photos" for Documented Work badge). The `is_documented` field exists in the schema but the mechanism to flag individual images as process photos during upload is unclear

### 8. Public Profile: /artist/[slug]
- **Exists and polished.** Gallery-quality layout: cover image, profile photo, name, location, categories, bio, social links, process section (photos + Mux video), CV/background, available work grid (masonry), collection archive (sold), breadcrumbs, JSON-LD structured data
- Studio view also exists at /studio/[slug] with a different layout (standalone, no header/footer)
- View tracking via PostHog
- **This is genuinely impressive.** An artist could share this link and feel proud of the presentation

### 9. Selling (NOT POSSIBLE)
- **Complete dead end.** No checkout, no payment capture, no order management
- Listing detail page shows a waitlist form instead of a "Buy" button
- No buyer accounts, no saved listings, no followed artists
- Artists can list work at prices but nothing can be purchased

### Artist Journey Friction Points Summary
1. No process photos in application (text-only)
2. No application status checking for applicants
3. No admin UI for application review (API-only)
4. No guided onboarding after acceptance
5. No Google/Apple OAuth (email-only auth)
6. No way to sell anything — the entire transaction layer is missing

## Buyer Journey Assessment

Walking through the full buyer experience:

### 1. Discovery
- Homepage exists with: split hero, featured artists grid, recent work masonry grid, category grid, waitlist form
- SEO: sitemap, robots.txt, JSON-LD (WebSite, Organization, Product, Person), OG tags, breadcrumbs on all pages
- **Working well.** Looks like a real gallery

### 2. Browse
- Category pages: `/category/[category]` — 4 categories (ceramics, drawing-and-painting, printmaking-and-photography, mixed-media-and-3d)
- Artist browse: `/artists` — grid of all approved artists
- Search: `/search` — PostgreSQL full-text search across listings and artists
- Category nav in header
- **Working well.** Multiple discovery paths exist

### 3. View Art
- Listing detail: `/listing/[id]` — image gallery, title, artist, price, medium, dimensions, edition info, tags, Documented Work badge, description, artist card
- Artist profile: rich, gallery-quality presentation
- **Working well.** The presentation quality is high

### 4. Purchase (DEAD END)
- **No checkout exists.** Listing detail page shows "This gallery opens to buyers soon. Leave your email to be the first to know." with a waitlist form
- No buyer accounts
- No cart/saved items
- No payment flow
- No shipping calculation
- **This is the single biggest gap in the product.** A buyer who falls in love with a piece has no way to buy it

### 5. Post-Purchase (DOES NOT EXIST)
- No order confirmation
- No tracking
- No delivery confirmation
- No reviews
- No payout to artists

### Buyer Journey Friction Points Summary
1. Cannot purchase anything — total dead end after viewing a listing
2. No buyer accounts (no saves, follows, order history)
3. No way to contact an artist about a piece (no messaging, no commission requests)
4. Waitlist form is the only call-to-action — converts interest to an email address but nothing more

## Feature Inventory

### Implemented (Functional)
- Public gallery (homepage, artist profiles, listing details, category browse, artist browse)
- Keyword search (PostgreSQL full-text)
- Waitlist signup
- Artist application form
- Admin application review API (approve/reject with emails)
- Admin artist management API (list, detail, suspend/unsuspend, impersonation)
- Admin listing management API (list, detail, feature/unfeature, hide/unhide)
- Admin user management API (list, detail, role management)
- Admin order/review/financial reporting APIs
- Admin audit log
- Admin bulk operations
- Artist auth (Cognito email/password, JWT validation, role-based middleware)
- Artist dashboard with profile completion tracking
- Artist profile editor (bio, photos, CV, process media)
- Artist listing management (CRUD, image upload, availability toggle)
- Stripe Connect onboarding for artists
- Image processing pipeline (Sharp Lambda, WebP variants, S3 + CloudFront CDN)
- SEO infrastructure (sitemap, robots, JSON-LD, OG tags, canonical URLs, breadcrumbs)
- PostHog analytics (view tracking for profiles and listings)
- Privacy policy and terms of service pages
- About page
- ISR caching with on-demand revalidation
- Cache-control headers on API responses
- Rate limiting and CORS hardening
- Input validation (Zod) on all endpoints
- Security headers (CSP, HSTS)
- CI/CD (GitHub Actions, Turborepo, auto-merge for feature->dev PRs)
- Security scanning (npm audit, Trivy, Semgrep in CI)
- S3 bucket versioning and lifecycle rules
- Visual QA test suite (Playwright)
- 4-category system with structured tags

### Partially Implemented
- Admin capabilities: API endpoints exist for everything, but **no admin UI** — all admin actions require API calls
- Auth: email/password works, Google OAuth and Apple Sign In are infrastructure-ready but **credentials not configured**
- Demo seed data: 24 AI demo artists seeded, but **some seed image URLs may not resolve** (SUR-6 blocked)
- Documented Work badge: badge renders on listings with `is_documented=true`, but the **mechanism to flag process photos during upload is unclear**
- Content guidelines: document written and deployed to `/for-artists`, but **DMCA takedown procedure not published** (SUR-185)

### Planned (Phase 4 — Not Started)
- Buyer accounts (saves, follows, order history) — SUR-98
- Checkout flow (Shippo rates, Stripe payments, reservation) — SUR-99
- Post-purchase fulfillment (tracking, delivery, payouts) — SUR-100
- Review system (3-dimensional ratings, artist responses) — SUR-101
- Commission flow (proposals, progress updates) — SUR-102
- Transactional email templates (order, shipping, delivery, payout, review) — SUR-157
- Buyer notifications (new listing alerts for followed artists) — SUR-159
- Artist incentive program (variable commission rates, founding tier) — SUR-160
- Notification preferences schema — SUR-182
- Disputes table — SUR-183
- Listing report mechanism — SUR-186
- Sensitive content flag (nudity warning) — SUR-201

### Missing (Not in Any Plan)
- **No "Add to Cart" or "Buy Now" button** — the primary conversion action for the entire platform
- **No artist-to-buyer communication** — no way for a buyer to ask an artist a question about a piece
- **No wishlists or favorites** for non-authenticated visitors (only planned for logged-in buyers)
- **No pricing transparency for buyers** — shipping cost not shown until checkout (which doesn't exist)
- **No "Similar Work" or "More Like This"** — cross-selling/discovery within the platform
- **No email marketing beyond waitlist** — no way to re-engage waitlist subscribers when new work is listed
- **No social sharing buttons** on listings or artist profiles (URLs are shareable but no share UI)

## Curation Model Readiness

### What Exists
- Artist application form collects: name, email, Instagram, website, statement, exhibition history, categories
- Admin API can approve/reject applications with formal emails
- Artist Jury Scoring Rubric v1.0 exists in Notion (separate from platform)
- Content guidelines document created
- Artist suspension workflow (admin can suspend artist, hiding profile and listings)
- Audit logging on all admin actions

### What's Missing
- **No admin UI** — application review requires API calls, not a usable interface
- **No integration between Notion/Airtable scoring rubric and the platform** — the scoring happens entirely outside the system
- **No portfolio/work sample viewing during review** — applications are text + links, no uploaded artwork
- **No process photo requirement in application** — the Vision doc specifies this but the form doesn't collect them
- **No automated quality flags** — re-vetting is explicitly deferred
- **No community-based flagging** — buyers can't report suspicious content (planned: SUR-186)

### Assessment
The curation model works for the founding cohort (hand-selected through personal network) but will not scale. The COO can review 8-15 founding artists manually via API calls, but accepting artists at any volume requires an admin UI (SUR-403 parent issue with 5 child tasks, all labeled "ready" in Linear).

## Admin Capabilities

### What Admins Can Do Today (via API only)
- List/filter/search artist applications
- Approve or reject applications (with emails)
- List/view/search artists, users, listings, orders
- Suspend/unsuspend artists (hides profile and all listings)
- Feature/unfeature and hide/unhide individual listings
- Manage user roles (assign/revoke artist/admin roles)
- View audit log of all admin actions
- Impersonate artists (debug their experience)
- Bulk operations on listings
- View financial summary (platform revenue, artist payouts)
- View review moderation data

### What Admins Cannot Do
- **No web UI** — everything is API calls via Bruno/curl
- No visual dashboard for key metrics
- No application review workflow with scoring
- No dispute management interface
- No content moderation queue
- No artist communication tools
- No financial reporting dashboard
- No waitlist management UI (beyond the existing API)

### Admin UI Status
Parent issue SUR-403 exists with 5 child tasks (auth infrastructure, layout, application management, artist management, listing/waitlist management) — all labeled "ready" but none started. This is identified as the natural bridge between Phase 3 and Phase 4.

## Competitive Gap Analysis

Based on the Competitive Positioning document in Notion and current feature state:

| Feature | Surfaced Art | Etsy | Saatchi Art | Singulart | UGallery |
|---------|-------------|------|-------------|-----------|----------|
| Artist vetting/curation | Yes (manual) | No | Minimal | Yes (professional only) | Yes |
| Gallery-quality profiles | Yes | No | Basic | Yes | Yes |
| Process documentation | Yes (unique) | No | No | No | No |
| Craft categories | Yes (unique) | Yes | No | No | No |
| Commission rate | 30% | ~10-13% | 40% | 50% | 50% |
| Subscription fees | None | None | None | 30-150/mo | $5/mo |
| **Can process purchases** | **No** | Yes | Yes | Yes | Yes |
| **Buyer accounts** | **No** | Yes | Yes | Yes | Yes |
| **Shipping integration** | **No** | Yes | Yes | Yes (managed) | Yes (managed) |
| **Reviews** | **No** | Yes | Limited | Yes | Yes |
| International shipping | No | Yes | Yes | Yes | Yes |
| Mobile app | No | Yes | No | No | No |
| In-platform messaging | No | Yes | Yes | Yes | No |

**Critical insight:** Surfaced Art has strong differentiation on curation, artist economics, process documentation, and craft category coverage. But it cannot process a single transaction. Every competitor can. The platform is a gallery that can't sell art.

## "Would an Artist Be Impressed?" Assessment

**Honest answer: Yes, with a significant caveat.**

**What would impress them:**
- The artist profile page is genuinely gallery-quality. Cover image, bio, process section, CV, available work grid, archive of sold work — this is better than what most artists can build themselves
- The Studio view (`/studio/[slug]`) gives artists a standalone portfolio page without platform chrome — shareable and clean
- The economics pitch (70% take, no fees, no exclusivity) is immediately compelling compared to every curated competitor
- The anti-AI, anti-dropship positioning resonates deeply with artists frustrated by Etsy
- The application process feels like applying to a gallery, not signing up for a marketplace
- The dashboard with profile completion tracking is well-designed and intuitive

**What would concern them:**
- "Where's the buy button?" — an artist sharing their profile link with potential buyers would discover those buyers can't actually purchase anything
- No reviews or social proof — the platform looks new and untested (because it is)
- No other real artists visible — the demo seed artists are AI-generated placeholders
- Google/Apple sign-in not working (email-only auth) feels incomplete
- The waitlist form as the only CTA on listings feels like the platform isn't ready

**Bottom line:** A founding artist approached through the advisor's network, shown a demo profile, and told "we're building something new — help us shape it" would likely say yes. But an artist who discovers the platform independently would see a gallery that can't sell their work, populated by AI-generated demo artists, and might not take it seriously. The recruiting tool thesis (Phase 2 exit criteria) is valid for warm outreach, not for cold discovery.

## Deferred Items Review

From `docs/deferred-work-items.md`:

### Should Be Un-Deferred Soon
- **Internal admin dashboard UI** — originally deferred to "use Airtable/Notion," but the admin API is fully built and the team needs a usable interface. SUR-403 and children are already created and ready. This should be the next engineering priority
- **In-platform messaging** — even basic "ask the artist a question" capability would improve buyer experience before full Phase 4

### Correctly Deferred
- RDS Proxy, OpenNext migration, dedicated search service, ElastiCache — all correctly deferred until metrics justify
- International shipping — correct for v1
- Native mobile app — correct deferral
- Automated moderation, artist re-vetting — low volume doesn't justify yet
- Venue support (Phases 5-8) — correct, needs hundreds of active artists first

### Ambiguous
- **Artist analytics dashboard** — artists would love to see their profile views and listing views. PostHog already tracks this data. A simple read-only dashboard page could be high-value, low-effort
- **Faceted search and filters** — keyword search exists, but browsing by price range or medium would significantly improve buyer experience

## Key Findings

### What's Working Well
- **Gallery-quality presentation.** The artist profile page, listing detail page, and overall design system are polished and professional. This genuinely looks like a curated gallery, not a marketplace
- **Solid technical foundation.** Infrastructure (AWS, Vercel, CI/CD), security (rate limiting, CSP, Zod validation, security scanning), and testing (Vitest, Playwright) are all production-quality
- **Complete artist self-service.** Application, profile editing, listing management, process media, CV management, Stripe Connect — the artist-facing tools are comprehensive
- **Comprehensive admin API.** Applications, artists, listings, users, orders, reviews, audit log, impersonation, bulk operations, financial reporting — all built and tested
- **Strong competitive positioning.** The category gap (craft disciplines excluded from every online gallery), artist economics (30%, no fees), and process documentation are genuine differentiators
- **SEO-first approach.** Every page has metadata, structured data, canonical URLs, breadcrumbs, and sitemap entries

### What's Not Working
- **No revenue capability.** The platform cannot process a single sale. Phase 4 is entirely unstarted
- **No admin UI.** Every admin action requires API calls — this is not sustainable even for the founding cohort
- **Demo artists, not real artists.** The gallery is populated by 24 AI-generated demo profiles, not real artists
- **Auth is incomplete.** Google and Apple OAuth credentials are not configured
- **No buyer engagement path.** Beyond the waitlist form, buyers have nothing to do

## Gaps & Concerns

### Critical Gaps
1. **Transaction layer (Phase 4) is the make-or-break feature.** Without checkout, shipping, and payments, the platform is a portfolio showcase, not a business. This is estimated at 8-12 weeks of engineering time
2. **No admin UI creates an operational bottleneck.** The COO cannot review applications, manage artists, or monitor the platform without developer assistance for every action
3. **No real artists on the platform.** The founding artist recruitment is a COO/advisor responsibility, not engineering, but the platform's credibility depends on it. The "seed image verification" issue (SUR-6) being blocked means even the demo gallery may have broken images
4. **Returns/refund policy undefined.** Competitive Positioning doc identifies this as a gap. Must be defined before Phase 4 (SUR-174 exists but is blocked)

### Moderate Concerns
5. **Artist application lacks portfolio upload.** Vision doc specifies process photos as part of the application, but the form only collects text and links
6. **No guided onboarding.** Accepted artists get an email, then must figure out the dashboard independently
7. **Content guidelines and DMCA procedure not yet published** (SUR-185 in backlog)
8. **Artist agreement/terms not created** (SUR-173 blocked on legal review)
9. **Goimagine's shutdown** (March 2026) is a cautionary tale: values attract sellers but buyers need a reason to show up. Surfaced Art's lean infrastructure mitigates the cost risk, but buyer acquisition strategy is still unproven

### Low-Priority Concerns
10. No social sharing UI on listings/profiles
11. No "similar work" or cross-selling features
12. No email re-engagement for waitlist subscribers
13. No dark mode (architecturally planned but not implemented)

## Unplanned Work Discovered

Items not captured in any existing Linear issue, docs, or plans:

1. **Waitlist-to-buyer conversion path.** There are waitlist subscribers (the form works, data is collected) but no plan for converting them into buyers when Phase 4 launches. No email templates, no announcement flow, no "the gallery is now open" communication plan

2. **Artist referral tracking.** The Artist Incentive Strategy specifies a 5% referral commission, but there is no referral tracking mechanism in the schema or any issue tracking its implementation

3. **Price range display for buyers.** Buyers browsing categories or artist profiles cannot filter or sort by price. Even displaying a price range on category pages ("$50 - $2,500") would help set expectations

4. **Mobile responsiveness audit.** While Tailwind responsive classes are used throughout, there is no documented mobile QA pass. The Visual QA spec mentions responsive screenshots but no formal mobile-first review has been done

5. **Artist onboarding content.** The Vision doc mentions "packaging guidance" and "onboarding documentation" as COO content responsibilities. No content pages exist for artist help/FAQ, packaging tips, or shipping best practices. These are non-code tasks but affect the artist experience directly

6. **Listing image quality guidelines.** The Vision doc specifies "square format preferred, plain background, multiple angles" but no enforcement or guidance UI exists in the listing creation flow. Artists uploading poor-quality photos would degrade the gallery experience

7. **"Coming Soon" state for the buy button.** Currently the listing page shows a waitlist form, which signals "not ready." A more intentional "Coming Soon — Get Notified" state with artist-specific notifications would be more compelling than a generic waitlist

8. **Cross-environment artist data.** Real artists (abbey-peters, david-morrison, karina-yanes) have images in the prod S3 bucket only, not dev. The dev environment uses AI demo artists exclusively. There is no documented plan for when real founding artists are onboarded — do they go into prod directly? Is there a staging environment? (docs note: "currently prod-only to minimize costs")
