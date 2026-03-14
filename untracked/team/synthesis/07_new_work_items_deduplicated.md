# New Work Items — Deduplicated

*Planning Session v1 — 2026-03-09*

This document is the deduplicated master list of all unplanned work discovered across 7 agent plans. Items are categorized as:

- **NEW ISSUE** — Needs a new Linear issue created
- **UPDATE** — Existing Linear issue needs status/priority/stage change
- **COO ACTION** — Non-engineering task for the COO (no Linear issue)

---

## Alpha Stage (13 items)

### NEW ISSUES (9 engineering items)

| # | Title | Labels | Est. | Sources |
|---|-------|--------|------|---------|
| A1 | `fix(infra): restrict S3 CORS to known origins` | infra, security | 1-2h | Infra, Security, Product |
| A2 | `fix(web): remove fake testimonial from /for-artists page` | frontend, growth | 30min | Growth, Product |
| A3 | `chore(analytics): verify PostHog API key in production environments` | analytics | 30min | Analytics |
| A4 | `fix(api): remove or wire WaitlistWelcome dead code` | backend | 1-2h | Backend |
| A5 | `feat(web): add custom 404 and 500 error pages` | frontend | 2-4h | Frontend |
| A6 | `feat(web): add React error boundaries` | frontend | 2-4h | Frontend |
| A7 | `feat(api): add X-Request-Id middleware for request tracing` | backend | 1-2h | Backend |
| A8 | `fix(web): fix hardcoded ceramics link in Browse All` | frontend | 30min | Frontend |
| A9 | `chore(ci): align action versions across deploy workflows` | infra, ci | 1-2h | Infra |

### SMALL FIXES (bundleable with other Alpha work)

| # | Title | Labels | Est. | Sources |
|---|-------|--------|------|---------|
| A10 | `fix(web): add noindex to auth pages` | frontend, seo | 30min | Frontend |
| A11 | `feat(web): add skip-to-content accessibility landmark` | frontend, a11y | 1h | Frontend |
| A12 | `chore(infra): add AWS budget alarm at $75/month` | infra | 1h | Infra |
| A13 | `chore(ci): add Dependabot config for GitHub Actions` | infra, ci | 1h | Infra |

### ADDITIONAL ALPHA ITEMS (from Product plan, not in other silos)

| # | Title | Labels | Est. | Sources |
|---|-------|--------|------|---------|
| A14 | `feat(web): intentional "Coming Soon" state on listing pages` | frontend, product | 4-8h | Product |
| A15 | `feat(api): application confirmation email template` | backend | 2-4h | Product, Growth |
| A16 | `chore(web): mobile responsiveness audit` | frontend | 4-8h | Product |
| A17 | `chore(analytics): add server-side cookie consent rate tracking` | analytics | 2-4h | Analytics |

**Alpha total: ~17 new issues, ~25-50 hours**

---

## Beta Stage (21 items)

### NEW ISSUES (15 engineering items)

| # | Title | Labels | Est. | Sources |
|---|-------|--------|------|---------|
| B1 | `feat(infra): enable Cognito MFA, require for admin accounts` | infra, security | 2-4h | Infra, Security |
| B2 | `feat(api): add Stripe webhook idempotency` | backend | 4-8h | Backend |
| B3 | `feat(api): add artist terms acceptance tracking (termsAcceptedAt)` | backend | 2-4h | Backend |
| B4 | `feat(web): add /dmca policy page` | frontend, legal | 2-3h | Security |
| B5 | `feat(web): add /content-guidelines page` | frontend, legal | 2-3h | Security |
| B6 | `feat(api): structured JSON application logging` | backend, infra | 4-8h | Infra |
| B7 | `feat(web): social sharing buttons on artist profiles and listings` | frontend | 4-8h | Product |
| B8 | `feat(web): founder/team story page or section` | frontend, growth | 4-8h | Growth, Product |
| B9 | `feat(web): waitlist social proof display ("Join X others")` | frontend, growth | 2-4h | Growth |
| B10 | `feat(web): price range display on category/browse pages` | frontend | 4-8h | Product |
| B11 | `feat(api): artist-aware waitlist (per-artist interest tracking)` | backend, frontend | 8-16h | Product |
| B12 | `feat(api): guided onboarding email sequence for new artists` | backend | 4-8h | Product |
| B13 | `feat(analytics): add category browse + homepage engagement tracking events` | analytics | 3-5h | Analytics |
| B14 | `feat(analytics): add UTM parameter capture as PostHog person properties` | analytics | 2-3h | Analytics |
| B15 | `feat(analytics): enrich existing events + add base properties middleware` | analytics | 3-5h | Analytics |

