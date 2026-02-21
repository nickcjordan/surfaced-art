# Surfaced Art — Claude Code Build Brief
## Phase 1: Foundation

---

## About This Document

This brief is written for a Claude Code session. You have access to four supporting documents in the project archive that provide full context on the platform:

- **Product Vision v0.4** — what the platform is, who it's for, all product decisions
- **Technical Architecture v1.0** — full stack decisions, AWS service map, infrastructure choices
- **Data Model v1.0** — complete PostgreSQL schema, all tables, fields, constraints, and indexes
- **Build Order v1.0** — phased plan; this session covers Phase 1 (Foundation) and Phase 2 (Artist Profile)

Read those documents if you need context on any decision. Do not re-litigate decisions already made in those documents. Your job is to build, not to redesign.

---

## What We Are Building

A curated Surfaced Art for handmade art. Artists are vetted and accepted. Buyers can browse and purchase directly from artists. The platform takes 30% commission on each sale. Shipping is a buyer-paid pass-through with no commission.

The platform is anti-AI, anti-dropship, anti-mass production. It positions as a gallery — not a marketplace.

---

## Immediate Goal

The first working version needs to be a **recruiting tool** — something credible enough to show prospective founding artists and convince them to join. That means polished public artist profile pages with real content. It does not mean a functional checkout, user auth, or any buyer-facing transactional features.

**Phase 1** gets the infrastructure right.
**Phase 2** gets something on screen that looks like a real gallery.

---

## Tech Stack (Already Decided — Do Not Change)

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), TypeScript |
| Frontend hosting | Vercel (initial) — connected to monorepo, root dir: apps/web |
| Styling | Tailwind CSS + ShadCN |
| Monorepo | Turborepo |
| IaC | Terraform — all AWS infrastructure |
| CI/CD | GitHub Actions |
| Backend | Node.js + TypeScript + Hono on AWS Lambda |
| API | AWS API Gateway (HTTP API) |
| Database | PostgreSQL on AWS RDS (db.t3.micro) |
| ORM | Prisma |
| File storage | AWS S3 + CloudFront |
| Image processing | Sharp (at upload time, Lambda function) |
| Video | Mux |
| Payments | Stripe Connect + Stripe Tax |
| Shipping | Shippo |
| Auth | AWS Cognito |
| Email | AWS SES + React Email |
| Search v1 | PostgreSQL full-text |

**Critical Vercel discipline:** Never import from `@vercel/*` packages. Do not use Vercel Image Optimization, Vercel Edge Middleware with Vercel-specific APIs, Vercel KV, Vercel Postgres, Vercel Blob, or Vercel Analytics. Treat Vercel as a deployment platform only. The app must remain portable to OpenNext on AWS with zero code changes.

---

## Monorepo Structure

```
/
├── apps/
│   ├── web/                  # Next.js frontend
│   └── api/                  # Hono Lambda backend
├── packages/
│   ├── types/                # Shared TypeScript interfaces
│   ├── db/                   # Prisma schema + generated client
│   └── utils/                # Shared utility functions
├── infrastructure/
│   └── terraform/            # All Terraform config
├── .github/
│   └── workflows/            # GitHub Actions CI/CD
├── turbo.json
└── package.json              # Root workspace config
```

---

## Phase 1 Build Tasks — Foundation

The goal of Phase 1 is a correctly wired skeleton. Nothing a user would look at. Everything an engineer needs to build fast in Phase 2.

### 1.1 Repository Setup

- Initialize a new GitHub repository
- Initialize Turborepo at the root with the workspace structure above
- Root `package.json` configured as a workspace with `"workspaces": ["apps/*", "packages/*"]`
- Root `tsconfig.json` with base TypeScript config extended by each workspace
- `turbo.json` with build pipeline: `types` and `db` build before `web` and `api`
- `.gitignore` covering node_modules, .env files, .next, dist, .turbo
- `.nvmrc` pinned to current LTS Node version

### 1.2 Frontend — apps/web

- Initialize Next.js with App Router and TypeScript: `npx create-next-app@latest`
- Install and configure Tailwind CSS following Next.js Tailwind docs
- Install ShadCN: `npx shadcn-ui@latest init` — copy components into repo, do not treat as external dependency
- Create a placeholder homepage that renders "Surfaced Art" — confirms deployment
- Connect to Vercel: set root directory to `apps/web` in Vercel project settings
- Confirm Vercel preview deployment triggers on PRs
- Confirm Vercel production deployment triggers on merge to main

**Do not import anything from `@vercel/*` packages at any point.**

