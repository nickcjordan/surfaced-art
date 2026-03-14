# Infrastructure/DevOps Stage Plan — 2026-03-09

## Alpha

**Purpose reminder:** Internal/friends-only testing. Core browsing works. Known bugs acceptable. No public access.

### Must Complete

1. **Fix S3 CORS wildcard in production** — Change `allowed_origins = ["*"]` to the actual frontend URLs (`surfacedart.com`, `www.surfacedart.com`, `dev.surfacedart.com`, `localhost:3000`). This is a one-line Terraform change in `infrastructure/terraform/modules/s3-cloudfront/main.tf` but it is currently a security gap that allows any origin to interact with the media bucket. Discovered during status report (not tracked in Linear — needs a new issue).

2. **AWS Budget alarm** (SUR-169, partial) — Set up a simple AWS Budgets alarm at $75/month threshold with SNS email notification. Prevents cost surprises during the testing phase. This is the lowest-effort part of SUR-169.

3. **Align CI action version skew** — Standardize `actions/upload-artifact`, `hashicorp/setup-terraform`, and `actions/github-script` versions across `deploy-dev.yml` and `deploy.yml`. Discovered during status report (no Linear issue). Prevents subtle CI inconsistencies.

4. **Enable Visual QA pipeline** — Uncomment the Playwright visual QA jobs in `pr.yml`. These are already written but disabled. Alpha is the right time to activate them since the UI will stabilize enough to screenshot.

5. **Add Dependabot config for GitHub Actions** — Create `.github/dependabot.yml` to auto-update action versions. Prevents the version skew problem from recurring.

### Exit Criteria

- S3 CORS restricted to known frontend origins (verified by `terraform plan` showing no diff after apply)
- Budget alarm fires a test notification to the SNS email
- All CI workflows use consistent action versions
- Visual QA screenshots are generated on PRs (even if not yet gated)
- `deploy-dev.yml` and `deploy.yml` produce identical behavior for shared steps

### Dependencies

- None — all work is self-contained within infra/DevOps

### Risks

- **Low risk.** All items are small, isolated Terraform or CI changes. The S3 CORS fix could theoretically break a preview deploy if the Vercel preview URL isn't in the allow list, but the API CORS already handles `*.vercel.app` separately.

---

## Beta (Closed)

**Purpose reminder:** 10-25 hand-picked artists invited. Profiles must look professional. Buyers can browse.

### Must Complete

1. **Google OAuth credentials setup** — Configure real Google OAuth client ID/secret in Cognito. Currently placeholder values. Required so artists can sign in with Google rather than email/password only. Depends on COO creating the Google Cloud project and OAuth consent screen.

2. **Custom CloudFront domain** — Attach `cdn.surfacedart.com` (or `media.surfacedart.com`) to the prod CloudFront distribution with an ACM certificate. Currently using the default `d*.cloudfront.net` domain, which looks unprofessional in image URLs that artists might inspect. Terraform change in the CloudFront module.

3. **Cognito MFA — optional TOTP** — Change `mfa_configuration` from `"OFF"` to `"OPTIONAL"` and enable TOTP software token. At minimum, admin accounts should use MFA before managing real artist data. Discovered during status report (no Linear issue — needs one). The frontend auth UI (SUR-83, Done) may need an MFA setup flow added.

4. **RDS backup retention increase** (SUR-165, partial) — Increase prod backup retention from 7 to 14 days. Simple Terraform variable change. With real artist data entering the system, longer backup windows are warranted.

5. **External uptime monitoring** (SUR-169, partial) — Set up a basic external health check on the API `/health` endpoint and the frontend root. Options: AWS Route 53 health check (~$1/month), UptimeRobot free tier, or Better Stack free tier. The key requirement is that monitoring is independent of AWS so it works when AWS is down.

6. **Terraform state recovery plan** (SUR-168) — Document the recovery procedure: how to restore state from S3 versioned objects, how to import resources if state is lost, and how to handle state lock table issues. This is a documentation task, not code.

7. **Structured application logging** — Replace bare `console.log` in Lambda functions with structured JSON logging (timestamp, request ID, log level, context fields). This is needed before real traffic because debugging Lambda issues without structured logs is painful. Can use a lightweight logger wrapper — no external service needed.

### Exit Criteria