### NEW ISSUES (PostHog dashboards — no-code)

| # | Title | Labels | Est. | Sources |
|---|-------|--------|------|---------|
| B16 | `chore(analytics): create PostHog dashboards (Site Health, Browse, Artist Quality)` | analytics | 3-4h | Analytics |

### NEW ISSUES (tracking events — small)

| # | Title | Labels | Est. | Sources |
|---|-------|--------|------|---------|
| B17 | `feat(analytics): add image gallery + social link click tracking` | analytics | 3-5h | Analytics |

### UPDATES TO EXISTING ISSUES

| # | Linear Issue | Change Needed | Source |
|---|-------------|---------------|--------|
| B-U1 | SUR-161 (Founding artist badge) | Unblock → Ready for Beta | Frontend, Product |
| B-U2 | SUR-163 (Secrets Manager migration) | Unblock → schedule for Beta | Security, Infra |
| B-U3 | SUR-178 (Lighthouse audit) | Move from Backlog → Beta required | Frontend |
| B-U4 | SUR-195 (Frontend auth infrastructure) | Move from Backlog → Beta required, blocks admin UI | Security |

### COO ACTIONS (no Linear issue)

- Attorney engagement for legal review (CRITICAL PATH)
- DMCA agent registration with Copyright Office
- Google Cloud project + OAuth consent screen setup
- Social media account creation (Instagram, Pinterest)
- Artist onboarding guide content
- Recruit 3-5 founding artists

**Beta total: ~17 new issues + 4 updates, ~50-95 hours engineering**

---

## MVP Stage (16 items)

### NEW ISSUES

| # | Title | Labels | Est. | Sources |
|---|-------|--------|------|---------|
| M1 | `feat(web): checkout page UX design + implementation` | frontend | 24-40h | Frontend |
| M2 | `feat(web): buyer account pages (orders, addresses)` | frontend | 16-24h | Frontend |
| M3 | `feat(web): artist dashboard order management pages` | frontend | 16-24h | Frontend |
| M4 | `feat(web): install toast/notification component (Sonner)` | frontend | 2-4h | Frontend |
| M5 | `feat(web): empty state design variants for new sections` | frontend | 4-8h | Frontend |
| M6 | `refactor(api): split me.ts route file (1500+ lines)` | backend | 4-8h | Backend |
| M7 | `spike(api): Shippo API integration research for art packages` | backend | 2-4h | Backend |
| M8 | `feat(web): shipping cost preview on listing detail pages` | frontend, backend | 16-24h | Product |
| M9 | `feat(analytics): add purchase funnel + search + onboarding events` | analytics | 7-10h | Analytics |
| M10 | `chore(analytics): create PostHog dashboards (Purchase, Search, Errors)` | analytics | 3-4h | Analytics |
| M11 | `chore(analytics): set up PostHog alerts for critical metrics` | analytics | 1-2h | Analytics |
| M12 | `chore(compliance): complete PCI SAQ-A self-assessment` | security | 4-8h | Security |
| M13 | `docs(infra): document secret rotation procedures` | infra, security | 4-8h | Infra, Security |
| M14 | `feat(growth): waitlist-to-buyer conversion email campaign` | backend, growth | 8-16h | Product |
| M15 | `feat(web): blog/content infrastructure (MDX or headless CMS)` | frontend, growth | 8-16h | Growth, Product |
| M16 | `chore(web): mobile checkout testing on real devices` | frontend | 4-8h | Frontend |

### UPDATES TO EXISTING ISSUES

| # | Linear Issue | Change Needed | Source |
|---|-------------|---------------|--------|
| M-U1 | SUR-170 (Sentry) | Unblock → MVP required | Analytics |
| M-U2 | SUR-121 (Client-side state management) | Move from Backlog → MVP required | Frontend |
| M-U3 | SUR-102 (Commissions) | Clarify: GA not MVP | Backend |

### PRODUCT DECISIONS NEEDED (before MVP implementation)

- Payout hold period: release on delivery confirmation or hold N days?
- Tax collection strategy: merchant of record, nexus, Stripe Tax?
- Checkout flow: single-page vs multi-step? Guest checkout?

