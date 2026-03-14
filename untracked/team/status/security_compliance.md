# Security/Compliance Status Report — 2026-03-09

## Current State Summary

Security infrastructure is well-architected for a pre-launch platform. Authentication (Cognito + JWT validation), RBAC, API hardening (CORS, rate limiting, security headers), and automated security scanning are all in place. Legal pages (ToS, Privacy Policy) are live. The main gaps are: no frontend auth UI yet (admin API is backend-only), secrets still in env vars (not Secrets Manager), MFA disabled on Cognito, missing artist agreement and DMCA pages, and S3 CORS set to wildcard origins in production.

## Authentication & Authorization

### Cognito User Pool (Terraform-managed)
- **Password policy**: min 8 chars, uppercase + lowercase + numbers required, symbols not required
- **MFA**: OFF — not yet enabled. This is a gap before real user traffic.
- **Username**: email-based sign-in with auto-verified email
- **OAuth providers**: Google and Apple conditionally configured (placeholders — credentials not yet set up)
- **Token expiry**: Access/ID tokens 60 minutes, refresh token 30 days
- **Auth flows**: `ALLOW_REFRESH_TOKEN_AUTH`, `ALLOW_USER_SRP_AUTH` (no `USER_PASSWORD_AUTH` — good)
- **User existence errors**: prevented (`prevent_user_existence_errors = "ENABLED"`)
- **Callback URLs**: Production frontend + localhost:3000 for dev

### JWT Validation Middleware (`apps/api/src/middleware/auth.ts`)
- Uses `aws-jwt-verify` library for Cognito JWT verification (id token)
- Bearer token extraction from Authorization header
- Auto-provisioning: first authenticated request creates user record + buyer role in a transaction
- Proper 401 responses for missing/invalid tokens
- Structured error logging on verification failure

### RBAC Implementation
- **Roles**: buyer, artist, admin (stored in `user_roles` join table)
- `requireRole(role)` middleware — single role check
- `requireAnyRole(roles)` middleware — any-of check
- Admin routes (`/admin/*`) are protected with `authMiddleware` + `requireRole('admin')`
- Upload routes require `artist` or `admin` role
- Role grant/revoke safety: admin cannot self-grant admin, cannot remove own admin role
- Admin bootstrap: CLI seed script to grant first admin role via direct DB insert

### Session Management
- Stateless JWT-based — no server-side sessions
- Tokens stored client-side (Cognito SDK handles this)
- Frontend auth UI built (sign-in, sign-up, password reset) — SUR-83, Done

### Planned but Not Built
- SUR-195 (Backlog): `/auth/me` endpoint + role-aware auth on frontend + admin route guard — needed for admin UI
- SUR-10 (Ready): Admin user impersonation with short-lived signed JWT — currently read-only impersonation exists (SUR-151, Done) but full impersonation with session token is not built
- SUR-171 (Backlog): Cognito failed sign-in monitoring alarms

## API Security

### CORS Configuration
- **API Gateway (Terraform)**: Origins restricted to `FRONTEND_URL`, www variant, and localhost:3000
- **Hono middleware (application-level)**: Same origin list + wildcard `*.vercel.app` for preview deploys
- Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Credentials: enabled
- Max age: 300 seconds
- **Note**: The `*.vercel.app` wildcard in application CORS could theoretically allow requests from any Vercel-hosted app. This is acceptable for preview deploys but worth monitoring.

### Rate Limiting
- In-memory per-Lambda-instance rate limiting (defense-in-depth alongside API Gateway throttling)
- **API Gateway level**: burst limit 100, sustained 50 req/sec
- **Application level** (per-IP sliding window):
  - `/waitlist`: 5 req/min
  - `/artists/apply`: 5 req/min
  - `/uploads/*`: 10 req/min
  - `/me/*`: 20 req/min
  - `/admin/*`: 20 req/min
  - `/search`: 30 req/min
  - `/webhooks/*`: 30 req/min