### 1.3 Backend — apps/api

- Initialize Node.js + TypeScript project
- Install Hono: `npm install hono`
- Install esbuild or tsup for bundling
- Create `src/index.ts` as the Lambda handler entry point
- Implement `GET /health` returning `{ status: "ok" }` — this is the smoke test
- Configure bundle output to a single `dist/index.js` compatible with Lambda Node.js runtime
- Export handler as `export const handler = handle(app)` using Hono's Lambda adapter

### 1.4 Shared Types — packages/types

- Initialize TypeScript package
- Define interfaces matching every table in the data model: `User`, `UserRole`, `ArtistProfile`, `ArtistCategory`, `ArtistCvEntry`, `ArtistProcessMedia`, `Listing`, `ListingImage`, `Commission`, `CommissionUpdate`, `Order`, `Review`, `Save`, `Follow`
- Define all enums: `UserRoleEnum`, `ArtistStatusEnum`, `ListingStatusEnum`, `ListingTypeEnum`, `CategoryEnum`, `CommissionStatusEnum`, `OrderStatusEnum`
- Export everything from `index.ts`
- This package is imported by both `apps/web` and `apps/api`

### 1.5 Database — packages/db

- Initialize Prisma: `npx prisma init`
- Set `DATABASE_URL` as environment variable (local: `.env`, CI: GitHub secret)
- Write the complete Prisma schema matching Data Model v1.0 exactly — all tables, all fields, all enums, all indexes, all constraints
- Run `npx prisma migrate dev --name init` to generate and apply the first migration
- Confirm all tables exist in RDS via `npx prisma studio` or a direct connection check
- Export the Prisma client from `packages/db/index.ts`
- `apps/api` imports the Prisma client from `packages/db`

**Key schema notes from the data model:**
- All monetary fields are integers in cents — no decimals for money
- All primary keys are UUIDs
- `listings` has both `artwork_*` dimensions (the piece) and `packed_*` dimensions (the shipping box) — these are separate required fields
- `listings.reserved_until` is a timestamp checked on read — no background job needed to revert expired reservations
- `reviews` has three separate rating fields (`rating_product`, `rating_communication`, `rating_packaging`) plus a computed `overall_rating` — not a single rating field
- `user_roles` is a separate join table — roles are not stored on the `users` table
- `video_provider` field on `artist_process_media` stores the provider name (e.g. "mux") explicitly to support future changes

### 1.6 Infrastructure — infrastructure/terraform

Bootstrap state storage first (one-time manual step before Terraform can manage itself):
```
# Bootstrap manually — creates the S3 bucket and DynamoDB table for Terraform state
# This is the only thing ever created manually in AWS console
```

Then define in Terraform:

**State backend:**
- S3 bucket for Terraform state with versioning enabled
- DynamoDB table for state locking

**RDS:**
- PostgreSQL instance, engine `postgres`, instance class `db.t3.micro`
- DB subnet group and security group
- Security group allows inbound 5432 only from Lambda security group

**S3 + CloudFront:**
- S3 bucket for media uploads — private, no public access
- CloudFront distribution with S3 origin using Origin Access Control (OAC)
- CloudFront cache behaviors appropriate for image serving

**Cognito:**
- User pool with email sign-in
- Google identity provider (OAuth client ID and secret stored as Terraform variables)
- Apple identity provider
- User pool client for the frontend app

**SES:**
- Verify sending domain
- Configuration set for email logging

**Lambda + API Gateway:**
- Lambda function for the backend: Node.js runtime, handler `index.handler`, points to `apps/api/dist/index.js`
- Lambda security group allowing outbound to RDS security group on 5432
- API Gateway HTTP API with Lambda integration
- `ANY /{proxy+}` route catches all requests and passes to Hono

**IAM:**
- Lambda execution role with policies for: CloudWatch Logs, SES send, S3 GetObject/PutObject on media bucket

All Terraform variables (DB password, Cognito client secrets, etc.) sourced from environment variables or a `terraform.tfvars` file — never hardcoded.

### 1.7 CI/CD — .github/workflows

**pr.yml — Pull Request Workflow:**
```yaml
# Triggers on: pull_request to main
# Steps:
# 1. Checkout
# 2. Setup Node.js (version from .nvmrc)
# 3. Install dependencies (npm ci at root)
# 4. Run Turborepo build (catches compilation errors across all packages)
# 5. Run TypeScript type check across all packages
# 6. Setup Terraform
# 7. terraform init
# 8. terraform plan — post output as PR comment
# Vercel handles frontend preview deployment automatically via GitHub integration
```

