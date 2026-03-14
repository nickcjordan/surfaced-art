# Infrastructure/DevOps Status Report — 2026-03-09

## Current State Summary

The infrastructure is fully provisioned across two environments (dev and prod) using Terraform with S3/DynamoDB state backend. All AWS resources are managed as code with separate state files per environment. The CI/CD pipeline is mature with automated deployments on push to `dev` and `main`, security scanning on every PR, and Slack notifications for deploys and AI code reviews. The primary gap is the absence of external uptime monitoring, no WAF protection, and secrets still stored as environment variables rather than a managed secret store.

## AWS Resource Inventory

| Resource | Purpose | Environment | Notes |
|---|---|---|---|
| **RDS PostgreSQL 16** (`db.t3.micro`) | Primary database | Both (separate instances) | 20GB gp3, auto-scaling to 100GB, encrypted, Performance Insights enabled, 7-day backup retention |
| **Lambda: API** (container, 256MB, 30s timeout) | Hono API handler | Both | VPC-attached, reserved concurrency: 40 (prod) / 10 (dev) |
| **Lambda: Migrate** (container) | Prisma migrate deploy + seed | Both | VPC-attached, invoked by CI/CD |
| **Lambda: Image Processor** (container) | Sharp WebP variant generation (400/800/1200px) | Both | NOT in VPC, triggered by S3 PutObject on uploads/*.jpg/.jpeg/.png |
| **API Gateway HTTP API** | API routing | Both | Throttle: 100 burst / 50 RPS, structured JSON access logging |
| **ECR Repositories** (x3 per env) | Container image storage | Both | api, migrate, image-processor; immutable tags, scan-on-push, lifecycle keeps last 10 images (5 for migrate) |
| **S3 Media Bucket** | Artwork images + WebP variants | Both | Versioning enabled, lifecycle: noncurrent to Glacier at 90d, expire at 365d, public access blocked, AES256 encryption |
| **CloudFront Distribution** | CDN for media assets | Both | OAC-based S3 access, PriceClass_100 (US/CA/EU), security headers (HSTS, X-Content-Type-Options, X-Frame-Options), default TTL 1 day, images TTL 1 week |
| **Cognito User Pool** | Authentication | Both | Email-based, Google OAuth (conditional), Apple Sign In (conditional, not yet configured), MFA off |
| **SES** | Transactional email | Both | Domain identity (surfacedart.com), DKIM, Mail From subdomain, configuration set with reputation metrics |
| **SNS Topic** | Alarm notifications | Both | Email subscription, KMS encrypted with AWS-managed key |
| **CloudWatch Log Groups** (x4) | Centralized logging | Both | API Lambda (30d), Image Processor (14d), Migrate Lambda (14d), API Gateway (30d) |
| **CloudWatch Alarms** (x5) | Automated alerting | Both | Lambda errors, Lambda P95 duration, RDS connections, RDS storage, API Gateway 5xx |
| **CloudWatch Dashboards** (x3) | Operational visibility | Both | Platform health (metrics), API logs, Image Processor logs |
| **IAM Roles** | Lambda execution, API Gateway logging | Both | Scoped policies for Lambda (S3, SES, Cognito, ECR, VPC, CloudWatch) |
| **Security Groups** | Network isolation | Both | Lambda SG (HTTPS out + PG to VPC), RDS SG (PG from Lambda SGs only) |
| **S3 Terraform State** | IaC state storage | Shared | `surfaced-art-terraform-state` bucket with DynamoDB locking |

**Prod-only resources:**
- S3 bucket: `surfaced-art-prod-media`, CloudFront: `dmfu4c7s6z2cc.cloudfront.net`
- RDS deletion protection enabled, final snapshot on delete

**Dev-only resources:**
- S3 bucket: `surfaced-art-dev-media`, CloudFront: `d2agn4aoo0e7ji.cloudfront.net`
- Cache-control headers disabled, seed mode = "demo", RDS deletion protection off

## CI/CD Pipeline Status

| Workflow | File | Trigger | Purpose |
|---|---|---|---|
| **CI** | `ci.yml` | PR to `dev` | Quality gates (build, typecheck, lint, test, integration tests) + conditional Terraform plan (dev) when `infrastructure/` changes |
| **Pull Request** | `pr.yml` | PR to `main` | Quality gates + integration tests + Terraform plan (prod) with PR comment. Visual QA jobs defined but currently disabled |
| **Deploy (dev)** | `deploy-dev.yml` | Push to `dev` | Full pipeline: build -> Terraform apply (dev) -> Docker build/validate/push x3 -> Lambda deploy x3 -> migrate -> seed -> health check -> Slack notify |
| **Deploy (prod)** | `deploy.yml` | Push to `main` | Full pipeline: build -> Terraform apply (prod) -> Docker build/validate/push x3 -> Lambda deploy x3 -> migrate -> health check -> AI-summarized Slack release notification |
| **Security Scan** | `security.yml` | PR to dev/main + weekly cron + manual | npm audit, Trivy FS, Trivy IaC, Semgrep. Posts findings as PR comment, fails on HIGH+ |
| **Auto-merge dev** | `auto-merge-dev.yml` | PR opened/reopened to `dev` | Enables squash auto-merge (skips Dependabot PRs) |
| **Dependabot Auto-merge** | `dependabot-auto-merge.yml` | Dependabot PRs | Handles Dependabot PR auto-merge |
| **AI Review Notify** | `ai-review-notify.yml` | PR review submitted | Posts Sourcery/Greptile AI review digests to Slack |
| **Label PRs** | `labeler.yml` | PR opened/synced | Auto-labels PRs based on changed file paths |
| **Seed Images** | `seed-images.yml` | Manual dispatch | Downloads images from Notion, uploads to S3 (supports per-artist, dry-run, overwrite) |
| **Integration Tests** | `integration-tests.yml` | Manual dispatch | Standalone integration test run on any branch |

**Notable CI features:**
- Container validation step for all 3 Lambdas (checks file layout, Prisma WASM chunks, Sharp smoke test)
- ECR bootstrap logic handles first-deploy scenario (pushes placeholder image if repo is empty)
- Concurrency groups prevent parallel deploys; `cancel-in-progress: false` for deploys
- Slack notifications to 3 channels: `#releases` (AI-summarized prod deploys), `#actions` (failures), `#ai-code-review` (bot review digests)
- Turborepo remote caching enabled (`TURBO_TOKEN` / `TURBO_TEAM`)

**Gaps:**
- Visual QA (Playwright) jobs are commented out in `pr.yml` -- disabled because "UI is still in flux"
- Dev deploy uses `actions/upload-artifact@v6` while prod uses `@v7` -- minor version skew
- No automated rollback on failed health check
- No Terraform plan preview for dev PRs unless `infrastructure/` files change (prod PR always runs plan)

## Environment Parity

| Dimension | Dev | Prod | Parity |
|---|---|---|---|
| Terraform modules | Same | Same | Full parity |
| RDS instance class | db.t3.micro | db.t3.micro | Identical |
| Lambda memory | 256MB | 256MB | Identical |
| Lambda concurrency | 10 | 40 | Intentionally different |
| Seed data | Demo (24 AI artists) | Real (3 artists) | Intentionally different |
| Cache headers | Disabled | Enabled | Intentionally different |
| Frontend URL | dev.surfacedart.com | surfacedart.com | Separate domains |
| CloudFront domain | d2agn4aoo0e7ji | dmfu4c7s6z2cc | Separate distributions |
| Deletion protection | Off | On | Intentionally different |
| Deploy pipeline | Push to `dev` | Push to `main` | Parallel pipelines |
| DB seeding on deploy | Yes (automatic) | No | Dev reseeds every deploy |
| Slack notifications | `#actions` only | `#releases` + `#actions` | Prod gets richer notifications |

**Good:** Both environments use the same Terraform modules with separate `.tfvars` and state files. Infrastructure drift between environments is structurally prevented.

## Monitoring & Observability

### What IS monitored:
- **Lambda errors** — alarm fires on >5 errors in two consecutive 5-min periods
- **Lambda P95 duration** — alarm at 80% of timeout (24s) over 3 periods
- **RDS connections** — alarm at 80 connections (limit ~87 for db.t3.micro)
- **RDS free storage** — alarm below 2GB, `treat_missing_data = breaching`
- **API Gateway 5xx** — alarm on >5 errors in two consecutive 5-min periods
- **CloudWatch Dashboards** — platform health metrics + log viewer dashboards for API and Image Processor
- **API Gateway access logs** — structured JSON with request ID, IP, method, path, status, latency
- **RDS Performance Insights** — enabled (free tier, 7-day retention)
- **ECR scan-on-push** — container vulnerability scanning on every image push

### What is NOT monitored:
- **No external uptime monitoring** — if AWS is down, CloudWatch alarms are also down (SUR-169, backlog/blocked)
- **No CloudFront monitoring** — cache hit ratio, 5xx errors not alarmed (SUR-171, backlog/blocked)
- **No Cognito monitoring** — failed sign-in attempts not tracked (SUR-171, backlog/blocked)
- **No SES monitoring** — bounce rate, complaint rate not alarmed (SUR-171, backlog/blocked)
- **No AWS Budget alarm** — no cost alerting (SUR-169, backlog/blocked)
- **No application-level structured logging** — Lambda logs are console.log output, not structured JSON with trace IDs
- **No distributed tracing** (X-Ray or similar)
- **No status page** — deferred to post-launch

### Alerting:
- All alarms route to a single SNS topic with email subscription
- Recovery notifications enabled (OK state also triggers)
- No Slack integration for alarms (mentioned as future via AWS Chatbot)
- No PagerDuty/OpsGenie escalation (solo CTO, deferred)

## Cost Considerations

**Fixed monthly costs (estimated):**
- RDS db.t3.micro x2 (dev + prod): ~$30/month
- CloudFront PriceClass_100 x2: minimal at current traffic
- S3 storage: minimal (seed images only)
- SES: $0 under free tier
- Cognito: $0 under free tier
- CloudWatch dashboards (3 per env = 6 total): $18/month (first 3 free per account)
- Total estimated: ~$50-60/month

**Cost controls in place:**
- ECR lifecycle policies (keep last 10 images)
- CloudWatch log retention policies (14-30 days, not infinite)
- S3 lifecycle rules (noncurrent to Glacier at 90d, expire at 365d)
- Abort incomplete multipart uploads after 7 days
- RDS auto-scaling storage (starts at 20GB, max 100GB)
- CloudFront PriceClass_100 (cheapest tier)
- AES256 encryption instead of KMS CMK (avoids per-key cost)

**Cost risks:**
- Running two full environments doubles RDS cost
- No AWS Budget alarm configured (SUR-169)
- WAF would add ~$5+/month per WebACL (deferred, SUR-162)
- CloudWatch dashboards above free tier at 6 total

## Deployment Process

### Feature to Production path:
1. Developer creates feature branch from `dev`
2. Opens PR to `dev` -- triggers CI (quality gates + security scan + conditional TF plan)
3. Auto-merge squashes to `dev` when CI passes
4. Push to `dev` triggers `deploy-dev.yml`:
   - Build & test
   - Terraform apply (dev environment)
   - Docker build, validate, push for 3 Lambdas
   - Deploy Lambda code updates
   - Run migrations + seed
   - Health check
   - Slack notification
5. Human opens PR from `dev` to `main` -- triggers `pr.yml` (quality gates + TF plan prod)
6. Human merges (regular merge commit, NOT squash)
7. Push to `main` triggers `deploy.yml`:
   - Same pipeline as dev minus seeding
   - AI-generated release summary to Slack `#releases`

### Manual steps:
- `dev` to `main` merge is always manual (human review)
- SNS email subscription confirmation (one-time)
- SES domain verification DNS records (one-time)
- Google OAuth credentials setup (not yet done)
- Apple Sign In credentials setup (not yet done)

### Rollback capability:
- **Lambda:** Previous ECR image tags available; manual `aws lambda update-function-code` to roll back
- **Database:** Prisma migrations are forward-only; rollback requires manual SQL
- **Terraform:** State versioned in S3; can roll back state file versions
- **Vercel (frontend):** Built-in deployment rollback via Vercel dashboard
- **No automated rollback** on failed health check -- pipeline fails but does not revert

## Key Findings

**What is working well:**
- Infrastructure is fully codified in Terraform with no manual AWS console resources
- Two-environment setup (dev/prod) with separate state files prevents cross-environment contamination
- CI/CD pipeline is comprehensive: build, test, lint, typecheck, security scan, Terraform plan, deploy, validate, health check
- Container validation step catches broken Docker images before deployment
- ECR bootstrap logic handles first-deploy gracefully
- Auto-merge for feature-to-dev PRs eliminates manual merge toil
- Security scanning (npm audit + Trivy + Semgrep) runs on every PR and weekly
- Slack integration provides visibility into deployments and AI code reviews
- S3 versioning + lifecycle rules protect against accidental data loss
- CloudWatch alarms cover the most critical failure modes

**What needs attention:**
- No external uptime monitoring -- all monitoring depends on AWS being healthy
- No WAF protection on API Gateway or CloudFront
- Secrets stored as Lambda env vars and GitHub Actions secrets (not rotatable, no audit trail)
- No automated rollback mechanism
- Visual QA pipeline disabled
- RDS backup retention at AWS default (7 days) -- SUR-165 wants 14+ days
- No Terraform state recovery plan documented (SUR-168)
- CORS on S3 allows all origins (`"*"`) -- comment says "Restrict in production" but not done
- CloudFront using default SSL certificate (no custom domain)
- No CloudFront access logging (deferred)

## Gaps & Concerns

### Security gaps:
- **No AWS WAF** -- API Gateway and CloudFront have no edge-level DDoS/bot protection (SUR-162, ready)
- **Secrets in env vars** -- DATABASE_URL, Stripe keys, Cognito secrets in plaintext Lambda env vars (SUR-163, blocked)
- **S3 CORS wildcard** -- `allowed_origins = ["*"]` in S3 CORS config, should be restricted to frontend URLs
- **No IAM DB auth** -- deferred to Phase 3 (Trivy ignore in place)

### Reliability gaps:
- **No external uptime monitor** -- single point of failure for alerting (SUR-169, blocked)
- **No automated rollback** -- failed deploys leave broken state
- **No incident response runbooks** -- SUR-74 (backlog, parent issue with sub-tasks)
- **No Terraform state recovery docs** -- SUR-168 (backlog, ready)
- **RDS backup not verified** -- SUR-165 wants tested PITR and increased retention

### Scaling gaps:
- **db.t3.micro** in both environments -- adequate now but will need upgrade before real traffic
- **No RDS Proxy** -- deferred until CloudWatch shows connection exhaustion
- **API concurrency cap at 40 (prod)** -- each instance holds 1 DB connection; ~half of RDS max_connections
- **No CDN caching for API responses** -- all requests hit Lambda

### Observability gaps:
- **No structured application logging** -- console.log only, no trace IDs or structured fields
- **No CloudFront/Cognito/SES alarms** -- SUR-171 (blocked)
- **No distributed tracing** -- no X-Ray or equivalent
- **No cost alerting** -- no AWS Budget alarm

## Unplanned Work Discovered

1. **S3 CORS wildcard in production** -- `allowed_origins = ["*"]` should be restricted to the frontend URL. This is a minor security issue that should be a quick Terraform fix.

2. **Version skew in deploy-dev.yml** -- uses `actions/upload-artifact@v6` while deploy.yml (prod) uses `@v7`. Should be aligned.

3. **Terraform version 1.5** -- both deploy workflows pin Terraform to `1.5`. Current stable is likely higher. Worth checking if newer versions offer benefits or if this is intentionally pinned for stability.

4. **`hashicorp/setup-terraform` version skew** -- deploy-dev.yml uses `@v3`, deploy.yml and ci.yml use `@v4`. Should be aligned.

5. **`actions/github-script` version skew** -- deploy-dev.yml uses `@v7` in some steps while deploy.yml uses `@v8`. Should be aligned.

6. **No `dependabot.yml`** for GitHub Actions version updates -- action versions are managed manually, leading to the skews noted above.

## Open Linear Issues (Infrastructure)

| ID | Title | Status | Labels |
|---|---|---|---|
| SUR-162 | AWS WAF managed rules on API Gateway and CloudFront | Backlog (ready) | security |
| SUR-163 | Migrate secrets to AWS Secrets Manager / SSM | Backlog (blocked) | security |
| SUR-165 | Verify RDS backup config and write DR runbook | Backlog (ready) | operations |
| SUR-168 | Terraform state recovery plan | Backlog (ready) | operations |
| SUR-169 | Synthetic uptime monitoring and AWS budget alarm | Backlog (blocked) | observability |
| SUR-171 | CloudFront, Cognito, and SES monitoring alarms | Backlog (blocked) | observability |
| SUR-184 | Feature flags strategy decision (ADR) | Backlog (ready) | infrastructure |
| SUR-64 | Security hardening & API protection (parent) | Backlog | security, parent-issue |
| SUR-74 | Incident response & operational readiness (parent) | Backlog | operations, parent-issue |