**MVP total: ~16 new issues + 3 updates, ~125-215 hours**

---

## MMP Stage (13 items)

### NEW ISSUES

| # | Title | Labels | Est. | Sources |
|---|-------|--------|------|---------|
| P1 | `feat(web): review display components (star ratings, cards)` | frontend | 8-16h | Frontend |
| P2 | `feat(api): API versioning prefix (/v1/)` | backend | 4-8h | Backend |
| P3 | `fix(api): narrow Vercel preview CORS to team scope` | backend, security | 1h | Infra, Security |
| P4 | `feat(api): add rate limits to public read endpoints` | backend, security | 2-3h | Infra, Security |
| P5 | `chore(infra): automated backup restore test (monthly cron)` | infra | 4-8h | Infra |
| P6 | `docs(security): create incident response plan` | security | 4-8h | Security |
| P7 | `feat(api): artist-facing analytics API (view counts, trends)` | backend, analytics | 8-12h | Analytics, Product |
| P8 | `feat(web): press/media kit page` | frontend, growth | 4-8h | Growth |
| P9 | `feat(web): category page editorial content` | frontend, growth, seo | 4-8h | Growth |
| P10 | `feat(api): artist referral tracking mechanism` | backend | 24-40h | Product |
| P11 | `feat(web): commission inquiry UX flow` | frontend | 8-16h | Frontend |

### UPDATES TO EXISTING ISSUES

| # | Linear Issue | Change Needed | Source |
|---|-------------|---------------|--------|
| P-U1 | SUR-184 (Feature flags) | Resolve ADR: use PostHog flags | Analytics |
| P-U2 | SUR-177 (Load testing) | Unblock → schedule for MMP | Backend |
| P-U3 | SUR-7 (Admin order mgmt) | Close as duplicate of SUR-146 | Backend |
| P-U4 | SUR-8 (Admin review moderation) | Move to MMP alongside SUR-101 | Backend |
| P-U5 | SUR-10 (Admin impersonation) | Move to GA (SUR-151 sufficient) | Backend |

### COO ACTIONS

- Third-party penetration test (budget approval)
- Part-time content contributor (budget decision)
- Artist shareable assets ("I sell on SA" graphics)

**MMP total: ~11 new issues + 5 updates, ~70-130 hours**

---

## GA Stage (4 items)

### NEW ISSUES

| # | Title | Labels | Est. | Sources |
|---|-------|--------|------|---------|
| G1 | `feat(web): buyer-focused landing page ("Why buy from SA")` | frontend, growth | 8-16h | Growth |
| G2 | `feat(web): guided artist onboarding wizard` | frontend | 16-24h | Frontend |

### UPDATES TO EXISTING ISSUES

| # | Linear Issue | Change Needed | Source |
|---|-------------|---------------|--------|
| G-U1 | SUR-119 (On-demand ISR) | Confirm GA timing (not MVP) | Frontend |
| G-U2 | SUR-201 (Sensitive content flag) | Move to MMP (not Beta) | Frontend |

### COO ACTIONS

- Sales tax nexus analysis (accountant)
- Apple Developer Program enrollment ($99/yr)

**GA total: ~2 new issues + 2 updates**

---

## Summary

| Category | Count |
|----------|-------|
| **New Linear issues to create** | ~63 |
| **Existing issues to update** | ~14 |
| **COO action items** | ~12 |
| **Product decisions needed** | ~3 |
| **Total engineering effort (all stages)** | ~400-700 hours |

### Deduplication Notes

Items found by multiple agents that were merged:
1. **S3 CORS fix** — found by Infra, Security, Product (→ A1)
2. **Fake testimonial removal** — found by Growth, Product (→ A2)
3. **Cognito MFA** — found by Infra, Security (→ B1)
4. **Vercel preview CORS** — found by Infra, Security (→ P3)
5. **Public read rate limiting** — found by Infra, Security (→ P4)
6. **Blog infrastructure** — found by Growth, Product (→ M15)
7. **Founder/team story page** — found by Growth, Product (→ B8)
8. **Application confirmation email** — found by Growth, Product (→ A15)
9. **Secret rotation** — found by Infra, Security (→ M13)
10. **Automated dependency updates** — found by Infra, Security (→ merged with Dependabot A13)