- Artists can sign in with Google OAuth (verified via Cognito hosted UI or frontend flow)
- Image URLs in the browser use the custom CDN domain (not `d*.cloudfront.net`)
- Admin accounts can enable TOTP MFA
- Prod RDS backup retention is 14 days (verified via `aws rds describe-db-instances`)
- External uptime monitor is running and has sent at least one test alert
- Terraform state recovery runbook exists in `docs/runbooks/`
- Lambda logs are structured JSON with request IDs (verified in CloudWatch)

### Dependencies

- **Google OAuth:** COO must create Google Cloud project, configure OAuth consent screen, and provide client ID/secret
- **Custom CDN domain:** DNS zone must be managed (already is — `surfacedart.com` is in Route 53 or external DNS). ACM cert requires DNS validation.
- **Frontend auth MFA flow:** Frontend team needs to add MFA enrollment UI if we enable optional TOTP (coordinate with Frontend/UX)

### Risks

- **Google OAuth setup is a blocker** — if the COO hasn't created the Google Cloud project, artists can only use email/password. This is acceptable for beta but makes onboarding friction higher.
- **Custom CDN domain** requires DNS propagation and ACM certificate validation, which can take up to 72 hours. Start early.
- **Structured logging** could surface issues with log volume/cost if the log format is verbose. Keep it lean (no request body logging).

---

## MVP

**Purpose reminder:** Full purchase loop end-to-end. Artists onboard, list, receive payment. Buyers browse and purchase.

### Must Complete

1. **AWS WAF on API Gateway and CloudFront** (SUR-162) — Deploy AWS WAF with managed rule groups: AWSManagedRulesCommonRuleSet, AWSManagedRulesKnownBadInputsRuleSet, and a rate-based rule. This protects against OWASP Top 10 attacks at the edge. Real money flowing through the platform demands edge-level protection. Estimated cost: ~$6/month base + $1/million requests.

2. **Migrate secrets to AWS Secrets Manager** (SUR-163) — Move DATABASE_URL, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, COGNITO_CLIENT_SECRET, and REVALIDATION_SECRET out of Lambda environment variables and into Secrets Manager. Update Lambda code to fetch secrets at cold start. This provides rotation capability, audit trail, and encryption with a dedicated KMS key. Estimated cost: ~$2.50/month for 5 secrets.

3. **Automated rollback on failed health check** — After Lambda deployment, the health check step already exists. Add logic to revert to the previous ECR image tag if the health check fails. This prevents a bad deploy from staying live while a human investigates. Implement as a conditional step in the deploy workflow that calls `aws lambda update-function-code` with the previous image URI.

4. **CloudFront, Cognito, and SES monitoring alarms** (SUR-171) — Add CloudWatch alarms for: CloudFront 5xx error rate, CloudFront cache hit ratio drop, Cognito failed sign-in spike, SES bounce rate > 5%, SES complaint rate > 0.1%. These are all standard CloudWatch metrics that just need alarm definitions in Terraform.

5. **Incident response runbooks** (SUR-74, partial) — Write runbooks for: API is down, database connection exhaustion, Lambda throttling, S3/CloudFront serving errors, Stripe webhook failures, failed deployment. Store in `docs/runbooks/`. These don't need to be elaborate — one page per scenario covering detection, diagnosis, and remediation steps.

6. **Apple Sign In credentials** — Configure real Apple Sign In credentials in Cognito. This is the second OAuth provider and expected by users on iOS. Depends on COO enrolling in Apple Developer Program ($99/year) and creating a Services ID.

7. **RDS instance sizing review** — Evaluate whether `db.t3.micro` (2 vCPU burst, 1GB RAM, ~87 max connections) is adequate for MVP traffic. If the beta period shows any connection or CPU pressure in CloudWatch, upgrade to `db.t3.small` (2 vCPU burst, 2GB RAM, ~170 max connections) for prod. Dev can stay on micro. Estimated cost delta: ~$15/month → ~$30/month for prod instance.

8. **Lambda memory right-sizing** — Review Lambda invocation metrics from beta. If P95 duration is consistently well under 30s at 256MB, keep it. If cold starts are slow, consider bumping to 512MB (doubles cost per invocation but halves cold start time due to proportional CPU allocation). Use Lambda Power Tuning if data is ambiguous.

### Exit Criteria

