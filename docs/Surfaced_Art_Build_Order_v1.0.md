# Surfaced Art — Build Order
*Version 1.0 · CTO Reference Document · February 2026 · Confidential*

*Surfaced Art*

## 1. Context & Strategy

This document defines the phased build order for Surfaced Art. It is written for a solo CTO building nights and weekends around a full-time job, targeting approximately 10-15 focused engineering hours per week.
The build order is shaped by a critical insight: the first milestone is not a transaction-ready platform — it is a recruiting tool. The platform needs to show prospective founding artists something credible enough to say yes before a single line of checkout code is written.

### First Milestone Framing

When a prospective artist receives a link from the founding advisor, they click it and land somewhere. They need to see a platform that looks and feels like a real gallery. They need to see polished profiles of real artists. They need to understand what their own profile would look like. They need to believe the platform is legitimate and worth their time.
They do not need to be able to check out, sign up, or submit an application at this stage. The first milestone is a gallery experience — not a marketplace. This shapes everything about what gets built first.

## 2. Phase Summary

| Phase | Name | Deliverable | Est. Time | Cumulative |
| --- | --- | --- | --- | --- |
| 1 | Foundation | Running monorepo, CI/CD, AWS infrastructure, blank deployed app | 3-4 wks | ~1 mo |
| 2 | Artist Profile | Public gallery profiles — the artist recruiting tool | 4-6 wks | ~3 mo |
| 3 | Artist Onboarding | Artists self-serve their own profiles and listings | 6-8 wks | ~5 mo |
| 4 | Transactions | Real buyers purchasing real art end-to-end | 8-12 wks | ~9 mo |

> *Time estimates assume 10-15 focused engineering hours per week. Phases 1 and 2 together put a recruiting-ready platform in artists' hands in approximately 2-3 months from a standing start.*

## 3. Phase 1 — Foundation

| PHASE 1 Foundation *Goal: A running monorepo with full CI/CD and AWS infrastructure in place. Nothing visible to users yet — but everything wired correctly so subsequent phases move fast.* Estimated time (nights & weekends): 3-4 weeks |
| --- |

This phase is the least glamorous and the most important. Every hour invested here pays dividends in every subsequent phase. Do not skip steps or take shortcuts.

**Monorepo & Repo Setup**
- Create GitHub repository
- Initialize Turborepo with workspace structure: apps/web, apps/api, packages/types, packages/db, packages/utils
- Configure root package.json with workspaces and turbo.json with build pipeline
- Add .gitignore, .nvmrc, root tsconfig.json

**Frontend — apps/web**
- Initialize Next.js with App Router and TypeScript
- Install and configure Tailwind CSS and ShadCN component library
- Connect Vercel to GitHub repo with root directory set to apps/web
- Confirm preview deployments on PRs and production deployments on merge to main

**Backend — apps/api**
- Initialize Node.js + TypeScript with Hono framework
- Configure esbuild or tsup for Lambda-compatible bundle output
- Create /health endpoint returning 200 — confirms Lambda + API Gateway wiring

**Shared Packages**
- packages/types — shared TypeScript interfaces matching the data model (Listing, Artist, Order, etc.)
- packages/db — Prisma schema and generated client, imported by apps/api
- packages/utils — shared utility functions (cents formatting, date helpers, slug generation)

**Infrastructure — Terraform**
- Bootstrap S3 backend and DynamoDB state locking (one-time manual step)
- Provision RDS PostgreSQL db.t3.micro with security group
- Provision S3 bucket for media with bucket policy
- Provision CloudFront distribution in front of S3
- Provision Cognito user pool with email, Google, and Apple identity providers
- Provision SES with verified sending domain
- Provision API Gateway HTTP API + Lambda function + IAM execution role

**Database — Prisma**
- Define complete schema matching Data Model v1.0
- Run first migration against RDS — all tables created
- Confirm Prisma client generates with full TypeScript types

