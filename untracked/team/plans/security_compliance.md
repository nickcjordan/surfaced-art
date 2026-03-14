# Security & Compliance Stage Plan — 2026-03-09

## Alpha

### What Must Be Completed

Alpha is internal/friends-only with no public access and no real user data. The existing security posture is sufficient for this stage with one exception:

1. **Fix S3 CORS wildcard origin** — Change `allowed_origins = ["*"]` in `infrastructure/terraform/modules/s3-cloudfront/main.tf` to the production frontend URL + localhost. This is a one-line Terraform change and there is no reason to leave it open even for internal testing. *(No Linear issue — new work)*
2. **Verify security scanning CI is green** — Confirm `security.yml` workflow passes on the current `dev` branch with no HIGH+ findings unaccounted for.

Everything else (auth, RBAC, rate limiting, headers, encryption) is already in place and appropriate for internal testing.

### Exit Criteria

- [ ] S3 CORS restricted to known origins (no wildcard)
- [ ] Security CI workflow passes on `dev` with no unaddressed HIGH+ findings
- [ ] All `.trivyignore` suppressions are still valid and documented

### Dependencies

None. All work is internal engineering.

### Risks

- **Low**: Someone with the S3 presigned URL pattern could upload to the media bucket from any origin. Mitigated by the presigned URL itself being scoped, but the CORS wildcard is still sloppy.
- **Low**: No real user data at risk during Alpha.

---

## Beta (Closed)

### What Must Be Completed

Beta invites 10-25 real artists. Their data (email, profile info, artwork images) is real PII. Legal documents become binding. This is the first stage where security and compliance gaps create genuine liability.

#### Security