- WAF is active on both API Gateway and CloudFront (verified by WAF console showing blocked requests in test)
- All secrets are in Secrets Manager (verified by Lambda env vars containing only non-secret config)
- A deliberately broken deploy triggers automatic rollback (tested in dev environment)
- CloudFront/Cognito/SES alarms exist and fire test notifications
- Runbooks exist for at least 5 failure scenarios
- Apple Sign In works in Cognito (verified via test account)
- RDS instance size is justified by CloudWatch metrics from beta
- Lambda memory setting is justified by Power Tuning or manual analysis

### Dependencies

- **Secrets Manager migration** requires coordinated deploy — Lambda code must be updated to read from Secrets Manager at the same time the secrets are provisioned. This is a "big bang" change that should be tested thoroughly in dev first.
- **Apple Sign In** requires Apple Developer Program enrollment (COO action, $99/year, can take days to approve)
- **WAF managed rules** may produce false positives that block legitimate requests. Need to run in COUNT mode first, review logs, then switch to BLOCK.
- **Automated rollback** needs the previous image URI to be stored/retrieved. The deploy workflow must be refactored to save the current image URI before deploying the new one.

### Risks

- **Secrets Manager migration is the highest-risk change in this stage.** If the Lambda can't read from Secrets Manager (IAM permissions, VPC endpoint missing, cold start timeout), the entire API goes down. Must be tested in dev with a full deploy cycle before touching prod.
- **WAF false positives** could block real users. Run in COUNT mode for at least one week before switching to BLOCK.
- **RDS upgrade** requires a brief downtime window (modify instance class triggers a reboot). Schedule during low-traffic hours.
- **Cost jump** — WAF + Secrets Manager + potential RDS upgrade adds ~$25-35/month to the bill.

---

## MMP (Minimum Marketable Product)

**Purpose reminder:** Polished enough to market to artists beyond founding cohort. Professional, trustworthy, feature-complete for supply-side scaling.

### Must Complete

1. **CloudFront access logging** — Enable CloudFront access logs to S3 for forensic analysis and traffic pattern visibility. Currently disabled (Trivy finding AVD-AWS-0010, deferred). With active marketing driving traffic, CDN-level request logs become valuable for debugging and abuse detection. Estimated cost: minimal (S3 storage for logs, lifecycle them aggressively).

2. **IAM database authentication** (Trivy AVD-AWS-0176) — Replace password-based RDS authentication with IAM DB auth. Lambda assumes its execution role, gets a temporary auth token, connects to RDS. Eliminates the DATABASE_URL password as a single point of compromise. This is a meaningful security upgrade now that secrets are in Secrets Manager (MVP prerequisite).

3. **CDN caching for API responses** — Add CloudFront or API Gateway caching for high-traffic read-only endpoints (`/artists`, `/listings`, `/categories`, `/tags`). These endpoints serve the same data to all users and are hammered on every page load. Even a 60-second cache TTL dramatically reduces Lambda invocations and DB load. Implement via API Gateway caching or a CloudFront distribution in front of the API.

4. **Vercel preview deploy CORS narrowing** — Replace the `*.vercel.app` wildcard in application CORS with the specific Vercel team scope (e.g., `*.surfacedart.vercel.app`). Discovered during security review. Low effort, reduces attack surface.

5. **Rate limiting on public read endpoints** — Add application-level per-IP rate limiting to `/artists`, `/listings`, `/categories`, `/tags`, `/search`. Currently only write endpoints have app-level rate limits. A scraper could enumerate all listings at the API Gateway's global rate (50 rps) without triggering any per-IP defense. Suggested limits: 60 req/min for listing/artist endpoints, 30 req/min for search.

6. **Feature flags infrastructure** (SUR-184) — Decide on and implement a feature flags strategy (ADR). Options: PostHog feature flags (already have PostHog), LaunchDarkly, or simple env-var-based flags. Feature flags enable safe rollout of new features to subsets of artists during the scaling phase.

7. **Automated backup verification** — Set up a periodic (monthly) automated restore test for RDS. Can be a GitHub Actions workflow on a cron that creates a point-in-time restore to a temporary instance, runs a basic query, then deletes the instance. Proves backups are actually restorable. Estimated cost: ~$1/test (instance runs for minutes).

8. **Secret rotation procedures** — Document and ideally automate rotation for: Stripe API keys, database password (or eliminate with IAM auth), Cognito client secret, revalidation secret, webhook secrets. At minimum, write a runbook. Ideally, configure Secrets Manager automatic rotation for database credentials.

