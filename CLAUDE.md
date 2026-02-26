# Claude Code Instructions for Surfaced Art

This file provides context and instructions for AI agents working on this codebase.

## Project Overview

Surfaced Art is a curated digital gallery for handmade art. Artists are vetted and accepted. Buyers can browse and purchase directly from artists. The platform takes 30% commission on each sale.

**Current Phase**: Phase 1 (Foundation) and Phase 2 (Artist Profile)

## Documentation

Before making changes, read the relevant documentation in `docs/`:

- `Surfaced_Art_Vision_v0.4.md` - Product decisions, what to build and what NOT to build
- `Surfaced_Art_Architecture_v1.0.md` - Tech stack decisions, infrastructure
- `Surfaced_Art_Data_Model_v1.0.md` - Complete database schema with all tables, fields, constraints
- `Surfaced_Art_Build_Order_v1.0.md` - Phased build plan
- `Surfaced_Art_Claude_Code_Brief_Phase1_2.md` - Detailed specs for Phase 1 & 2

## Architecture Decision Records

Key architectural decisions are documented in `docs/decisions/`. Check there before re-evaluating past decisions. See `docs/decisions/README.md` for the full index and ADR template.

## Tech Stack (Do Not Change)

| Layer | Technology |
|-------|------------|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, ShadCN |
| Backend | Node.js + TypeScript + Hono on AWS Lambda |
| Database | PostgreSQL on AWS RDS, Prisma ORM |
| Infrastructure | Terraform, GitHub Actions |
| Hosting | Vercel (frontend), AWS (backend/infra) |

### Bruno API Collection

