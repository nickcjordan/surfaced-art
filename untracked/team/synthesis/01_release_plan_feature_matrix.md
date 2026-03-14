# Release Plan & Feature Matrix

*Planning Session v1 — 2026-03-09*

---

## Release Stage Definitions

| Stage | Name | Target Audience | Success Criteria | Est. Timeline |
|-------|------|----------------|-------------------|---------------|
| **Alpha** | Internal Testing | Team only | All critical bugs fixed, admin can review applications | 2-3 weeks |
| **Beta** | Founding Artists | 10-25 invited artists | Artists can sign up, build profiles, list work; brand identity applied | 4-6 weeks after Alpha |
| **MVP** | Purchase Loop | Beta artists + early buyers | Complete purchase flow end-to-end; money moves | 8-12 weeks after Beta |
| **MMP** | Minimum Marketable Product | Broader artist outreach + organic buyers | Reviews, referral program, blog, cold outreach viable | 6-8 weeks after MVP |
| **GA** | General Availability | Public | Open applications, international shipping, full ops maturity | 8-12 weeks after MMP |

**Total estimated timeline: Alpha in ~3 weeks, GA in ~9-12 months from today.**

---

## Feature Matrix by Stage

### Legend
- `[x]` = Already built
- `[A]` = Alpha
- `[B]` = Beta
- `[M]` = MVP
- `[P]` = MMP
- `[G]` = GA
- `[-]` = Not planned / out of scope

### Frontend / UX

| Feature | Stage | Notes |
|---------|-------|-------|
| 22 page routes | `[x]` | Built in Phases 1-3 |
| 11 ShadCN components | `[x]` | |
| Fix hardcoded ceramics link | `[A]` | Browse all → /categories |
| Skip-to-content landmark | `[A]` | Accessibility |
| Custom 404/500 pages | `[A]` | |
| React error boundaries | `[A]` | |
| Auth pages `noindex` | `[A]` | SEO hygiene |
| Admin UI — application review | `[A]` | SUR-194 children, minimal viable admin |
| Brand token swap (COO decisions) | `[B]` | **BLOCKER** — waiting on COO |
| Dynamic OG images | `[B]` | SUR-116, highest-leverage growth item |
| Founding artist badge | `[B]` | SUR-161 |
| Lighthouse performance audit | `[B]` | |
| Sentry error tracking | `[B]` | |
| Checkout UI flow | `[M]` | Full cart → payment → confirmation |
| Buyer account pages | `[M]` | Order history, saved addresses |
| TanStack Query adoption | `[M]` | Replace manual fetch patterns |
| Review submission UI | `[P]` | |
| Faceted search / filters | `[P]` | |
| WCAG 2.1 AA audit | `[P]` | |
| Guided onboarding wizard | `[G]` | |
| OAuth (Google, Apple) | `[G]` | |
| Performance optimization pass | `[G]` | |

### Backend / API

| Feature | Stage | Notes |
|---------|-------|-------|
| 60+ endpoints (artists, listings, admin) | `[x]` | |
| Stripe Connect onboarding | `[x]` | |
| Fix/remove WaitlistWelcome dead code | `[A]` | |
| X-Request-Id middleware | `[A]` | |
| GET /auth/me endpoint | `[B]` | SUR-195 |
| Webhook idempotency | `[B]` | |
| Artist terms acceptance tracking | `[B]` | |
| Checkout/payment/fulfillment chain | `[M]` | ~25 issues, heaviest backend phase |
| Payment capture + Stripe webhooks | `[M]` | |
| Order management endpoints | `[M]` | |
| Review system API | `[P]` | |
| API versioning prefix | `[P]` | |
| Secrets migration (SSM/Secrets Manager) | `[P]` | |
| Load testing | `[P]` | |
| Commission calculation flow | `[G]` | |
| Feature flags integration | `[G]` | |
| WAF integration | `[G]` | |

### Infrastructure / DevOps

| Feature | Stage | Notes |
|---------|-------|-------|
| Two-environment Terraform (dev/prod) | `[x]` | |
| 11 CI/CD workflows | `[x]` | |
| CloudWatch alarms | `[x]` | |
| S3 CORS wildcard fix | `[A]` | Security — restrict to actual origins |
| Budget alarm ($75 threshold) | `[A]` | |
| CI workflow version alignment | `[A]` | |
| Google OAuth credentials | `[B]` | |
| Custom CDN domain | `[B]` | |
| Backup retention policy | `[B]` | |
| WAF deployment | `[M]` | |
| Secrets → SSM migration | `[M]` | |
| Automated rollback | `[M]` | |
| Monitoring alarm expansion | `[M]` | |
| CloudFront access logging | `[P]` | |
| IAM database auth | `[P]` | |
| API response caching | `[P]` | |
| RDS Proxy | `[G]` | When concurrency demands |
| Multi-AZ RDS | `[G]` | |
| X-Ray tracing | `[G]` | |
| Canary deployments | `[G]` | |

### Security / Compliance