**deploy.yml — Merge to Main Workflow:**
```yaml
# Triggers on: push to main
# Steps:
# 1. Checkout
# 2. Setup Node.js
# 3. Install dependencies
# 4. Turborepo build
# 5. terraform init
# 6. terraform apply -auto-approve
# 7. Bundle apps/api: npx tsup src/index.ts --format cjs --out-dir dist
# 8. Deploy Lambda: aws lambda update-function-code --function-name [name] --zip-file fileb://dist.zip
# 9. Run Prisma migrations: npx prisma migrate deploy
# Vercel handles frontend production deployment automatically
```

**GitHub Actions secrets required:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `DATABASE_URL` (RDS connection string)
- `TF_VAR_db_password`
- `TF_VAR_google_client_id`
- `TF_VAR_google_client_secret`

### 1.8 Phase 1 Exit Criteria

Before moving to Phase 2, confirm all of the following:

- [ ] `apps/web` deploys to Vercel — no errors, placeholder page renders
- [ ] `apps/api` Lambda responds to `GET /health` via API Gateway URL
- [ ] RDS has all tables from the data model — confirmed via Prisma or direct connection
- [ ] Terraform state stored in S3, no untracked infrastructure
- [ ] GitHub Actions PR workflow runs green (build + type check + Terraform plan)
- [ ] GitHub Actions deploy workflow runs green on merge to main
- [ ] No `@vercel/*` imports anywhere in the codebase

---

## Phase 2 Build Tasks — Artist Profile (Read-Only)

The goal of Phase 2 is a public-facing gallery experience with real artist profiles. Design quality is critical — this is what prospective artists will judge the platform on.

### 2.1 Database Seeding

Write a seed script at `packages/db/seed.ts`:

- Create 2 real artist user records and artist profiles
- Artist 1: the founding advisor (SIL). Real name, real bio, real location
- Artist 2: one other founding artist from the advisor network
- For each artist: seed categories, CV entries, process media references, and 3-5 listings
- Listings should have real titles, descriptions, medium, artwork dimensions, packed dimensions, prices
- Listing images: seed with real CloudFront URLs (upload the actual images to S3 first)
- Run with `npx prisma db seed`

Seeded data must pass the credibility test — a prospective artist looking at the profile should believe this is a functioning, cared-for platform.

### 2.2 API Endpoints — apps/api

Implement in Hono. All routes are public (no auth middleware in Phase 2).

```
GET /artists/:slug
  Returns: full artist profile including categories, CV entries sorted by sort_order,
  process media sorted by sort_order, and all listings with status=available or sold
  Include: listing images (sorted by sort_order) with each listing

GET /listings/:id
  Returns: single listing with all images, artist summary (display_name, slug, profile_image_url, location)

GET /listings
  Query params: category (optional), status (optional, default: available), page, limit
  Returns: paginated listing array with artist summary per listing

GET /categories
  Returns: all category enum values with count of available listings in each
```

Return types should match the interfaces in `packages/types`. Use Prisma queries in `packages/db`.

### 2.3 Artist Profile Page — apps/web

Route: `app/artist/[slug]/page.tsx`

This is the flagship page of the platform. Every design decision should reinforce the gallery aesthetic — clean, spacious, image-forward, typographically considered.