**CI/CD — GitHub Actions**
- PR workflow: Turborepo build, TypeScript check, Terraform plan posted as PR comment
- Merge to main: Terraform apply, Lambda deploy via AWS CLI, Prisma migrate
- Store all secrets (AWS credentials, DB connection string) in GitHub Actions secrets

**Phase 1 Exit Criteria**
- Next.js deployed to Vercel — blank page or placeholder, no errors
- Lambda /health endpoint responding via API Gateway
- RDS running with full schema applied via Prisma
- Terraform state stored remotely, pipeline green on test PR and merge

## 4. Phase 2 — Artist Profile (Read-Only)

| PHASE 2 Artist Profile *Goal: A public-facing gallery experience with real artist profiles. This is the link you send to prospective founding artists.* Estimated time (nights & weekends): 4-6 weeks |
| --- |

> *Design quality matters enormously here. This is a gallery — it needs to look like one. The visual design of artist profiles is what prospective artists will judge the platform on. Invest real time in the UI.*

**Database Seeding**
- Seed 2 real artist profiles with real photos, bios, and listings — founding advisor and one other
- Seed CV entries, process media references, and categories for each
- Write a reusable seed script in packages/db

**API Endpoints**
- GET /artists/:slug — full artist profile with categories, CV, process media, and active listings
- GET /listings/:id — single listing with images and artist summary
- GET /listings — paginated listings filterable by category and status
- GET /categories — all categories with listing counts

**Artist Profile Page — /artist/[slug]**
- Hero: cover image, profile photo, display name, location, categories
- Artist statement, social links (displayed openly — Instagram, website)
- Process section: photo grid and embedded Mux video player
- CV: exhibitions, awards, education, press in sort_order
- Available work: grid of active listings with thumbnail, title, medium, price
- Archive: sold pieces shown as body of work, marked as sold
- ISR with on-demand revalidation when listing data changes

**Listing Detail Page — /listing/[id]**
- Photo gallery with multiple angles (front, back, detail)
- Title, medium, artwork dimensions, price, description, edition info if applicable
- Artist summary card linking to full profile
- CTA placeholder — no checkout yet, simple email interest capture

**Category Browse Page — /category/[category]**
- Grid of available listings in the selected category
- Listing card: primary image, title, artist name, medium, price
- Category navigation in site header

**Homepage**
- Platform positioning statement and tagline
- Featured artists and featured listings
- Category navigation grid
- Email waitlist or interest capture — no auth required

**Image Handling**
- Images stored in S3, served via CloudFront
- Sharp Lambda processes uploads at ingest — generates WebP variants at multiple sizes
- 2MB client-side upload size limit enforced

**Phase 2 Exit Criteria**
- Artist profile pages live at surfaced.art/artist/[slug] with real content
- Listing, category, and homepage all live and functional
- Platform passes the credibility test — looks like a real gallery
- Link is sendable to prospective founding artists

## 5. Phase 3 — Artist Onboarding (Self-Serve)

| PHASE 3 Artist Onboarding *Goal: Accepted artists can create and manage their own profiles without manual intervention. The founding cohort onboards themselves.* Estimated time (nights & weekends): 6-8 weeks |
| --- |

**Authentication**
- Sign up, sign in, sign out via Cognito — email, Google OAuth, Apple OAuth
- Password reset flow
- JWT validation middleware in Hono for all protected API routes
- Role check middleware for artist-only and admin-only routes

**Artist Application Form — /apply**
- Fields: name, email, Instagram, website, exhibition history, artist statement, medium selection, process photos
- Submission creates user + pending artist_profiles record
- Notification email to platform team, confirmation email to applicant via SES
- Applications reviewed in Airtable or Notion — no custom admin UI at this stage

**Artist Acceptance Flow**
- Admin API endpoint to approve an artist by user ID
- On approval: insert artist role in user_roles, set artist_profiles.status to approved
- Send formal gallery acceptance email via SES — tone mirrors a real gallery acceptance letter