1. **Enable optional MFA on Cognito** — Set `mfa_configuration = "OPTIONAL"` with TOTP. Artists and admins should be able to enable MFA. *(No Linear issue — new work)*
2. **Require MFA for admin accounts** — Enforce MFA for any user with the `admin` role before they can access admin endpoints. *(No Linear issue — new work)*
3. **Migrate secrets to AWS Secrets Manager** — Move `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, and `REVALIDATION_SECRET` out of Lambda env vars into Secrets Manager or SSM Parameter Store. *(SUR-163, Backlog)*
4. **Narrow Vercel preview CORS** — Replace `*.vercel.app` wildcard with scope-specific pattern (e.g., `*-surfacedart.vercel.app` or explicit preview URLs). *(No Linear issue — new work)*
5. **Add rate limiting to public read endpoints** — `/artists`, `/listings`, `/categories`, `/tags` need per-IP application-level rate limits to prevent scraping of artist data. *(No Linear issue — new work)*
6. **Frontend admin auth** — SUR-195 (`/auth/me` + role-aware frontend auth + admin route guard) must be complete. Admin actions on real artist data cannot be curl-only.
7. **Failed sign-in monitoring** — SUR-171. CloudWatch alarms on Cognito failed auth events to detect brute-force attempts against artist accounts.

#### Legal & Compliance

8. **Attorney review of ToS and Privacy Policy** — These documents are live and binding on real artists. They must be reviewed by an attorney before Beta invitations go out. *(No Linear issue — COO dependency)*
9. **Artist Agreement live at `/artist-agreement`** — SUR-173. Artists must agree to commission terms, content ownership, shipping obligations, and platform rules before onboarding. Must be attorney-reviewed.
10. **DMCA Policy page live at `/dmca`** — Content exists in Notion; needs a frontend page. Required under 17 USC 512 for any platform hosting user-submitted content. *(SUR-185 covers drafting; page creation is new work)*
11. **Content Guidelines page live at `/content-guidelines`** — Artists need a published reference for what artwork is and isn't allowed. Content exists in Notion; needs a frontend page. *(New work, related to SUR-185)*
12. **Designate DMCA agent** — Register a DMCA designated agent with the U.S. Copyright Office. Required for safe harbor protection. *(No Linear issue — COO task)*

### Exit Criteria

- [ ] MFA optional for all users, required for admins
- [ ] All secrets in Secrets Manager or SSM (zero secrets in Lambda env vars)
- [ ] Vercel preview CORS narrowed to team scope
- [ ] Public read endpoints have per-IP rate limits
- [ ] Admin UI has proper frontend auth (SUR-195 done)
- [ ] Failed sign-in CloudWatch alarms active (SUR-171 done)
- [ ] ToS, Privacy Policy, and Artist Agreement attorney-reviewed and live
- [ ] `/dmca` page live with takedown procedure and designated agent contact
- [ ] `/content-guidelines` page live
- [ ] DMCA agent registered with Copyright Office

### Dependencies

| Item | Depends On |
|------|-----------|
| Attorney review of ToS, Privacy, Artist Agreement | COO to engage attorney |
| DMCA agent registration | COO to file with Copyright Office (~$6 fee) |
| Artist Agreement content | COO to finalize terms (commission %, shipping responsibilities) |
| SUR-195 (frontend admin auth) | Backend Lead to implement |
| SUR-163 (secrets management) | Infrastructure work |

### Risks

- **HIGH — Artist Agreement not ready**: If the Artist Agreement isn't live before artist invitations, there is no binding agreement on commission split, content ownership, or dispute resolution. Artists could later claim they didn't agree to the 30% commission.
- **HIGH — No attorney review**: If ToS/Privacy go unreviewed, liability clauses may not hold up. California consumer protection law is strict; GDPR applies if any EU artists are invited.
- **MEDIUM — Secrets exposure**: Lambda env vars are visible to anyone with `Lambda:GetFunctionConfiguration` IAM permission. During Beta, these env vars include the database connection string to real artist data.
- **MEDIUM — Missing DMCA page**: Even with 10-25 artists, if someone files a DMCA complaint and there's no published policy or registered agent, the platform loses safe harbor protection.

---

## MVP

### What Must Be Completed

MVP enables the full purchase loop: real money, real shipping addresses, real financial data. PCI compliance and financial/consumer protection become non-negotiable.

#### Security

1. **Enable CloudFront WAF** — Basic WAF rules for bot detection, rate limiting at CDN edge, and common attack pattern blocking (SQLi, XSS). *(Deferred from Phase 3, Trivy finding AVD-AWS-0011)*
2. **Enable CloudFront access logging** — CDN request logs for forensic analysis and abuse detection. *(Deferred from Phase 3, Trivy finding AVD-AWS-0010)*
3. **IAM database authentication** — Replace password-based RDS auth with IAM auth. Eliminates the DATABASE_URL password as a single point of compromise. *(Trivy finding AVD-AWS-0176, deferred from Phase 3)*
4. **Secret rotation procedures documented** — Document and test rotation for: Stripe keys, database credentials, Cognito client secret, revalidation secret, webhook secret. *(No Linear issue — new work)*
5. **Google and Apple OAuth configured** — Real OAuth credentials replacing placeholders. Users should have social sign-in options, not just email/password. *(No Linear issue — infrastructure task noted in CLAUDE.md future tasks)*
6. **Data deletion workflow** — Technical mechanism to fulfill GDPR/CCPA deletion requests: delete user PII, anonymize order history, remove uploaded images. *(SUR-174, Backlog)*

#### Legal & Compliance

7. **Refund/Dispute Policy live** — Buyers need clear refund terms before purchasing. Policy must cover: damaged in transit, not as described, artist non-shipment, buyer's remorse. *(SUR-174, Backlog)*
8. **PCI SAQ-A completion** — Formally complete the PCI Self-Assessment Questionnaire A. Document that the platform never touches raw card data (Stripe handles everything). Keep the completed SAQ on file. *(No Linear issue — new work)*
9. **Data retention policy formalized** — Technical enforcement of the retention periods stated in the Privacy Policy. Automated cleanup or flagging of data past retention. *(SUR-167, Backlog)*
10. **Privacy Policy update for transactions** — The current Privacy Policy covers browsing. It needs updates for: shipping address collection, order history, financial data (through Stripe), and how long transaction records are retained.

### Exit Criteria

- [ ] CloudFront WAF active with baseline rule set
- [ ] CloudFront access logging enabled and shipping to S3
- [ ] IAM database auth enabled (no password in connection string)
- [ ] Secret rotation runbook documented and tested for all secrets
- [ ] Google and Apple OAuth functional with real credentials
- [ ] Data deletion workflow implemented and tested
- [ ] Refund/Dispute Policy live at `/refund-policy` (or equivalent)
- [ ] PCI SAQ-A completed and filed
- [ ] Data retention policy with technical enforcement
- [ ] Privacy Policy updated for transaction data

### Dependencies

| Item | Depends On |
|------|-----------|
| Refund/Dispute Policy content | COO to define return windows, damage procedures |
| PCI SAQ-A | Stripe integration complete (checkout flow built) |
| Google OAuth credentials | COO/Infra to create Google Cloud project + OAuth consent screen |
| Apple Sign In credentials | COO/Infra to configure Apple Developer account |
| IAM DB auth | Terraform + Lambda code changes, tested migration plan |
| Privacy Policy update | Attorney review of transaction-related additions |

### Risks

- **HIGH — Transactions without refund policy**: If buyers can purchase but there's no published refund policy, the platform is exposed to credit card chargebacks and state consumer protection complaints. Chargeback fees hit the platform, not the artist.
- **HIGH — PCI non-compliance**: While SAQ-A is the lightest level and Stripe handles card data, failing to formally complete the SAQ means no documented proof of compliance if Stripe or a card network audits.
- **MEDIUM — No WAF**: Without WAF, the platform relies solely on API Gateway throttling and in-memory rate limiting. A coordinated attack could impact checkout availability.
- **MEDIUM — Deletion requests unfulfillable**: GDPR requires response within 30 days. CCPA within 45 days. Without a data deletion workflow, the platform cannot fulfill these in a compliant timeframe.

---

## MMP (Minimum Marketable Product)

### What Must Be Completed

MMP scales beyond the founding cohort. More artists, more buyers, more data. Security must be operationalized, not just implemented.

#### Security Operations

1. **Security incident response plan** — Documented procedure for: data breach notification (72 hours under GDPR, varying by US state), compromised credentials, unauthorized access, artist account takeover. *(No Linear issue — new work)*
2. **Penetration test** — Engage a third-party to pen test the application (API, auth flows, upload pipeline, admin endpoints). Fix any findings before scaling acquisition. *(No Linear issue — new work)*
3. **Admin impersonation with session tokens** — SUR-10. Full impersonation capability (not just read-only) for support cases. Must have audit logging and time-limited tokens.
4. **Automated dependency updates** — Dependabot or Renovate configured for automated PRs on dependency updates. Currently manual. *(No Linear issue — new work)*
5. **S3 CMK encryption** — Upgrade from AES-256 (SSE-S3) to customer-managed KMS keys. Provides key rotation and access audit trail. *(Trivy finding AVD-AWS-0132, currently deferred)*

#### Legal & Compliance

6. **Cookie consent mechanism** — If PostHog or any analytics evolves to use cookies, or if EU marketing tools are added, a cookie consent banner will be needed. Evaluate and implement if required. *(Currently not needed per SUR-97, but re-evaluate at this stage)*
7. **Accessibility statement** — Publish an accessibility commitment page. Not legally required everywhere but expected by artists and buyers as a trust signal at scale.
8. **International shipping compliance** — If artists ship internationally, customs/duties disclosures may be needed. Evaluate and add to buyer-facing documentation if applicable.

### Exit Criteria

- [ ] Security incident response plan documented and team-reviewed
- [ ] Third-party penetration test completed, findings addressed
- [ ] Admin impersonation fully functional with audit trail (SUR-10 done)
- [ ] Automated dependency update PRs configured
- [ ] S3 encryption upgraded to CMK (or re-evaluated with documented decision)
- [ ] Cookie consent evaluated and implemented if needed
- [ ] Accessibility statement published

### Dependencies

| Item | Depends On |
|------|-----------|
| Penetration test | Budget approval from COO, vendor selection |
| Incident response plan | COO + legal to define notification obligations |
| International shipping compliance | COO to define shipping scope (domestic only vs. international) |

### Risks

- **MEDIUM — No incident response plan**: If a breach occurs during scaled acquisition, there's no documented procedure. GDPR requires 72-hour notification. Several US states have similar requirements. Ad-hoc response increases legal exposure.
- **MEDIUM — Unpatched dependencies at scale**: Manual dependency management doesn't scale. A critical CVE in a transitive dependency could go unnoticed.
- **LOW — Penetration test findings**: Pen tests almost always find something. Budget for remediation time after the test.

---

## GA (General Availability)

### What Must Be Completed

GA means the business is running publicly. Security and compliance must be mature, documented, and continuously monitored.

#### Security Maturity

1. **SOC 2 Type I readiness assessment** — Evaluate whether SOC 2 certification is needed for enterprise artist partnerships or buyer trust. If yes, begin the readiness assessment. *(Future consideration — not immediately required)*
2. **Continuous security monitoring** — CloudWatch dashboards for: failed auth attempts, WAF blocks, unusual API patterns, admin action volume. Alerts to Slack/PagerDuty. *(Extends SUR-171)*
3. **Disaster recovery test** — Test RDS backup restoration, S3 version recovery, and Lambda redeployment from scratch. Document recovery time objectives (RTO) and recovery point objectives (RPO).
4. **Annual security review cadence** — Schedule quarterly dependency audits, annual pen test, annual legal document review.

#### Legal & Compliance

5. **Annual legal document review** — Attorney review of all legal documents (ToS, Privacy, Artist Agreement, DMCA, Refund Policy) annually or when business model changes.
6. **State sales tax compliance** — If selling physical goods, sales tax obligations exist in most US states. Evaluate Stripe Tax or TaxJar integration. *(No Linear issue — significant compliance work)*
7. **1099-K reporting** — Stripe Connect handles most reporting, but verify the platform's obligations for artist payouts exceeding IRS thresholds. *(No Linear issue — COO/accountant task)*
8. **ADA/WCAG compliance audit** — Full accessibility audit of the frontend. Art platforms have visual content requirements that create unique accessibility challenges.

### Exit Criteria

- [ ] SOC 2 readiness assessed (decision documented even if deferred)
- [ ] Security monitoring dashboards live with alerting
- [ ] Disaster recovery tested with documented RTO/RPO
- [ ] Annual review cadence established and calendared
- [ ] Legal documents reviewed by attorney within the last 12 months
- [ ] Sales tax compliance evaluated (Stripe Tax or equivalent)
- [ ] 1099-K reporting obligations documented
- [ ] Accessibility audit completed

### Dependencies

| Item | Depends On |
|------|-----------|
| SOC 2 assessment | Budget, business need assessment |
| Sales tax compliance | COO + accountant to determine nexus obligations |
| 1099-K reporting | COO + accountant |
| Accessibility audit | Budget for third-party audit or tooling |
| Disaster recovery test | Coordinated downtime window (or test environment) |

### Risks

- **HIGH — Sales tax non-compliance**: Selling physical goods without collecting sales tax creates retroactive tax liability. This compounds over time and is expensive to fix after the fact.
- **MEDIUM — No DR test**: Untested backups are not backups. A production database loss without a tested restore procedure could be catastrophic.
- **LOW — SOC 2 not needed yet**: Most art marketplace buyers don't ask for SOC 2. Revisit if pursuing corporate art buyers or gallery partnerships.

---

## Legal Document Roadmap

| Document | Must Be Live By | Current Status | Owner | Attorney Review Required |
|----------|----------------|----------------|-------|------------------------|
| Terms of Service | **Alpha** (already live) | Live at `/terms` | COO | Yes — before Beta |
| Privacy Policy | **Alpha** (already live) | Live at `/privacy` | COO | Yes — before Beta |
| Artist Agreement | **Beta** | Not built (SUR-173) | COO + Attorney | Yes — before artist invitations |
| DMCA Policy | **Beta** | Drafted in Notion, no page | COO | Recommended |
| Content Guidelines | **Beta** | Drafted in Notion, no page | COO | No (internal policy) |
| Refund/Dispute Policy | **MVP** | Not started (SUR-174) | COO + Attorney | Yes — before transactions |
| Accessibility Statement | **MMP** | Not started | Engineering + COO | No |
| Privacy Policy (v2 — transactions) | **MVP** | Not started | COO + Attorney | Yes |

### Key Deadline: Attorney Review

The single most time-sensitive dependency across all stages is engaging an attorney. Three documents need review before Beta (ToS, Privacy Policy, Artist Agreement), and the Refund Policy needs review before MVP. Attorney engagement should begin **now** to avoid blocking Beta.

---

## Compliance Milestones

### PCI DSS

| Stage | Milestone |
|-------|-----------|
| Alpha | N/A — no payments |
| Beta | N/A — no payments (browsing only) |
| MVP | Complete PCI SAQ-A. Document that raw card data never touches platform servers. |
| MMP | Annual SAQ-A renewal. Verify Stripe integration hasn't changed scope. |
| GA | Ongoing annual SAQ-A. Monitor for scope changes (e.g., if adding Apple Pay, Google Pay). |

### DMCA (17 USC 512)

| Stage | Milestone |
|-------|-----------|
| Alpha | N/A — no user content |
| Beta | DMCA policy page live. DMCA agent registered with Copyright Office. Takedown procedure documented. |
| MVP | First real takedown handled (if any). Process validated. |
| MMP | Takedown response time tracked. Counter-notice procedure documented. |
| GA | Annual review of DMCA procedures. |

### GDPR / CCPA

| Stage | Milestone |
|-------|-----------|
| Alpha | N/A — no real user data |
| Beta | Privacy Policy attorney-reviewed. Cookie-less analytics confirmed. Data processing basis documented (legitimate interest / consent). |
| MVP | Data deletion workflow functional (30-day GDPR / 45-day CCPA response). Data retention enforcement active. Privacy Policy updated for transaction data. |
| MMP | Data Subject Access Request (DSAR) workflow documented and tested. International transfer mechanisms documented (US-EU). |
| GA | Annual privacy impact assessment. DPA (Data Processing Agreement) template available for enterprise relationships. |

### State Consumer Protection / Sales Tax

| Stage | Milestone |
|-------|-----------|
| Alpha–Beta | N/A — no transactions |
| MVP | Refund policy compliant with FTC requirements. Clear pricing disclosure (including commission). |
| MMP | Sales tax nexus analysis completed. |
| GA | Sales tax collection active in required jurisdictions. 1099-K reporting verified. |

---

## New Work Discovered

The following items are **not currently tracked** in any Linear issue and should be created:

| # | Item | Stage Needed | Effort Estimate | Suggested Linear Title |
|---|------|-------------|-----------------|----------------------|
| 1 | S3 CORS origin restriction (Terraform) | Alpha | Small (1 hour) | `fix(infra): restrict S3 CORS to known origins` |
| 2 | Cognito MFA enablement (optional for users, required for admins) | Beta | Medium (1-2 days) | `feat(infra): enable Cognito MFA, require for admin accounts` |
| 3 | Vercel preview CORS narrowing | Beta | Small (1 hour) | `fix(api): narrow Vercel preview CORS to team scope` |
| 4 | Public read endpoint rate limiting | Beta | Small (2-3 hours) | `feat(api): add rate limits to public read endpoints` |
| 5 | DMCA page (`/dmca` route) | Beta | Small (2-3 hours) | `feat(web): add /dmca policy page from Notion draft` |
| 6 | Content Guidelines page (`/content-guidelines` route) | Beta | Small (2-3 hours) | `feat(web): add /content-guidelines page from Notion draft` |
| 7 | DMCA agent registration with Copyright Office | Beta | Small (COO task) | N/A — COO action item |
| 8 | Attorney engagement for legal review | Beta | External dependency | N/A — COO action item |
| 9 | Secret rotation runbook | MVP | Medium (1 day) | `docs(infra): document secret rotation procedures` |
| 10 | PCI SAQ-A completion | MVP | Small (COO + engineering) | `chore(compliance): complete PCI SAQ-A self-assessment` |
| 11 | Privacy Policy v2 (transaction data) | MVP | Small (COO + attorney) | N/A — COO action item |
| 12 | Security incident response plan | MMP | Medium (1 day) | `docs(security): create incident response plan` |
| 13 | Third-party penetration test | MMP | External dependency | N/A — COO budget approval |
| 14 | Automated dependency update PRs | MMP | Small (2-3 hours) | `chore(ci): configure Dependabot or Renovate for automated PRs` |
| 15 | Sales tax nexus analysis | GA | External dependency (accountant) | N/A — COO + accountant |

---

## Priority Conflicts & Cross-Team Dependencies

### Conflict 1: Beta Timeline vs. Attorney Review

The Artist Agreement (SUR-173) is marked **blocked** in Linear. It requires COO to finalize business terms and engage an attorney. If Beta invitations are planned before the attorney review is complete, the platform will be inviting artists under terms that may not be legally enforceable. **Recommendation**: Attorney engagement is the critical path item for Beta. Start now.

### Conflict 2: SUR-163 (Secrets Management) vs. Feature Work

Migrating secrets to Secrets Manager (SUR-163) requires Terraform changes, Lambda code changes, and testing across all environments. This is infrastructure work that competes with feature development for the Backend Lead's time. **Recommendation**: Schedule SUR-163 early in the Beta sprint — it's a prerequisite for handling real artist data responsibly.

### Conflict 3: SUR-195 (Frontend Admin Auth) vs. Admin UI Feature Work

The Admin UI parent issue (SUR-403) has 5 child tasks for admin features, but SUR-195 (frontend auth infrastructure) is listed as Backlog. Admin UI features are useless without frontend auth. **Recommendation**: SUR-195 must be completed before or in parallel with admin UI feature work. It should be prioritized to Ready/In Progress.

### Conflict 4: DMCA Page vs. Content Moderation Features

SUR-185 covers drafting the DMCA/content guidelines documents, and SUR-186 covers the technical moderation features (listing reports, content screening). The documents are drafted but the pages aren't built. The moderation features are blocked on Phase 4. **Recommendation**: Decouple page creation from SUR-185/186. Creating static pages from existing Notion drafts is 2-3 hours of work and should not be blocked by the larger moderation feature work.

### Conflict 5: CloudFront WAF Cost vs. Security Benefit

WAF adds ~$5-10/month baseline cost plus per-request charges. For Alpha/Beta traffic levels this is minimal, but it was deferred to "Phase 3" (now complete without it). **Recommendation**: Enable WAF at MVP when real transactions begin. The cost is trivial relative to the risk of checkout disruption.

### Cross-Team Summary

| Dependency | Who | Blocks What Stage |
|-----------|-----|------------------|
| Engage attorney for legal review | COO | Beta |
| Finalize Artist Agreement terms | COO | Beta |
| Register DMCA agent | COO | Beta |
| Google OAuth credentials | COO/Infra | MVP |
| Apple Sign In credentials | COO/Infra | MVP |
| Penetration test budget + vendor | COO | MMP |
| Sales tax accountant | COO | GA |
| SUR-195 (frontend admin auth) | Backend Lead | Beta |
| SUR-163 (secrets management) | Backend/Infra Lead | Beta |
| SUR-173 (artist agreement) | Backend Lead + COO | Beta |