- Rate limit headers exposed: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`

### Security Headers (`apps/api/src/middleware/security-headers.ts`)
- `Strict-Transport-Security`: max-age=63072000; includeSubDomains; preload
- `X-Content-Type-Options`: nosniff
- `X-Frame-Options`: DENY
- `X-XSS-Protection`: 0 (correctly disabled — modern best practice)
- `Referrer-Policy`: strict-origin-when-cross-origin
- `Permissions-Policy`: camera=(), microphone=(), geolocation=()
- `Content-Security-Policy`: default-src 'none'; frame-ancestors 'none'
- CloudFront also applies its own security headers policy (HSTS, X-Content-Type-Options, X-Frame-Options, referrer policy)

### Input Validation
- **Zod validation** on all write endpoints (waitlist, applications, uploads, admin operations, search)
- Standardized error responses via `errors.ts` (400, 401, 403, 404, 409, 500)
- Prisma ORM prevents SQL injection (parameterized queries)
- Email normalization (trim + lowercase) on waitlist signup
- Privacy-safe duplicate handling: waitlist returns same success message for new and existing emails
- File upload validation: content type whitelist, file size limits via presigned POST conditions, key prefix scoping per user

### Error Handling
- Global error handler catches unhandled exceptions, returns generic 500 (no stack trace leakage)
- Structured logging with `@surfaced-art/utils` logger
- Separate 404 handler for unknown routes

### Webhook Security
- Stripe webhook signature verification using `stripe.webhooks.constructEvent`
- Rejects requests with missing or invalid `stripe-signature` header
- `STRIPE_WEBHOOK_SECRET` validated at startup

### Revalidation Endpoint
- Protected by `REVALIDATION_SECRET` Bearer token
- Input validation on body structure (paths, type, slug, etc.)
- Category slugs validated against `CATEGORIES` constant

## Data Protection

### Encryption at Rest
- **RDS**: `storage_encrypted = true` (AES-256)
- **S3**: Server-side encryption with AES-256 (SSE-S3). Trivy finding AVD-AWS-0132 (CMK) explicitly deferred — AES256 sufficient pre-launch.
- **S3 versioning**: Enabled with lifecycle rules (noncurrent versions to Glacier at 90 days, deleted at 365 days)

### Encryption in Transit
- **RDS**: TLS enforced via `buildSslConfig()` in `packages/db/src/index.ts`. Full certificate verification by default using `NODE_EXTRA_CA_CERTS=/var/runtime/ca-cert.pem`
- **CloudFront**: `viewer_protocol_policy = "redirect-to-https"`
- **API Gateway**: HTTPS-only by default (HTTP API type)
- **HSTS**: Enabled with preload on both API and CDN

### Network Security
- **RDS**: `publicly_accessible = false`, in private VPC subnets
- **RDS Security Group**: Ingress only from Lambda security groups on port 5432, no egress rules
- **Lambda Security Group**: Egress HTTPS to 0.0.0.0/0 (for AWS service endpoints), PostgreSQL egress scoped to VPC CIDR only
- **Lambda concurrency**: Capped at `reserved_concurrent_executions` to prevent DB connection exhaustion

### PII Handling
- Email addresses collected for waitlist, user accounts
- No raw credit card data stored (Stripe handles this)
- Artist profile data (bio, location, social links) stored in DB
- Shipping addresses will be stored for orders (Phase 4)
- Structured logging omits email from waitlist signup logs (logs only duration)

### Backup Strategy
- **RDS backups**: 7-day retention, daily backup window 03:00-04:00 UTC
- **S3 versioning**: Enabled — accidental deletes are recoverable
- **Final snapshot**: Enabled for prod environment on RDS deletion
- **Deletion protection**: Enabled for prod environment

## Payment Security (PCI)

### Current State
- **Stripe integration**: Stripe SDK configured with pinned API version (`2026-02-25.clover`)
- **Stripe Connect**: `account.updated` webhook handler processes artist onboarding status
- **No direct card handling**: All payment data flows through Stripe — the platform never sees raw card numbers
- **PCI SAQ-A eligible**: By using Stripe Elements/Checkout, the platform falls under the lightest PCI self-assessment category

### Planned
- SUR-174 (Backlog, Phase 4): Refund/dispute policies and data deletion workflow
- Stripe Connect for artist payouts (70/30 split) — foundation exists but checkout flow not built

### Gaps
- No `STRIPE_SECRET_KEY` rotation process documented
- Stripe webhook secret stored as Lambda env var (not Secrets Manager) — see Secrets Management below

## Legal Documents Status

| Document | Status | Location | Notes |
|----------|--------|----------|-------|
| Terms of Service | **Live** | `/terms` page | Covers eligibility, account responsibilities, 30% commission, prohibited conduct, IP, disputes, liability. Last updated March 2026. |
| Privacy Policy | **Live** | `/privacy` page | Covers data collection, third-party services (Stripe, PostHog, AWS, Vercel), cookies, retention, rights. GDPR-aware. |
| Artist Agreement | **Not built** | SUR-173 (Backlog, blocked) | Needed before Phase 3 (accepting real artists). Separate from buyer ToS. |
| DMCA Policy | **Drafted in Notion** | `Surfaced_Art_DMCA_Policy_v1_0` | Document exists in Notion but no `/dmca` page exists in the frontend. |
| Content Guidelines | **Drafted in Notion** | `Surfaced_Art_Content_Guidelines_v1_0` | Document exists in Notion but no frontend page. |
| Refund/Dispute Policy | **Not started** | SUR-174 (Backlog, Phase 4) | Needed before real transactions. |
| Data Retention Policy | **Not started** | SUR-167 (Backlog) | ADR needed for soft-delete strategy. |
| Cookie Policy | **Not needed** | — | Using Plausible-compatible PostHog, no cookies per SUR-97. Privacy page covers cookie disclosure. |

### Legal Review Status
- ToS and Privacy Policy are COO-drafted, marked for attorney review in Notion (`Legal & Compliance` page)
- No indication attorney review has been completed

## Content Moderation

### Current Capabilities
- **Artist vetting**: Application-based admission (application submission, admin review, approve/reject)
- **Artist suspension**: Admin can suspend/unsuspend artists (hides profile and listings)
- **Listing moderation**: Admin can hide/unhide listings via `hidden` status
- **Admin audit log**: All admin actions logged to `AdminAuditLog` table with admin ID, action type, target, timestamp, IP

### Planned Capabilities
- SUR-185 (Backlog, ready): Content guidelines document and DMCA takedown procedure — document-writing task
- SUR-186 (Backlog, blocked, Phase 4): Listing report mechanism (buyer-side) and content screening on listing creation
- SUR-8 (Ready): Admin review moderation — list, detail, soft-delete reviews

### Policy Documents
- Content guidelines and DMCA policy drafted in Notion but not published to the platform
- No automated content screening (e.g., image moderation, text filtering)

## Security Scanning

### CI/CD Pipeline (`.github/workflows/security.yml`)
- **Triggers**: Every PR to dev/main, weekly scheduled (Sunday midnight), manual dispatch
- **Scanners**:
  - `npm audit` at HIGH+ severity
  - Trivy filesystem scan (CRITICAL, HIGH, MEDIUM) with `.trivyignore` for known false positives
  - Trivy IaC scan on `infrastructure/terraform/`
  - Semgrep with rulesets: default, typescript, nodejs, security-audit, secrets
- **Reporting**: Automated PR comments with scan results table + expandable details
- **Gating**: Job fails if HIGH+ findings detected (blocks merge)
- **Known suppressions** in `.trivyignore`: 5 CVEs from `@prisma/dev` pinned hono dependency (not production code)

### Local Security Scanning (`scripts/security-scan.cjs`)
- `npm run security:scan` — runs all scanners
- Individual commands: `security:npm`, `security:trivy`, `security:semgrep`, `security:dependabot`, `security:pr-reviews`
- Reports saved to `.security-reports/` directory

### Dependency Management
- Dependabot alerts accessible via `security:dependabot` script
- PR bot reviews (Sourcery etc.) captured via `security:pr-reviews`
- `.trivyignore` documents known third-party pinned dependency issues

### IaC Security
- Trivy IaC scan on Terraform configs
- Known deferred findings documented with inline `trivy:ignore` comments:
  - AVD-AWS-0176: IAM DB auth deferred to Phase 3
  - AVD-AWS-0177: Deletion protection conditionally enabled
  - AVD-AWS-0132: CMK encryption deferred (AES256 sufficient pre-launch)
  - AVD-AWS-0104: Lambda egress to 0.0.0.0/0:443 (required for AWS API calls)
  - AVD-AWS-0011: CloudFront WAF deferred to Phase 3
  - AVD-AWS-0010: CloudFront access logging deferred to Phase 3

## Key Findings

### What's Working Well
- **Authentication stack is solid**: Cognito + `aws-jwt-verify` + role middleware is a proper implementation, not a shortcut
- **Defense in depth on rate limiting**: API Gateway throttling + per-Lambda-instance in-memory rate limiter
- **Security headers are comprehensive**: Both API middleware and CloudFront apply security headers
- **Audit trail infrastructure**: AdminAuditLog table + structured logging gives accountability for admin actions
- **Input validation is consistent**: Zod schemas on every write endpoint, Prisma parameterized queries
- **CI security gating**: PRs cannot merge with HIGH+ findings
- **Network isolation**: RDS fully private, Lambda VPC-scoped PostgreSQL egress
- **Privacy-conscious design**: Waitlist hides duplicate status, PostHog cookieless, no raw card storage

### What Needs Attention
- **S3 CORS wildcard**: `allowed_origins = ["*"]` on the media bucket is a production TODO (comment says "Restrict in production" but hasn't been done)
- **MFA disabled**: Cognito `mfa_configuration = "OFF"` — should be at least optional before real users
- **Secrets in env vars**: DATABASE_URL, Stripe keys, Cognito IDs all stored as Lambda env vars — visible in AWS console
- **No frontend admin auth**: Admin API has full RBAC but there's no admin UI — all admin actions require Bruno/curl
- **Legal review pending**: ToS and Privacy Policy drafted but no confirmation of attorney review
- **DMCA and content guidelines not published**: Documents drafted in Notion but not on the platform

## Gaps & Concerns

### Critical (address before public launch)
1. **S3 CORS `allowed_origins: ["*"]`** — allows any origin to upload to the media bucket. Must be restricted to the production frontend URL.
2. **Secrets management** (SUR-163, Backlog) — all secrets in Lambda env vars. Visible in AWS Console to anyone with Lambda:GetFunctionConfiguration. Should migrate to Secrets Manager or SSM Parameter Store before handling real user data.
3. **MFA not available** — Cognito MFA is OFF. At minimum, offer optional TOTP MFA for admin accounts before they manage real artist data.
4. **DMCA page missing from frontend** — the policy exists in Notion but there's no `/dmca` route. For a platform hosting user-generated content, a published DMCA policy is a legal requirement under 17 USC 512.

### High (address before accepting real artists)
5. **Artist agreement not built** (SUR-173) — artists need terms covering commission, content ownership, shipping obligations before onboarding
6. **Content guidelines not published** — no `/content-guidelines` page, meaning artists have no reference for what's allowed
7. **No CloudFront WAF** — deferred to Phase 3 but should be revisited as the site takes real traffic. Basic rate limiting and bot detection at the CDN edge.
8. **IAM DB authentication disabled** — Trivy finding AVD-AWS-0176, deferred to Phase 3. Password auth on RDS means the DATABASE_URL secret is a single point of compromise.

### Medium (address before transactions)
9. **Data retention policy not formalized** (SUR-167) — privacy policy states retention periods but no technical enforcement exists
10. **No data deletion workflow** (SUR-174) — privacy policy promises deletion rights but no mechanism to fulfill them
11. **Refund/dispute policy missing** (SUR-174) — needed before checkout flow
12. **No Cognito failed sign-in monitoring** (SUR-171) — can't detect brute force attempts
13. **Google and Apple OAuth not configured** — placeholder credentials. Users can only use email/password auth.
14. **CloudFront access logging disabled** — no CDN request logs for forensic analysis

## Unplanned Work Discovered

The following security/compliance needs are not tracked in any Linear issue:

1. **S3 CORS origin restriction** — The `allowed_origins = ["*"]` in `infrastructure/terraform/modules/s3-cloudfront/main.tf` line 76 is a known TODO in a code comment but has no Linear issue tracking its resolution.

2. **Cognito MFA enablement** — No issue exists for enabling MFA (even optionally) on Cognito. The current config has `mfa_configuration = "OFF"`.

3. **Attorney review tracking** — ToS and Privacy Policy are drafted but there's no tracked task for legal counsel review. This is a COO responsibility but should be tracked.

4. **DMCA/Content Guidelines frontend pages** — The documents exist in Notion (v1.0 drafts updated 2026-03-09) but there's no issue for creating the frontend pages at `/dmca` and `/content-guidelines`. SUR-185 tracks the document drafting but not the page creation.

5. **Secret rotation procedures** — No documented process for rotating Stripe keys, Cognito secrets, database passwords, or the revalidation secret. No issue tracks this.

6. **Admin account MFA requirement** — Even if general MFA is optional, admin accounts should arguably require MFA given their access to user data, artist management, and impersonation capabilities. No issue exists for this.

7. **Rate limiting on public read endpoints** — `/artists`, `/listings`, `/categories`, `/tags` have no application-level rate limiting. API Gateway throttling applies but a targeted scraping attack on these endpoints has no per-IP defense beyond the gateway's global limit.

8. **Vercel preview deploy CORS wildcard** — The application CORS allows any `*.vercel.app` origin. A malicious app deployed on Vercel could make credentialed cross-origin requests to the API. This is a low risk but should be narrowed to the team's Vercel scope if possible.