### Exit Criteria

- CloudFront access logs are being written to S3 (verified by checking the log bucket)
- RDS connections use IAM auth tokens (verified by removing password from Secrets Manager and confirming API still works)
- API response caching is active on read endpoints (verified by CloudFront cache-hit header or API Gateway cache metrics)
- CORS no longer allows arbitrary `*.vercel.app` origins
- Public read endpoints return 429 when rate limit is exceeded (verified by load test)
- Feature flag ADR is published in `docs/decisions/`
- Backup restore test has run successfully at least once
- Secret rotation runbook exists; database credential rotation is automated if using Secrets Manager rotation

### Dependencies

- **IAM DB auth** requires the Secrets Manager migration to be complete (MVP prerequisite) so there's a clean cutover path
- **API caching** requires coordination with Backend team — cache invalidation strategy must be agreed upon (TTL-based vs. explicit invalidation on writes)
- **Feature flags** decision depends on Growth/Marketing team input on rollout needs

### Risks

- **IAM DB auth** changes the database connection flow fundamentally. If token generation fails or expires mid-request, queries fail. Must handle token refresh gracefully in the connection pool.
- **API caching** introduces stale data risk. A listing that sells may still appear available for up to the cache TTL. Need cache invalidation on writes or very short TTLs.
- **Backup restore test** creates a temporary RDS instance — if the cleanup step fails, it keeps running and incurring cost. Add a safety mechanism (CloudWatch alarm on unexpected RDS instances, or a TTL tag with a Lambda cleanup).

---

## GA (General Availability)

**Purpose reminder:** Publicly accepting applications. Full payment/shipping/commission flow. Support processes exist. The business is running.

### Must Complete

1. **RDS Proxy** — Deploy RDS Proxy between Lambda and RDS to handle connection pooling. At GA traffic levels, Lambda concurrency spikes will exhaust RDS `max_connections` without a proxy. RDS Proxy maintains a warm connection pool and handles connection multiplexing. Estimated cost: ~$20/month for db.t3.small proxy. Terraform module addition.

2. **RDS upgrade to db.t3.medium or db.t3.large** — Based on MMP traffic data, right-size the production database. GA means the platform is being actively marketed, and the database must handle sustained load without CPU throttling. `db.t3.medium` (4GB RAM, ~340 connections) is likely the GA target. Estimated cost: ~$50/month.

3. **Lambda concurrency increase** — Raise prod reserved concurrency from 40 to 100+ based on traffic projections. With RDS Proxy in place, connection exhaustion is no longer the constraint — Lambda concurrency can scale independently. Adjust API Gateway throttling limits proportionally.

4. **Multi-AZ RDS** — Enable Multi-AZ deployment for production RDS. Provides automatic failover if the primary AZ has an issue. Required for any business that can't tolerate database downtime. Doubles the RDS cost. Estimated cost delta: ~$50/month additional.

5. **Distributed tracing (X-Ray)** — Enable AWS X-Ray tracing on API Lambda and API Gateway. Provides end-to-end request tracing, latency breakdown by segment, and service map visualization. Essential for debugging performance issues in a production system with real user traffic.

6. **Status page** — Deploy a simple status page (Better Stack, Instatus, or static hosted page) that shows current system health. Gives artists and buyers confidence that the platform is monitored. Can be as simple as a static page that pulls from the external uptime monitor API.

7. **Alerting escalation — Slack integration** — Route CloudWatch alarms to a Slack channel via AWS Chatbot or SNS-to-Lambda-to-Slack. Email-only alerting is insufficient for a live business. The CTO needs instant mobile notification when something breaks.

8. **Data retention enforcement** — Implement technical controls for the data retention policy (SUR-167). Soft-delete with scheduled hard-delete after retention period. Covers user accounts, artist profiles, order data, and uploaded media. Privacy policy commitments must be technically enforced.

9. **Cross-region RDS backup** — Enable cross-region automated backups or snapshot copy to a second AWS region. Protects against regional AWS failure. This is the "sleep at night" level of disaster recovery. Estimated cost: ~$5-10/month for storage.

10. **CI/CD: Blue-green or canary deploys** — For GA, a bad deploy can lose real sales. Implement weighted Lambda aliases (canary) that route 10% of traffic to the new version for 10 minutes before promoting to 100%. If error rate spikes during the canary window, auto-rollback.

### Exit Criteria