| Feature | Stage | Notes |
|---------|-------|-------|
| Cognito JWT auth + RBAC | `[x]` | |
| Zod input validation | `[x]` | |
| Security headers | `[x]` | |
| CI security gating | `[x]` | |
| S3 CORS fix | `[A]` | Shared with Infra |
| Attorney engagement for legal docs | `[B]` | **CRITICAL PATH** |
| Artist agreement (legal) | `[B]` | |
| DMCA policy page (frontend) | `[B]` | |
| MFA enforcement (admin) | `[B]` | Currently OFF |
| Secrets migration | `[B]` | |
| Admin auth hardening | `[B]` | |
| PCI SAQ-A compliance | `[M]` | Required for payments |
| WAF rules | `[M]` | |
| IAM database auth | `[M]` | |
| Refund policy (legal) | `[M]` | |
| Data deletion workflow | `[M]` | GDPR |
| Incident response plan | `[P]` | |
| Penetration test | `[P]` | |
| Automated dependency updates | `[P]` | |
| DR testing | `[G]` | |
| Sales tax compliance | `[G]` | |
| Annual security review cadence | `[G]` | |

### Growth / Marketing

| Feature | Stage | Notes |
|---------|-------|-------|
| /for-artists page | `[x]` | Polished with scroll animations |
| SEO fundamentals | `[x]` | |
| Waitlist capture | `[x]` | |
| Remove fake testimonial | `[A]` | "Surfaced Art Creator" — must go before artist outreach |
| Dynamic OG images | `[B]` | SUR-116, unlocks Growth Loop #1 |
| Email campaign infrastructure | `[B]` | |
| Social media presence | `[B]` | |
| Artist outreach — warm | `[B]` | After 3+ real artists onboarded |
| Blog infrastructure | `[P]` | |
| Referral program | `[P]` | |
| Artist outreach — cold | `[P]` | 25+ artists, real testimonials |
| Content marketing cadence | `[P]` | |
| PR / press outreach | `[G]` | |
| Paid acquisition channels | `[G]` | |

### Data / Analytics

| Feature | Stage | Notes |
|---------|-------|-------|
| PostHog JS SDK (3 custom events) | `[x]` | |
| GDPR consent-first architecture | `[x]` | |
| Verify PostHog API key in prod | `[A]` | **CRITICAL** — may not be configured |
| 4 new tracking events + UTM capture | `[B]` | |
| Analytics dashboards | `[B]` | |
| Purchase funnel events | `[M]` | |
| Sentry error tracking | `[M]` | Shared with Frontend |
| Web Vitals monitoring | `[M]` | |
| PostHog alerts | `[M]` | |
| Feature flags | `[P]` | |
| A/B testing framework | `[P]` | |
| Artist analytics API | `[P]` | |
| Uptime monitoring (external) | `[G]` | |
| Revenue ops dashboards | `[G]` | |
| Session recording | `[G]` | |

### Product / Artist Experience

| Feature | Stage | Notes |
|---------|-------|-------|
| Gallery-quality artist profiles | `[x]` | |
| Artist self-service tools | `[x]` | |
| 24 AI demo profiles | `[x]` | |
| Admin application review (API-only→UI) | `[A]` | |
| Fake testimonial removal | `[A]` | |
| Artist agreement flow | `[B]` | Legal dependency |
| Founding artist badge | `[B]` | SUR-161 |
| Real artist onboarding (3-5) | `[B]` | Manual, high-touch |
| Full purchase flow | `[M]` | Phase 4 — the heavy lift |
| Order management | `[M]` | |
| Shipping label generation | `[M]` | |
| Review system | `[P]` | |
| Commission transparency dashboard | `[P]` | |
| Open artist applications | `[G]` | |
| International shipping | `[G]` | |

---

## Critical Path

```
Alpha (2-3 weeks)
  ├── Bug fixes (auth flow, emails, hardcoded links)
  ├── PostHog API key verification
  ├── Fake testimonial removal
  ├── Minimal admin UI (application review)
  └── S3 CORS fix
        │
        ▼
Beta (4-6 weeks after Alpha)
  ├── COO brand decisions ← BLOCKER
  ├── Attorney engagement ← CRITICAL PATH (legal docs)
  ├── Dynamic OG images (SUR-116)
  ├── Google OAuth
  ├── Founding artist badge
  ├── Real artist onboarding (3-5 artists)
  └── Artist agreement flow
        │
        ▼
MVP (8-12 weeks after Beta) ← HEAVIEST PHASE
  ├── Entire Phase 4 (checkout, payments, fulfillment)
  ├── Buyer accounts
  ├── PCI SAQ-A compliance
  ├── WAF deployment
  └── Purchase funnel analytics
        │
        ▼
MMP (6-8 weeks after MVP)
  ├── Review system
  ├── Blog + content marketing
  ├── Referral program
  ├── Cold artist outreach begins
  └── A/B testing framework
        │
        ▼
GA (8-12 weeks after MMP)
  ├── Open applications
  ├── International shipping
  ├── Full operational maturity
  └── DR testing + annual review cadence
```

---

## Blockers & Dependencies

| Blocker | Blocks | Owner | Stage |
|---------|--------|-------|-------|
| COO brand identity decisions | Brand token swap, all visual polish | COO | Beta |
| Attorney engagement | Artist agreement, DMCA page, refund policy | COO/Legal | Beta |
| PostHog API key verification | All analytics data collection | Engineering | Alpha |
| Stripe Connect completion | All payment flows | Engineering | MVP |
| PCI SAQ-A | Payment processing go-live | Engineering/Legal | MVP |
