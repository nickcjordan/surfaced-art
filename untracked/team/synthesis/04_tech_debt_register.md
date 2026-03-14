# Technical Debt Register

*Planning Session v1 — 2026-03-09*

---

## Severity Levels

- **Critical**: Must fix before next stage transition. Blocks progress or poses security risk.
- **High**: Should fix soon. Growing cost of carrying this debt.
- **Medium**: Fix when touching adjacent code. Manageable but not ideal.
- **Low**: Nice to fix eventually. Minimal ongoing cost.

---

## Active Technical Debt

### Critical

| ID | Debt Item | Silo | Introduced | Fix By | Est. Effort | Notes |
|----|-----------|------|-----------|--------|-------------|-------|
| TD01 | **S3 CORS wildcard** (`*` origin) | Security, Infra | Phase 1 | Alpha | 1-2 hours | Restrict to actual frontend origins. Found by 3 agents independently. |
| TD02 | **PostHog API key possibly not configured in prod** | Analytics | Phase 1 | Alpha | 30 min | Verify and fix. Zero analytics data if misconfigured. |
| TD03 | **Fake testimonial on /for-artists** | Product, Growth | Phase 2 | Alpha | 30 min | "Surfaced Art Creator" quote. Must remove before any artist sees the platform. |
| TD04 | **WaitlistWelcome email — dead code** | Backend | Phase 2 | Alpha | 1-2 hours | Function exists but is never called and email isn't configured. Either wire it up or remove it. |
| TD05 | **MFA disabled for admin accounts** | Security | Phase 1 | Beta | 2-4 hours | Cognito supports it but it's turned off. Required before real artist data. |
| TD06 | **Secrets stored in environment variables** | Security, Infra | Phase 1 | Beta | 4-8 hours | Move to AWS SSM Parameter Store or Secrets Manager. |

### High

| ID | Debt Item | Silo | Introduced | Fix By | Est. Effort | Notes |
|----|-----------|------|-----------|--------|-------------|-------|
| TD07 | **Hardcoded ceramics link** in "Browse all" | Frontend | Phase 3 | Alpha | 30 min | Should link to /categories or similar |
| TD08 | **No React error boundaries** | Frontend | Phase 1 | Alpha | 2-4 hours | Unhandled errors crash the entire page |
| TD09 | **No custom 404/500 pages** | Frontend | Phase 1 | Alpha | 2-4 hours | Users see default Next.js error pages |
| TD10 | **Auth pages not marked noindex** | Frontend, SEO | Phase 2 | Alpha | 30 min | Login/signup pages indexed by search engines |
| TD11 | **No X-Request-Id middleware** | Backend | Phase 1 | Alpha | 1-2 hours | Can't trace requests across logs |
| TD12 | **CI workflow version skew** | Infra | Ongoing | Alpha | 1-2 hours | Different workflows use different versions of same actions |
| TD13 | **No skip-to-content landmark** | Frontend | Phase 1 | Alpha | 1 hour | Accessibility gap |
| TD14 | **Manual fetch patterns (no data-fetching library)** | Frontend | Phase 1 | MVP | 8-16 hours | Should adopt TanStack Query. Growing pain as more data fetching added. |
| TD15 | **No API versioning prefix** | Backend | Phase 1 | MMP | 4-8 hours | Currently `/artists/`, should be `/v1/artists/`. Breaking change — must version before external consumers exist. |
| TD16 | **PostHog opt-out by default** | Analytics | Phase 1 | Beta | 2-4 hours | GDPR-correct but means ~zero analytics data. Need consent banner strategy. |

### Medium

| ID | Debt Item | Silo | Introduced | Fix By | Est. Effort | Notes |
|----|-----------|------|-----------|--------|-------------|-------|
| TD17 | **No webhook idempotency** | Backend | Phase 2 | Beta | 4-8 hours | Stripe webhooks could process duplicate events |
| TD18 | **No budget alarm** | Infra | Phase 1 | Alpha | 1 hour | AWS costs uncapped with no alerting |
| TD19 | **No Sentry error tracking** | Frontend | Phase 1 | Beta | 4-8 hours | Only PostHog (maybe), no dedicated error tracking |
| TD20 | **No backup retention policy** | Infra | Phase 1 | Beta | 2-4 hours | RDS snapshots exist but no defined retention/verification |
| TD21 | **24 AI demo profiles in production** | Product | Phase 2 | Beta | 2-4 hours | Must be clearly labeled or replaced with real content before public access |
| TD22 | **No external uptime monitoring** | Infra | Phase 1 | GA | 2-4 hours | Only internal CloudWatch alarms, no external perspective |
| TD23 | **No Web Vitals monitoring** | Analytics | Phase 1 | MVP | 2-4 hours | No CWV data for performance baseline |

### Low

| ID | Debt Item | Silo | Introduced | Fix By | Est. Effort | Notes |
|----|-----------|------|-----------|--------|-------------|-------|
| TD24 | **No automated dependency updates** | Infra | Phase 1 | MMP | 2-4 hours | Dependabot configured but no auto-merge for patches |
| TD25 | **No CloudFront access logging** | Infra | Phase 1 | MMP | 2-4 hours | Can't analyze CDN traffic patterns |
| TD26 | **No DR testing** | Infra | Phase 1 | GA | 4-8 hours | Backups exist but never tested for restore |

---

## Debt by Stage Target

### Must fix for Alpha (11 items, ~15-25 hours)
TD01, TD02, TD03, TD04, TD07, TD08, TD09, TD10, TD11, TD12, TD13, TD18

### Must fix for Beta (6 items, ~20-35 hours)
TD05, TD06, TD16, TD17, TD19, TD20

### Must fix for MVP (3 items, ~12-24 hours)
TD14, TD21, TD23

### Must fix for MMP (3 items, ~10-16 hours)
TD15, TD24, TD25

### Must fix for GA (2 items, ~6-12 hours)
TD22, TD26

---

## Debt Prevention Policies

1. **No new security debt** — Security issues found during implementation must be fixed immediately, not deferred.
2. **Tests before code** — TDD prevents regression debt. No exceptions.
3. **Quality gates enforced** — All 5 gates pass before every commit. CI is not the first line of defense.
4. **No shortcuts policy** — Per CLAUDE.md, no workarounds that create future migration cost.
5. **Debt review at stage transitions** — Re-evaluate all debt items when transitioning between stages.