The `bruno/` directory contains a [Bruno](https://www.usebruno.com/) API collection that mirrors every endpoint in `apps/api/`. **When you add, remove, or change an API endpoint, update the corresponding Bruno `.bru` file(s) to match.** This includes:

- Adding new request files for new endpoints
- Updating URLs, query params, request bodies, and assertions when endpoints change
- Adding error-case requests (404, 400) for new endpoints
- Keeping environment variables (`bruno/environments/`) in sync with any new base URLs

Structure: `bruno/{FolderPerResource}/{RequestName}.bru` with `environments/Local.bru` and `environments/Production.bru`.

### Critical Vercel Discipline

**NEVER** import from `@vercel/*` packages. The platform must remain portable to OpenNext on AWS.

- Do NOT use Vercel Image Optimization
- Do NOT use Vercel KV, Postgres, Blob, or Analytics
- Use Next.js Image with `unoptimized` prop
- Use Sharp for image processing

## Design System Architecture

The frontend uses a layered CSS custom property system built on ShadCN/ui conventions with Tailwind CSS v4. Source of truth: `docs/Surfaced_Art_Brand_Design_System_v2_0.md`.

### Token Layers

```
:root          → Light mode base tokens (--background, --primary, etc.)
.dark          → Dark mode overrides (applied by next-themes via class)
@theme inline  → Registers tokens for Tailwind v4 utilities (--color-*, --radius-*, --font-*)
@layer base    → Global element styles (headings, selection, focus-visible)
@layer components → Type scale utility classes (.text-heading-1, .text-body-default, etc.)
```

All color values live in `:root` and `.dark` as plain hex values. The `@theme inline` block maps them to Tailwind-compatible `--color-*` names so you can use classes like `bg-primary`, `text-muted-foreground`, etc.

### How to Add a New Color Token

1. Add the light mode value to `:root` in `globals.css`:
   ```css
   --my-token: #hex;
   ```
2. Add the dark mode value to `.dark`:
   ```css
   --my-token: #hex;
   ```
3. Register it in `@theme inline` for Tailwind:
   ```css
   --color-my-token: var(--my-token);
   ```
4. Use in components: `className="bg-my-token text-my-token"`

### Font Architecture

Two role-based font stacks with fallback chains:

```css
--active-font-sans: var(--font-dm-sans, 'DM Sans', sans-serif);   /* Body text */
--active-font-serif: var(--font-dm-serif, 'DM Serif Display', serif); /* Headings */
```

- `--font-dm-sans` and `--font-dm-serif` are injected by `next/font` in `layout.tsx`
- If `next/font` variables are missing, the fallback fonts inside `var()` activate
- Registered in `@theme inline` as `--font-sans` and `--font-serif`
- Headings (`h1`–`h4`) use `var(--active-font-serif)` in `@layer base`
- Body uses `var(--active-font-sans)` on the `body` element

To swap fonts: change the `next/font` import in `layout.tsx` and update the fallback strings in `globals.css`.

### Artist Theme Scoping (Future)

The token architecture supports per-artist theme customization via CSS custom property inheritance. A wrapper element with inline `style` overrides will cascade to all child components:

```tsx
// Future pattern — ArtistThemeProvider
<div style={{
  '--primary': artist.accentColor,
  '--accent-primary': artist.accentColor,
  '--ring': artist.accentColor,
} as React.CSSProperties}>
  <ArtistProfile />
</div>
```

**Customizable tokens** (artist can set): `--primary`, `--accent-primary`, `--accent-secondary`, `--ring`

**Locked tokens** (platform-controlled): `--background`, `--foreground`, `--surface`, `--border`, `--error`, `--success`, `--warning`, `--destructive`, font stacks

**Known challenge**: Per-artist heading fonts require dynamic font loading at runtime. The token architecture supports it (`--active-font-serif` can be overridden), but the font loading mechanism needs its own design in a future phase.

### Global Style Scoping Rules

- **No global link styles.** ShadCN components manage their own hover/focus states. Content areas (artist bios, listing descriptions) should use prose utility classes for rich text link styling.
- **`a:focus-visible`** is the only global link style — uses `var(--ring)` for accessibility.
- **`::selection`** uses `var(--primary)` / `var(--primary-foreground)`.
- **Heading elements** (`h1`–`h4`) have global font-family and type scale styles. These use CSS custom properties, so they respond to scoped theme overrides.

### Adding ShadCN Components

```bash
cd apps/web
npx shadcn@latest add <component-name>
```

Components are installed to `apps/web/src/components/ui/`. They automatically use the design tokens from `globals.css`. No manual token wiring is needed — ShadCN reads `--primary`, `--border`, `--radius`, etc.

### Container and Layout Patterns

The `<Container>` component (`apps/web/src/components/ui/container.tsx`) provides consistent page-width constraints:

```tsx
import { Container } from '@/components/ui/container'

<Container>              {/* max-w-7xl mx-auto px-6 */}
<Container className="py-8">  {/* adds vertical padding */}
```

- `layout.tsx` wraps `<main>` content in `<Container className="py-8 md:py-12">`
- Header and Footer use `<Container>` internally
- Pass additional classes via `className` prop (merged with `cn()`)

## Issue-Driven Development Process

### Planning → Issues → Implementation

This project uses a two-layer workflow:

- **Notion** is the planning layer — product decisions, phase planning, specs, design work
- **GitHub Issues** are the execution layer — trackable dev tasks with clear acceptance criteria

### How tasks flow

1. **Design session** (Claude.ai or Claude Code) — discuss what to build, make decisions
2. **Create GitHub Issue** — use the "Dev Task" template, capturing design context, acceptance criteria, and scope
3. **Implementation** (Claude Code) — pick up the issue, create a feature branch, do the work
4. **PR** — open a PR linked to the issue with "Closes #N" in the description
5. **Review & merge** — human reviews and merges; issue auto-closes

### Issue workflow labels

| Label | Meaning |
|-------|---------|
| `ready` | Task is fully specified and ready to be picked up |
| `in-progress` | Currently being worked on |
| `blocked` | Waiting on a dependency or decision |

### Creating issues (for Claude)

When creating issues from a design session:

1. Use the **Dev Task** issue template
2. Fill in **Design Context** with key decisions and rationale from the session
3. Link to relevant **Notion pages** for background
4. Write **Acceptance Criteria** as specific, testable conditions
5. List the **Scope** (affected packages/files) so the implementer knows the blast radius
6. Add area labels (`frontend`, `backend`, `database`, `infrastructure`, etc.)
7. Set the `ready` label when the issue is fully specified

```bash
# Create an issue from CLI
gh issue create --title "feat(web): add artist profile header" \
  --label "ready,frontend" \
  --body "$(cat <<'EOF'
## Summary
...

## Design Context
...

## Acceptance Criteria
- [ ] ...
EOF
)"

# Pick up an issue — label it in-progress
gh issue edit <number> --remove-label "ready" --add-label "in-progress"

# After opening the PR that closes it
gh issue edit <number> --remove-label "in-progress"
```

### Picking up issues (for Claude Code)

When starting work on an issue:

1. Read the issue: `gh issue view <number>`
2. Label it `in-progress`: `gh issue edit <number> --remove-label "ready" --add-label "in-progress"`
3. Create a feature branch: `git checkout -b feat/<short-description> dev`
4. Implement following the acceptance criteria
5. Run all quality gates
6. Open a PR with "Closes #N" in the body
7. Remove `in-progress` label: `gh issue edit <number> --remove-label "in-progress"`
8. After the PR is merged, clean up the branch:
   - Delete the remote branch: `git push origin --delete feat/<short-description>`
   - Switch to dev: `git checkout dev && git pull`
   - Delete the local branch: `git branch -d feat/<short-description>`

### For Every Task (implementation)

1. **Write tests first** (TDD approach using Vitest)
2. **Implement code** to make tests pass
3. **Run quality gates**:
   ```bash
   npm run test        # Vitest test suite
   npm run lint        # ESLint
   npm run typecheck   # tsc --noEmit
   npm run build       # Turborepo build
   ```
4. **Commit to dev branch** with conventional commit message
5. **Run regression tests** before pushing

### Branch Strategy

- Work on `dev` branch
- Create feature branches from `dev` for larger features
- Merge to `main` triggers production deployment

### Merge Strategy (CRITICAL)

| PR direction | Strategy | Why |
|---|---|---|
| feature → `dev` | **Squash merge** | Collapses noisy WIP commits into one clean commit on `dev` |
| `dev` → `main` | **Regular merge commit** | Preserves commit parentage so git never sees dev as diverged from main |

**Never squash dev → main.** Squash rewriting history on that direction causes permanent divergence: every subsequent dev→main PR conflicts on any file touched by the squash. Since features are already squashed before hitting dev, dev's log is already clean — a regular merge gives main the same readable history without rewriting it.

### Pull Request Rules (CRITICAL)

- **NEVER merge to `main`** — merging to main is always a human action
- When work is ready to merge, open a PR from CLI with a full description and stop
- Update PR descriptions with accurate summaries of what changed and why
- Prepare commit messages for human review, but do not execute the merge
- `dev` → `main` merges require **explicit user permission** — never merge to main autonomously
- All CI checks must be green before merging `dev` → `main`

### Commit Message Format

```
type(scope): description

Types: feat, fix, refactor, test, docs, chore
Scopes: web, api, db, types, utils, infra, ci
```

Examples:
- `feat(api): add artist profile endpoint`
- `fix(web): correct image aspect ratio on listing cards`
- `test(db): add seed validation tests`
- `docs: update CLAUDE.md with new workflow`

## Project Structure

```
/
├── apps/
│   ├── web/                  # Next.js frontend
│   └── api/                  # Hono Lambda backend
├── packages/
│   ├── types/                # Shared TypeScript interfaces
│   ├── db/                   # Prisma schema + client
│   └── utils/                # Shared utilities
├── tools/
│   └── migrate/              # Database migration Lambda
├── infrastructure/
│   └── terraform/            # All Terraform config
├── .github/
│   └── workflows/            # CI/CD pipelines
└── docs/                     # Project documentation
```

## Key Data Model Rules

- All monetary values are stored as **integers in cents** (e.g., $125.00 = 12500)
- All primary keys are **UUIDs**
- `listings` has separate `artwork_*` and `packed_*` dimension fields
- `reviews` has 3 rating fields (product, communication, packaging) + computed overall_rating
- `user_roles` is a separate join table
- `reserved_until` on listings is checked on read (no background job needed)

## Testing

- **Unit tests**: Vitest for utils, type exports, API handlers (mocked Prisma)
- **Integration tests**: Vitest with test database
- **Component tests**: Vitest + React Testing Library
- **E2E tests**: Playwright (future phases)

## Visual QA Conventions

The project has a visual QA suite separate from unit/component tests. Full specification is in `docs/Visual_QA_Automation.md`.

### Two Test Layers

| Layer | Executor | Purpose |
|---|---|---|
| **Automated (Playwright)** | CI runs on every PR | SEO, console errors, network failures, responsive screenshots, page structure |
| **Interactive (Claude.ai)** | Human pastes prompt into Claude.ai with Chrome tools | Subjective design review, gallery feel assessment, UX walkthrough |

### `data-testid` Convention

Every major section of every page gets a `data-testid` attribute. These are the stable selectors for Playwright visual QA tests and Claude.ai interactive reviews.

**Pattern:**
```tsx
<section data-testid="artist-hero">
  <h1 data-testid="artist-name">{artist.displayName}</h1>
</section>
```

**Required inventory by page:**

| Page | Required `data-testid` values |
|---|---|
| Homepage | `hero`, `featured-artists`, `artist-card`, `featured-listings`, `listing-card`, `category-grid`, `waitlist`, `waitlist-email-input`, `waitlist-submit` |
| Artist Profile | `artist-hero`, `artist-name`, `artist-bio`, `artist-location`, `artist-categories`, `artist-social-links`, `process-section`, `cv-section`, `available-work`, `archive-section`, `listing-card` |
| Listing Detail | `listing-title`, `listing-price`, `listing-images`, `listing-description`, `listing-dimensions`, `listing-medium`, `artist-card`, `edition-info` |
| Category Browse | `category-header`, `category-content`, `listing-card`, `category-nav` |
| Global | `site-header`, `site-footer`, `site-nav`, `category-link` |

**Coexistence with React Testing Library:** Component/unit tests continue to use semantic role queries (`getByRole`, `getByText`). `data-testid` is for E2E/visual QA selectors only. Both approaches are correct for their context.

### Visual QA Test Rules

- All test selectors use `data-testid` — never CSS class selectors, never fragile XPath
- Seed data references (artist slugs, listing IDs) defined as constants at the top of each test file, never hardcoded inline
- Screenshot naming convention: `{page}-{variant}-{device}.png`
- No automated visual regression (pixel-diff) at v1 — screenshots are for human review only
- Visual QA tests run against deployed URLs via `VISUAL_QA_BASE_URL` env var, not local dev servers

### Interactive Visual Review (Claude.ai Prompt)

A structured prompt for Claude.ai with Chrome tools is saved in `docs/Visual_QA_Automation.md` Section 3.1. Use it at these milestones:

| Milestone | When |
|---|---|
| Phase 2 first deploy | First time real content renders on a Vercel preview URL |
| Design iteration | After significant CSS/layout changes, before calling the phase done |
| Phase 2 exit criteria | Final "is this sendable to artists?" gut check |
| Brand guide implementation | After COO brand decisions are applied to the design system |
| Major new features | After each Phase 3/4 feature that adds visual pages or flows |

## SEO Maintenance Rules

SEO artifacts are spread across multiple files and must stay in sync with code changes. **When making any of the changes listed below, update all affected SEO files.**

### When Adding a New Page Route

1. **Sitemap** (`apps/web/src/app/sitemap.ts`) — add the new route to the sitemap entries
2. **Metadata** — export `generateMetadata` (or static `metadata`) with title, description, canonical URL, and Open Graph fields
3. **JSON-LD** — add appropriate schema.org structured data via the `<JsonLd>` component (use `WebPage`, `CollectionPage`, `Product`, `Person`, etc. as appropriate)
4. **Breadcrumbs** — add `<Breadcrumbs>` with correct hierarchy if the page has a parent
5. **robots.ts** — if the route should NOT be crawled (e.g., `/admin/`), add it to the `disallow` array
6. **Visual QA tests** (`apps/web/e2e/visual-qa/seo-metadata.spec.ts`) — add test cases for the new page's meta tags

### When Adding or Removing a Category

1. Add/remove from `CATEGORIES` in `apps/web/src/lib/categories.ts`
2. Add/remove the label mapping in `apps/web/src/lib/category-labels.ts`
3. Sitemap, `generateStaticParams`, and category page metadata update automatically via `CATEGORIES`
4. **Navigation** (Header/Footer) must be updated manually

### When Changing URL Patterns

If a route path changes (e.g., `/artist/` to `/creators/`):

1. Move the Next.js route directory
2. Update sitemap URL construction in `sitemap.ts`
3. Update breadcrumb `href` values on all pages that link to the changed route
4. Update JSON-LD `url` fields on affected pages
5. Update `generateMetadata` canonical URLs
6. Update visual QA test selectors and URLs
7. Add redirects from old URLs to prevent 404s on indexed pages

### When Changing Brand Identity

If the brand name, tagline, domain, or accent color changes:

1. **`SITE_URL`** in `apps/web/src/lib/site-config.ts` — single source of truth for the domain
2. **Root layout** (`layout.tsx`) — `metadataBase`, default title/description, Twitter handle
3. **Homepage** (`page.tsx`) — title, description, JSON-LD `WebSite` and `Organization` schemas
4. **OG image** (`opengraph-image.tsx`) — brand name text, accent color, tagline

### SEO File Inventory

| File | Contains | Depends On |
|---|---|---|
| `apps/web/src/lib/site-config.ts` | `SITE_URL` constant | Nothing (single source of truth) |
| `apps/web/src/app/sitemap.ts` | Dynamic sitemap | `SITE_URL`, `CATEGORIES`, API (`getFeaturedArtists`, `getListings`) |
| `apps/web/src/app/robots.ts` | Crawl rules | `SITE_URL` |
| `apps/web/src/app/opengraph-image.tsx` | Default OG image | Brand name, accent color |
| `apps/web/src/components/JsonLd.tsx` | JSON-LD renderer | Nothing (generic component) |
| `apps/web/src/components/Breadcrumbs.tsx` | Breadcrumb nav + schema | `SITE_URL` |
| `apps/web/e2e/visual-qa/seo-metadata.spec.ts` | SEO regression tests | Seed data constants, route paths |
| Each page's `generateMetadata` | Per-page OG/canonical/description | `SITE_URL`, page-specific API data |
| Each page's `<JsonLd>` usage | Per-page structured data | `SITE_URL`, page-specific API data |

## What NOT to Build (Phase 1 & 2)

Do NOT build these features yet:
- User authentication or sign-in UI
- Artist application form
- Artist dashboard or profile editor
- Checkout or payment processing
- Shipping rate calculation
- Commission flow
- Review system
- Admin tooling
- Search beyond category navigation
- Email sending (except infrastructure setup)
- Buyer account features

## Tracing Changes

To understand where a bug may have been introduced:

```bash
# View recent commits
git log --oneline -20

# View commits affecting a specific file
git log --oneline -- path/to/file

# View changes in a specific commit
git show <commit-hash>

# Find which commit introduced a change
git blame path/to/file
```

## Local Development Database

```bash
docker compose up -d                    # Start PostgreSQL
# Create packages/db/.env with:
# DATABASE_URL=postgresql://surfaced:surfaced_local@localhost:5432/surfaced
cd packages/db && npm run db:migrate:deploy  # Apply migrations
cd packages/db && npm run db:seed            # Load seed data
npm run db:studio                            # Browse data in Prisma Studio (optional)
```

See `.env.example` at the repo root for the default local connection string.

## Environment Variables

Required in `.env` files (never commit these):

```
DATABASE_URL=postgresql://[user]:[password]@[host]:5432/[dbname]
AWS_REGION=us-east-1
REVALIDATION_SECRET=[random-secret]  # Vercel env var — protects POST /api/revalidate
```

## No Shortcuts Policy

**NEVER take a shortcut or "convenient" approach.** This project is pre-launch with zero users — the cost of doing things right is at its lowest. Every shortcut taken now compounds later.

Before implementing any approach, ask: **"Is this the proper way to do this, or am I cutting a corner?"** If you sense you're working around a problem rather than solving it properly, **STOP and explain the situation to the user** before continuing. Let the user decide whether to accept the tradeoff.

Red flags that indicate a hacky approach:
- Symlinks or path hacks to fix module resolution
- Dual-purposing a component for unrelated responsibilities
- Hardcoding internal paths of third-party packages
- Swallowing errors to work around unexpected failures
- Adding workarounds that "only need to run once" but stay in the codebase forever
- Fighting the tool instead of using it as designed
- Hand-editing generated files (lockfiles, build artifacts, etc.) instead of letting the toolchain regenerate them properly

### Lockfile Rules

- **NEVER delete `package-lock.json` and regenerate from scratch.** Regenerating on a single platform loses cross-platform optional dependency resolution (e.g., Linux native bindings needed by Vercel/CI). Always run `npm install` on the existing lockfile to apply incremental changes.
- **NEVER hand-edit `package-lock.json`.** If npm leaves stale entries (e.g., after a workspace move), fix the root cause (remove stale `node_modules/` directories, re-run `npm install`) rather than editing the JSON directly. If `npm install` doesn't fix it, ask the user before taking manual action.

If any of these arise, pause and present the user with:
1. What the hack is and why it's needed
2. What the proper solution looks like
3. The cost/effort difference between the two

## Quality Checklist Before Each Commit

- [ ] Tests pass (`npm run test`)
- [ ] No lint errors (`npm run lint`)
- [ ] No type errors (`npm run typecheck`)
- [ ] Build succeeds (`npm run build`)
- [ ] No `@vercel/*` imports added
- [ ] Monetary values stored as cents
- [ ] UUIDs used for primary keys
- [ ] New pages have `generateMetadata` with canonical URL, OG fields, and `<JsonLd>` structured data
- [ ] New pages added to sitemap (`sitemap.ts`) and have `<Breadcrumbs>` if applicable
- [ ] Route changes reflected in sitemap, breadcrumbs, JSON-LD URLs, and canonical URLs

## Security Scanning (For Claude Code)

When the user asks to fix security issues or review scan results, use these commands:

### Run Local Security Scans

```bash
# Run all scans (npm audit, Trivy, Semgrep, Dependabot, PR bot reviews)
npm run security:scan

# Run individual scans
npm run security:npm        # npm audit only
npm run security:trivy      # Trivy filesystem + IaC
npm run security:semgrep    # Semgrep code analysis
npm run security:dependabot # Fetch GitHub Dependabot alerts
npm run security:pr-reviews # Fetch bot review comments from open PRs (Sourcery, etc.)
```

### Read Scan Results

After running scans, reports are saved to `.security-reports/`:

```bash
# Read summary of all findings
cat .security-reports/summary.json

# Read detailed reports
cat .security-reports/npm-audit.json
cat .security-reports/trivy-fs.json
cat .security-reports/trivy-iac.json
cat .security-reports/semgrep.json
cat .security-reports/dependabot.json
cat .security-reports/pr-reviews.json  # Bot comments from Sourcery, etc. on open PRs
```

### Security Fix Workflow

1. Run `npm run security:scan` to get current findings
2. Read `.security-reports/summary.json` to understand scope
3. For each finding:
   - Read the detailed report for context
   - Determine the fix (update dependency, change code, update Terraform)
   - Make the fix
   - Run tests to ensure no regressions
4. Re-run scan to verify fix
5. Commit with message: `fix(security): description of what was fixed`

### Tool Requirements

For full scanning, these tools should be installed locally:
- **Trivy**: `choco install trivy` (Windows) or `brew install trivy` (Mac)
- **Semgrep**: `pip install semgrep`
- **GitHub CLI**: For Dependabot, needs `GITHUB_TOKEN` env var with `security_events` scope

npm audit works out of the box with no additional setup.

## GitHub CLI (`gh`) — Required PAT Permissions

The `gh` CLI is used for PR creation, merging, and security scanning. If you hit
`GraphQL: Resource not accessible by personal access token`, the fine-grained PAT
is missing a permission. Here are all permissions required for full `gh` functionality:

| Permission | Level | Used for |
|---|---|---|
| **Contents** | Read-only | Reading branch refs, commits — needed by `gh pr create` / `gh pr merge` |
| **Pull requests** | Read and write | Creating and updating PRs |
| **Security events** | Read and write | Dependabot alerts via `gh api` |
| **Metadata** | Read-only | Automatically included, required for all operations |

**To update the token**: GitHub → Settings → Developer settings → Personal access tokens →
Fine-grained tokens → edit the token → update Repository permissions.

**Common error → missing permission mapping**:
- `repository.defaultBranchRef` → add **Contents: Read**
- `repository.pullRequest.commits` → add **Contents: Read**
- `repository.vulnerabilityAlerts` → add **Security events: Read**

## Future Infrastructure Tasks

- [ ] Add dev/staging environment (separate RDS, Lambda, etc.) - currently prod-only to minimize costs
- [ ] Set up Google OAuth credentials and replace placeholders in GitHub secrets
- [ ] Set up Apple Sign In credentials
- [ ] Configure custom domain for CloudFront CDN
- [ ] Add RDS Proxy when Lambda concurrency causes connection issues
- [ ] Migrate from Vercel to OpenNext when costs justify