- RDS Proxy is active and connection metrics show pooling working (verified by CloudWatch RDS Proxy metrics)
- RDS is Multi-AZ (verified by `aws rds describe-db-instances` showing `MultiAZ: true`)
- Lambda concurrency is at 100+ with proportional API Gateway throttle limits
- X-Ray traces are visible in the AWS console for API requests
- Status page is live at `status.surfacedart.com` and reflects real-time health
- CloudWatch alarms post to Slack within 60 seconds of firing
- Data retention jobs run on schedule and delete expired data
- Cross-region backups are replicating (verified by checking the target region)
- Canary deploy has been tested in dev with a deliberate failure triggering auto-rollback

### Dependencies

- **RDS Proxy** requires VPC configuration (already in place) and IAM auth (MMP prerequisite) for best results
- **Multi-AZ** requires a maintenance window — coordinate with the team for a scheduled cutover
- **Status page** requires a subdomain DNS record
- **Data retention** requires Backend team to implement soft-delete across all relevant tables and a scheduled cleanup job (Lambda on EventBridge cron)
- **Canary deploys** require refactoring the deploy workflow significantly — this is the largest CI/CD change in the entire plan

### Risks

- **RDS Proxy cold connection pool** — after deploy or proxy restart, the first wave of requests may be slower as the proxy establishes connections. Monitor P99 latency during the rollout.
- **Multi-AZ failover** causes a brief (60-120 second) connection disruption. Acceptable but should be communicated.
- **Canary deploy complexity** — Lambda weighted aliases require careful alias management and the deploy workflow becomes significantly more complex. Worth the investment at GA but high implementation effort.
- **Cost jump is significant** — GA infrastructure is roughly 3-4x the MVP cost. See Cost Projections below.

---

## Cost Projections

| Stage | Estimated Monthly AWS Cost | Key Cost Drivers |
|---|---|---|
| **Alpha** | ~$55-65 | Current state + budget alarm (free) |
| **Beta** | ~$60-75 | + external monitoring (~$0-5), custom CDN domain (free with ACM) |
| **MVP** | ~$85-120 | + WAF (~$7), Secrets Manager (~$3), possible RDS upgrade (+$15) |
| **MMP** | ~$100-140 | + CloudFront logging (minimal), backup test (~$1/month) |
| **GA** | ~$250-400 | + RDS Proxy (~$20), Multi-AZ (+$50), larger RDS (+$20-50), higher Lambda volume |

**Notes:**
- Vercel hosting cost is separate (free tier likely sufficient through Beta, Pro plan $20/month from MVP)
- S3 storage grows with artist count but remains cheap (~$0.023/GB/month)
- CloudFront transfer is the wild card at GA — PriceClass_100 helps but high-res art images are large
- Lambda invocation costs are negligible until sustained high traffic (1M requests/month = ~$0.20)

**Cost optimization opportunities:**
- Shut down dev RDS during nights/weekends (saves ~$15/month) — only worthwhile if dev environment usage is sporadic
- Use CloudFront cache-control headers aggressively for images (reduce origin requests)
- Consider Reserved Instances for RDS at GA if committed to 1-year run (30-40% savings)

---

## Scaling Roadmap

| Traffic Level | Infra State | Bottleneck | Action |
|---|---|---|---|
| **< 100 DAU** (Alpha-Beta) | Current (db.t3.micro, 40 Lambda concurrency) | None expected | Monitor CloudWatch dashboards |
| **100-500 DAU** (MVP) | db.t3.small, 40-60 Lambda concurrency | Cold starts on Lambda, possible RDS CPU | Bump Lambda memory to 512MB, consider RDS upgrade |
| **500-2000 DAU** (MMP) | db.t3.small, API caching enabled | DB connection count, uncached API calls | API response caching, evaluate RDS Proxy need |
| **2000-10000 DAU** (GA) | db.t3.medium, RDS Proxy, Multi-AZ, 100+ Lambda | CloudFront transfer costs, search performance | CDN optimization, evaluate dedicated search (Algolia/OpenSearch) |
| **10000+ DAU** (Post-GA) | db.t3.large or r6g, RDS Proxy, Multi-AZ, 200+ Lambda | Full-text search scaling, image storage costs | OpenSearch, S3 Intelligent-Tiering, OpenNext migration evaluation |