**Page structure:**
1. **Hero** — full-width cover image with profile photo overlapping the bottom edge, display name, location, category pills
2. **Artist statement** — bio in a clean typographic treatment, 80-140 words
3. **Social links** — Instagram and website links displayed openly (real galleries don't hide that artists exist elsewhere)
4. **Process section** — alternating photo grid and Mux video embed. This is a key trust signal — buyers see the artist actually making their work. Use the Mux player embed URL constructed from `video_playback_id`
5. **CV / history** — clean list of exhibitions, awards, education, press sorted by `sort_order`. Group by type or display chronologically — designer's call
6. **Available work** — responsive grid of listing cards. Each card: primary listing image, title, medium, price. Links to listing detail page
7. **Archive** — sold pieces shown in a visually distinct section. Same card format but with a "Sold" indicator. Reinforces the artist's body of work and track record

**ISR configuration:**
```typescript
export const revalidate = 60 // revalidate every 60 seconds
// Also implement on-demand revalidation via revalidatePath when listings change
```

**SEO:**
```typescript
export async function generateMetadata({ params }) {
  // Fetch artist and return metadata with artist name, bio excerpt, profile image
}
```

### 2.4 Listing Detail Page — apps/web

Route: `app/listing/[id]/page.tsx`

**Page structure:**
1. **Photo gallery** — primary image large, thumbnail strip below. Keyboard navigable. All listing images displayed
2. **Details panel** — title, medium, category, price (formatted from cents), artwork dimensions (L × W × H inches)
3. **Edition info** — if `edition_number` and `edition_total` are set, display "Edition 3 of 50"
4. **Description** — the piece's story, 40-100 words
5. **Artist card** — profile photo, display name, location, link to full profile
6. **CTA** — no checkout in Phase 2. Display an interest capture: "Join the waitlist to purchase" with email input, or a mailto link. Keep it elegant — do not let the absence of checkout make the page feel broken

**ISR configuration:** same as artist profile page

### 2.5 Category Browse Page — apps/web

Route: `app/category/[category]/page.tsx`

- Responsive grid of available listings in the selected category
- Listing card: primary image (square crop), title, artist name, medium, price
- Category header with name and listing count
- Empty state if no listings in category — clean, not broken-looking
- Category navigation: link to all other categories

### 2.6 Homepage — apps/web

Route: `app/page.tsx`

**Sections:**
1. **Hero** — platform positioning statement. "A curated digital gallery for real makers. Every artist is vetted. Every piece is handmade." — or COO-approved variant. Full-width, typographically strong
2. **Featured artists** — 2-3 artist cards with cover image, name, medium, location. Links to profiles
3. **Featured listings** — 4-6 listing cards from across categories
4. **Category grid** — all 9 categories with listing counts. Visual grid with category imagery
5. **Waitlist / interest capture** — email capture, no auth. "Be the first to know when we open to buyers." Store email in a simple `waitlist` table (add this table to the schema — just `id`, `email`, `created_at`)

### 2.7 Site Navigation & Layout

- Global header: platform name/logo, category navigation, placeholder for sign-in (not functional yet)
- Global footer: platform statement, category links, placeholder for social links
- All pages use a shared layout in `app/layout.tsx`
- Mobile-responsive throughout — many artists will view on phone

### 2.8 Image Handling

- Sharp Lambda function triggered on S3 upload: generates WebP variants at 400px, 800px, 1200px widths
- Frontend uses appropriately sized variant per context (thumbnails use 400px, hero images use 1200px)
- All image URLs are CloudFront URLs — never direct S3 URLs
- Next.js `<Image>` component with `unoptimized` prop (since we handle optimization ourselves via Sharp)
- Never use Vercel's image optimization pipeline

### 2.9 Phase 2 Exit Criteria

Before calling Phase 2 complete:

- [ ] Artist profile pages live at `surfaced.art/artist/[slug]` with real content for both seed artists
- [ ] Listing detail pages render all fields correctly
- [ ] Category browse pages show correct listings per category
- [ ] Homepage renders with featured content
- [ ] Platform looks like a gallery — show it to someone unfamiliar with the project and get their honest reaction
- [ ] All pages are mobile-responsive
- [ ] SEO metadata renders correctly (check via view-source or a meta tag checker)
- [ ] No console errors in production
- [ ] Link is sendable to a prospective artist with confidence

---

## Development Environment Setup

Before starting, confirm you have:
- Node.js (version from .nvmrc)
- AWS CLI configured with appropriate credentials
- Terraform installed
- A Vercel account connected to your GitHub
- An AWS account with appropriate IAM permissions
- A Stripe account (not needed until Phase 4 but create it now)
- A Mux account (needed for Phase 2 video embedding)
- A Shippo account (not needed until Phase 4)

Local environment variables needed in `apps/api/.env` and `packages/db/.env`:
```
DATABASE_URL=postgresql://[user]:[password]@[rds-endpoint]:5432/[dbname]
AWS_REGION=us-east-1
```

---

## Code Quality Standards

- TypeScript strict mode throughout — no `any` types
- All API response shapes typed using interfaces from `packages/types`
- All database queries through Prisma — no raw SQL except where Prisma cannot express the query
- All monetary values handled as integers in cents throughout — format to dollars only at the display layer
- All environment variables validated at startup — fail loudly if required vars are missing
- No secrets or credentials committed to the repository

---

## What Not to Build Yet

Do not build any of the following in Phase 1 or Phase 2. They come in later phases:

- User authentication or sign-in UI
- Artist application form
- Artist dashboard or profile editor
- Checkout or payment processing
- Shipping rate calculation
- Commission flow
- Review system
- Admin tooling
- Search functionality beyond basic category navigation
- Email sending (except as tested infrastructure)
- Any buyer account features

If you find yourself starting to build any of the above, stop and focus on the Phase 2 exit criteria instead.