**Artist Dashboard — /dashboard**
- Protected route requiring artist role
- Profile completion indicator, links to profile editor and listing management
- Stripe Connect onboarding prompt if not yet completed

**Profile Editor**
- Edit bio, location, social links
- Upload profile photo and cover image via pre-signed S3 URLs
- Manage process media: upload photos and Mux video, drag to reorder, delete
- Manage CV entries: add, edit, delete, reorder
- Manage category assignments

**Listing Management**
- List view of all artist listings with status indicators
- Create listing: all required fields from data model including packed dimensions and weight
- Photo upload: multiple images, drag to reorder, flag process photos
- Availability toggle: artist manually reserves or unreserves a listing
- Edit and delete existing listings

**Stripe Connect Onboarding**
- Backend generates Stripe Connect onboarding link for the artist
- Artist completes Stripe-hosted identity and banking verification
- Stripe webhook confirms completion — store stripe_account_id on artist_profiles

**Phase 3 Exit Criteria**
- Artists can apply, be accepted, and build full profiles without manual help
- Listings created by artists appear on public profile pages
- Founding cohort has onboarded themselves

## 6. Phase 4 — Transactions

| PHASE 4 Transactions *Goal: Real buyers can discover, purchase, and review real art. The platform is fully operational end-to-end.* Estimated time (nights & weekends): 8-12 weeks |
| --- |

**Buyer Accounts**
- Sign up and sign in via same Cognito pool as artists
- Buyer dashboard: saved listings, order history, followed artists
- Save and unsave listings, follow and unfollow artists

**Checkout Flow**
- Checkout page: artwork summary, real-time Shippo rate fetch, Stripe Tax calculation, order total
- Shippo rate fetch: artist origin zip + buyer destination zip + packed dimensions + packed weight
- Atomic listing reservation: set reserved_system status with reserved_until before payment capture
- Stripe Payment Intents for payment capture — Stripe Elements for PCI-compliant UI
- On success: create order record, set listing to sold, decrement quantity_remaining

**Post-Purchase & Fulfillment**
- Order confirmation email to buyer, new order notification to artist
- Artist enters tracking number and carrier — days_to_fulfill recorded
- Shipping notification email to buyer with tracking link
- Delivery confirmation by buyer or inference from tracking window
- 7-day payout hold after delivery, then Stripe releases funds to artist
- Payout notification email to artist

**Review Flow**
- Post-delivery email prompt to buyer
- Three-dimensional ratings: product accuracy, communication, packaging
- Overall rating computed server-side as weighted average — not entered by buyer
- Shipping flags: arrived_damaged, arrived_late, shipping_issue — displayed contextually, do not affect rating
- Artist public response field

**Commission Flow**
- Artist toggles commissions open/closed from dashboard
- Artist creates commission proposal after off-platform negotiation — creates listing with type=commission, tags buyer, enters agreed scope and timeline
- Buyer accepts proposal — triggers payment capture, accepted_at recorded
- Artist posts progress updates with optional photos
- On completion: days_to_complete recorded, follows standard shipping and review flow

**Phase 4 Exit Criteria**
- End-to-end purchase flow functional: browse, checkout, ship, confirm, review
- Commission flow functional
- All transactional emails sending correctly
- Stripe payouts releasing correctly after delivery window
- Platform ready for real buyers and real money

## 7. Explicitly Deferred — Post-Launch

The following are out of scope for v1. Do not build until real traffic and transaction volume justify the investment.

- Internal admin dashboard — use Airtable/Notion until external tooling is insufficient
- Automated artist re-vetting and flagging
- In-platform messaging between buyers and artists
- Faceted search and filters
- Personalized recommendations
- Artist analytics dashboard
- Optional studio subscription tier
- Split payment for commissions (deposit + final)
- International shipping
- Native mobile app
- RDS Proxy — add only when CloudWatch shows connection exhaustion
- OpenNext migration — move from Vercel to AWS only when cost justifies

> *This is a living document. Update phase contents as decisions evolve. Do not add scope to phases without explicit discussion.*