**Key scaling decisions that should be data-driven (not pre-decided):**
- RDS Proxy: Deploy when CloudWatch shows connection count consistently > 60% of max_connections
- OpenSearch: Migrate when PostgreSQL full-text search P95 latency exceeds 500ms
- OpenNext: Migrate from Vercel when Vercel costs exceed equivalent self-hosted costs + engineering time
- ElastiCache: Add only if the same API queries are hitting the database repeatedly despite API-level caching

---

## New Work Discovered

Items found during planning that are not tracked in Linear and need issues created:

1. **S3 CORS origin restriction** — `allowed_origins = ["*"]` must be restricted. Quick Terraform fix, should be Alpha. No Linear issue exists.

2. **Cognito MFA enablement** — Change from OFF to OPTIONAL. Beta timeline. No Linear issue exists.

3. **CI action version alignment** — Standardize action versions across deploy workflows. Alpha timeline. No Linear issue exists.

4. **Dependabot for GitHub Actions** — Add `.github/dependabot.yml` for action version updates. Alpha timeline. No Linear issue exists.

5. **Vercel preview CORS narrowing** — Replace `*.vercel.app` wildcard with team-scoped pattern. MMP timeline. No Linear issue exists.

6. **Public read endpoint rate limiting** — Add per-IP rate limits to `/artists`, `/listings`, etc. MMP timeline. No Linear issue exists.

7. **Secret rotation procedures** — Document rotation for all secrets. MMP timeline. No Linear issue exists.

8. **Admin account MFA requirement** — Enforce MFA for admin role accounts (beyond optional for all users). Beta/MVP timeline. No Linear issue exists.

9. **Structured application logging** — Replace console.log with structured JSON logging. Beta timeline. No Linear issue exists.

10. **Automated backup restore test** — Monthly cron to verify RDS backups are restorable. MMP timeline. No Linear issue exists.

---

## Priority Conflicts

### 1. Secrets Manager migration timing vs. MVP velocity
SUR-163 (secrets migration) is currently labeled "blocked" — presumably blocked on prioritization, not technical blockers. This is the single most complex infrastructure change before GA, and it touches every Lambda function. If the Backend team is simultaneously building the entire checkout/payment flow (Phase 4), the secrets migration will conflict with their Lambda code changes. **Recommendation:** Do the secrets migration in a dedicated sprint before Phase 4 checkout work begins, or immediately after, but not concurrently.

### 2. IAM DB auth vs. secrets in Secrets Manager
IAM DB auth (MMP) eliminates the database password entirely, which partially overlaps with the Secrets Manager migration (MVP). If IAM DB auth is the end goal, putting the DATABASE_URL into Secrets Manager at MVP and then removing it at MMP is redundant work. **Recommendation:** If the timeline allows, skip Secrets Manager for DATABASE_URL specifically and go straight to IAM DB auth. Still migrate Stripe/Cognito/webhook secrets to Secrets Manager at MVP since those can't use IAM auth.

### 3. WAF COUNT mode observation period vs. MVP launch pressure
WAF should run in COUNT mode for at least a week before switching to BLOCK mode to identify false positives. If MVP has a hard launch date, the WAF observation period must start well before that date. **Recommendation:** Deploy WAF in COUNT mode during the late Beta period so it has time to observe real artist traffic patterns before being switched to BLOCK for MVP.

### 4. RDS sizing upgrades and Multi-AZ vs. cost sensitivity
The jump from ~$60/month (Beta) to ~$250-400/month (GA) is significant for a bootstrapped startup. Multi-AZ alone doubles the RDS cost. **Recommendation:** Multi-AZ is GA-only. Do not enable it prematurely. The 7-14 day backup retention + cross-region snapshot copy provides adequate DR coverage for MMP traffic levels.

### 5. Canary deploys vs. automated rollback
Both MVP (automated rollback) and GA (canary deploys) address deployment safety. The MVP rollback mechanism should be designed with the GA canary architecture in mind so it doesn't need to be thrown away. **Recommendation:** At MVP, implement rollback using Lambda alias pointing at the previous version. At GA, extend this to weighted alias routing (10% canary). Same mechanism, progressive enhancement.

### 6. Visual QA pipeline vs. frontend velocity
Enabling visual QA screenshots at Alpha could slow down frontend PRs if the screenshots become a gating check. **Recommendation:** Enable screenshot generation (non-blocking) at Alpha. Make screenshots a blocking CI check only at MMP when the design is stable.
