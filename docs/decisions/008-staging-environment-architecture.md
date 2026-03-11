# ADR 008: Dev/Staging Environment Architecture

**Status**: Accepted
**Date**: 2026-03-02
**Issue**: #188

---

## Context

Phase 3 introduces Cognito auth, Stripe Connect, and the artist dashboard — features that
require safe end-to-end testing before they touch production. The project had no staging
environment: every deploy went directly to prod (surfaced.art).

The Terraform infrastructure was already parameterized with `var.environment`, and separate
`prod.tfvars` / `dev.tfvars` files already existed. The gaps were:

1. Hardcoded `surfaced.art` domain references throughout application code (wrong domain anyway —
   the correct domain is `surfaced.art`).
2. Silent env var fallbacks that masked missing configuration in new environments.
3. No GitHub Actions deploy workflow for dev.
4. No mechanism to surface AI code review suggestions (Greptile, Sourcery) to the team.

---

## Decision

### 1. Domain: surfaced.art

The project uses `surfaced.art`, not `surfaced.art`. All hardcoded references to
`surfaced.art` were bugs. This PR fixes them:

- `SITE_URL`: `https://surfaced.art` (prod), `https://dev.surfaced.art` (dev)
- Cognito Hosted UI: `surfaced-art-{env}.auth.us-east-1.amazoncognito.com` (unchanged — was correct)
- `www` redirect: handled at DNS/CDN level, removed from API CORS and Lambda-level allowed origins

### 2. Required env vars, no fallbacks

Every environment-specific value throws if absent:

```ts
if (!process.env.NEXT_PUBLIC_SITE_URL) throw new Error('NEXT_PUBLIC_SITE_URL is required')
if (!process.env.NEXT_PUBLIC_API_URL) throw new Error('NEXT_PUBLIC_API_URL is required')
if (!process.env.FRONTEND_URL) throw new Error('FRONTEND_URL is required')
```

**Why**: Silent fallbacks (e.g. `?? 'https://api.surfaced.art'`) mean misconfigured deployments
silently point at the wrong environment. With required vars, a missing var produces an immediate,
obvious build failure rather than subtle wrong-environment bugs in production.

### 3. Dev environment infrastructure

Separate AWS resources for dev, sharing the same AWS account and IAM user as prod:

| Resource | Dev name |
|---|---|
| RDS | `surfaced-art-dev-db` (db.t3.micro) |
| API Lambda | `surfaced-art-dev-api` |
| Migrate Lambda | `surfaced-art-dev-migrate` |
| Image Processor Lambda | `surfaced-art-dev-image-processor` |
| API Gateway | `surfaced-art-dev-api` |
| Cognito User Pool | `surfaced-art-dev-users` |
| S3 bucket | `surfaced-art-dev-media` (pre-existing) |
| CloudFront | `d2agn4aoo0e7ji.cloudfront.net` (pre-existing) |

Terraform state: `dev/terraform.tfstate` (separate key from `prod/terraform.tfstate`).

Estimated additional cost: ~$18–22/month (RDS ~$15, Lambda/API Gateway ~$3–7).

### 4. Dev deploy pipeline: deploy-dev.yml

Triggered on push to `dev` branch. Full pipeline:

```
build-and-test → terraform → deploy-lambdas → migrate-database → seed-database → verify → notify
```

Key addition vs prod: `seed-database` step — invokes the migrate Lambda with
`{"command":"seed"}` after migrations. The seed script (`seed-safe.ts`) is idempotent
(uses upsert), so repeated runs on an already-seeded database are harmless.

### 5. AI review notifications: ai-review-notify.yml

Triggered by `pull_request_review` event (fires once per bot review submission, not per comment).

**Why `pull_request_review` not `pull_request_review_comment`**: Gives one Slack message per
bot per PR instead of one per comment. Bots (Greptile, Sourcery) typically submit a single
review with all comments attached.

**Why independent from deploy**: The `pull_request_review` event fires whether the PR is open
or merged. Bots that finish reviewing after a PR is merged still trigger Slack. The two
workflows share no dependencies and never coordinate.

Severity parsing:
- **Sourcery**: Uses `**{type} ({category}):**` structured format — extract type/category directly
- **Greptile**: Free-form prose — keyword-based detection (critical, high, medium, low, suggestion)

All suggestions (any severity) go to `#ai-code-review`. The team does periodic batch
cleanups using `/fix-pr-review` rather than blocking deploys on AI review completion.

### 6. Terraform plan on PRs: ci.yml addition

A `terraform-plan-dev` job runs on PRs to `dev` when `infrastructure/` files change.
Posts the plan as a collapsible PR comment so infrastructure changes are visible in review.

### 7. Config reference files

`config/dev.env-reference` and `config/prod.env-reference` are non-secret, checked-in
reference documents that map variable names to their sources (Terraform outputs, generated
secrets, etc.). They make onboarding and secret rotation explicit without storing actual secrets.

---

## Consequences

### Positive

- Dev environment allows safe testing of auth, Stripe, and dashboard before prod exposure
- Missing env vars fail fast and loudly at build time rather than silently at runtime
- AI code review suggestions are captured in Slack regardless of when bots finish reviewing
- Terraform plan is visible in PR review before applying to dev infra
- Domain is now correct across all code (surfaced.art, not surfaced.art)

### Negative / Trade-offs

- ~$18–22/month additional AWS cost for dev RDS
- Vercel prod project requires `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_API_URL` to be set
  before this PR deploys to prod — these vars must be added before merging (see Step 2 in
  the PR description)
- Dev Cognito Hosted UI domain (`surfaced-art-dev.auth...`) requires separate Google OAuth
  client configuration when enabling Sign In with Google for dev

### Not chosen: automated AI suggestion application in CI

Initial design included a CI job that would apply Greptile/Sourcery suggestions automatically
using Claude Code. This was rejected because:

1. Claude Code Max (the subscription plan) requires an OAuth browser session — no API key mode
2. Even with API key, `claude --print` on a GitHub Actions runner operates on an ephemeral VM,
   not the developer's local checkout
3. The auto-fix pattern is brittle: it can introduce regressions if applied without human judgment

The chosen approach (Slack digest + manual `/fix-pr-review`) gives the team full control over
which suggestions to apply.
