# Gap Analysis

*Planning Session v1 — 2026-03-09*

---

## Purpose

This document identifies gaps between the current state of the platform and what's needed at each release stage. Gaps are categorized as:

- **Missing**: Feature/capability doesn't exist at all
- **Broken**: Feature exists but has known bugs or misconfigurations
- **Incomplete**: Feature partially built but needs finishing
- **Unverified**: Feature may work but hasn't been manually tested

---

## Current State Summary

**What's built**: A polished gallery platform with 22 page routes, 60+ API endpoints, full artist CRUD, admin API (30+ endpoints), Stripe Connect onboarding, two-environment infrastructure, 11 CI/CD workflows, PostHog integration, SEO fundamentals, and 24 AI demo artist profiles.

**What's not built**: Everything needed to sell art (checkout, payments, fulfillment, buyer accounts), admin UI (API-only), review system, blog, email campaigns, legal documents, and most growth/marketing infrastructure.

**What's broken/unknown**: Auth flow (known buggy), email configuration, PostHog API key (possibly not configured), fake testimonial on /for-artists, S3 CORS wildcard.

---

## Gap Matrix by Stage

### Alpha Gaps

| Gap | Type | Silo(s) | Severity | Existing Linear Issue? | Est. Effort |
|-----|------|---------|----------|----------------------|-------------|
| Auth/login flow bugs | Broken | Frontend, Backend | Critical | Needs triage | 4-8 hours |
| PostHog API key not configured in prod | Broken | Analytics | Critical | No | 30 min |
| Fake testimonial on /for-artists | Broken | Product, Growth | Critical | No | 30 min |
| WaitlistWelcome dead code | Incomplete | Backend | High | No | 1-2 hours |
| S3 CORS wildcard | Broken | Security, Infra | High | No | 1-2 hours |
| Admin UI (application review) | Missing | Frontend | High | SUR-194+ children | 16-24 hours |
| Custom 404/500 pages | Missing | Frontend | High | No | 2-4 hours |
| React error boundaries | Missing | Frontend | High | No | 2-4 hours |
| Skip-to-content landmark | Missing | Frontend | Medium | No | 1 hour |
| Auth pages noindex | Missing | Frontend, SEO | Medium | No | 30 min |
| X-Request-Id middleware | Missing | Backend | Medium | No | 1-2 hours |
| Hardcoded ceramics link | Broken | Frontend | Medium | No | 30 min |
| CI version alignment | Broken | Infra | Low | No | 1-2 hours |
| Budget alarm | Missing | Infra | Low | No | 1 hour |

**Alpha gap total: ~35-55 hours of work**

### Beta Gaps

| Gap | Type | Silo(s) | Severity | Existing Linear Issue? | Est. Effort |
|-----|------|---------|----------|----------------------|-------------|
| Brand identity (COO decisions) | Missing | Frontend, Growth | Critical | Partially — SUR-116 for OG | External dependency |
| Attorney engagement | Missing | Security, Product | Critical | No | External dependency |
| Artist agreement | Missing | Security, Legal | Critical | No | 4-8 hours (after attorney) |
| DMCA policy page | Missing | Security, Frontend | Critical | No | 2-4 hours (after attorney) |
| Dynamic OG images | Missing | Frontend, Growth | Critical | SUR-116 | 8-16 hours |
| GET /auth/me endpoint | Missing | Backend | High | SUR-195 | 4-8 hours |
| Founding artist badge | Missing | Frontend, Product | High | SUR-161 | 4-8 hours |
| MFA for admin | Missing | Security | High | No | 2-4 hours |
| Secrets migration | Missing | Security, Infra | High | No | 4-8 hours |
| Google OAuth | Missing | Infra, Frontend | High | No | 4-8 hours |
| Webhook idempotency | Missing | Backend | High | No | 4-8 hours |
| Artist terms tracking | Missing | Backend | Medium | No | 2-4 hours |
| Custom CDN domain | Missing | Infra | Medium | No | 2-4 hours |
| Sentry integration | Missing | Frontend | Medium | No | 4-8 hours |
| Email campaigns | Missing | Growth | Medium | No | 8-16 hours |
| 4 new PostHog events | Missing | Analytics | Medium | No | 4-8 hours |
| Analytics dashboards | Missing | Analytics | Medium | No | 4-8 hours |
| Social media presence | Missing | Growth | Medium | No | External (COO) |
| Backup retention policy | Missing | Infra | Low | No | 2-4 hours |
| PostHog consent strategy | Incomplete | Analytics | Low | No | 2-4 hours |

**Beta gap total: ~60-120 hours of engineering + 2 external dependencies (COO, attorney)**

### MVP Gaps

| Gap | Type | Silo(s) | Severity | Existing Linear Issue? | Est. Effort |
|-----|------|---------|----------|----------------------|-------------|
| Checkout UI flow | Missing | Frontend | Critical | Phase 4 issues | 24-40 hours |
| Payment capture (Stripe) | Missing | Backend | Critical | Phase 4 issues | 16-24 hours |
| Stripe webhook handling | Missing | Backend | Critical | Phase 4 issues | 8-16 hours |
| Order management | Missing | Backend, Frontend | Critical | Phase 4 issues | 16-24 hours |
| Buyer accounts | Missing | Frontend, Backend | Critical | Phase 4 issues | 16-24 hours |
| Shipping label generation | Missing | Backend | High | Phase 4 issues | 8-16 hours |
| PCI SAQ-A compliance | Missing | Security | High | No | 4-8 hours |
| WAF deployment | Missing | Infra, Security | High | No | 4-8 hours |
| Automated rollback | Missing | Infra | High | No | 4-8 hours |
| TanStack Query adoption | Missing | Frontend | Medium | No | 8-16 hours |
| Purchase funnel events | Missing | Analytics | Medium | No | 4-8 hours |
| Web Vitals monitoring | Missing | Analytics | Medium | No | 2-4 hours |
| Refund policy | Missing | Legal | Medium | No | 2-4 hours (after attorney) |
| Data deletion workflow | Missing | Backend, Security | Medium | No | 4-8 hours |
| IAM database auth | Missing | Infra | Low | No | 4-8 hours |

**MVP gap total: ~125-215 hours — the heaviest phase by far**

### MMP Gaps

| Gap | Type | Silo(s) | Severity | Existing Linear Issue? | Est. Effort |
|-----|------|---------|----------|----------------------|-------------|
| Review system | Missing | Backend, Frontend | High | Phase 4 issues | 16-24 hours |
| Blog infrastructure | Missing | Frontend, Growth | High | No | 8-16 hours |
| Referral program | Missing | Backend, Frontend | High | No | 16-24 hours |
| API versioning | Missing | Backend | High | No | 4-8 hours |
| Faceted search/filters | Missing | Frontend | Medium | No | 8-16 hours |
| Feature flags | Missing | Analytics | Medium | No | 4-8 hours |
| A/B testing framework | Missing | Analytics | Medium | No | 4-8 hours |
| Artist analytics API | Missing | Backend | Medium | No | 8-16 hours |
| Load testing | Missing | Infra | Medium | No | 4-8 hours |
| WCAG 2.1 AA audit | Missing | Frontend | Medium | No | 8-16 hours |
| Incident response plan | Missing | Security | Low | No | 4-8 hours |
| Penetration test | Missing | Security | Low | No | External |
| Commission transparency UI | Missing | Frontend | Low | No | 4-8 hours |

**MMP gap total: ~90-160 hours**

### GA Gaps

| Gap | Type | Silo(s) | Severity | Existing Linear Issue? | Est. Effort |
|-----|------|---------|----------|----------------------|-------------|
| Open artist applications | Missing | Frontend, Backend | High | No | 16-24 hours |
| Onboarding wizard | Missing | Frontend | High | No | 16-24 hours |
| International shipping | Missing | Backend | Medium | No | 8-16 hours |
| OAuth (Google, Apple) | Missing | Frontend, Infra | Medium | No | 8-16 hours |
| Commission automation | Missing | Backend | Medium | No | 8-16 hours |
| RDS Proxy | Missing | Infra | Medium | No | 4-8 hours |
| Multi-AZ RDS | Missing | Infra | Medium | No | 2-4 hours |
| X-Ray tracing | Missing | Infra | Low | No | 4-8 hours |
| Canary deployments | Missing | Infra | Low | No | 8-16 hours |
| DR testing | Missing | Infra | Low | No | 4-8 hours |
| Sales tax compliance | Missing | Legal, Backend | Low | No | 8-16 hours |
| External uptime monitoring | Missing | Infra | Low | No | 2-4 hours |

**GA gap total: ~90-160 hours**

---

## Summary: Effort by Stage

| Stage | Engineering Hours | External Dependencies | Linear Coverage |
|-------|------------------|----------------------|----------------|
| Alpha | 35-55 hours | None | Partial (admin UI has issues) |
| Beta | 60-120 hours | COO brand, Attorney | Partial (SUR-116, SUR-161, SUR-195) |
| MVP | 125-215 hours | Stripe completion | Partial (Phase 4 epics exist) |
| MMP | 90-160 hours | Pen test vendor | Low |
| GA | 90-160 hours | None | Very low |
| **Total** | **400-710 hours** | | |

---

## Cross-Cutting Gaps (Not Stage-Specific)

| Gap | Type | Notes |
|-----|------|-------|
| No manual QA has been done | Unverified | "Almost nothing has been manually verified" — user's words |
| Priority conflicts in Linear backlog | Process | 6 issues have conflicting stage assignments across agent plans |
| No regression test for email delivery | Missing | Emails configured but never verified end-to-end |
| Demo content strategy undefined | Process | When do 24 AI profiles get removed/replaced? |
| Artist onboarding process undefined | Process | High-touch vs self-serve? Script? Checklist? |

---

## Items with Existing Linear Issues

These gaps already have Linear issues and do NOT need new issues created in Phase 4:

| Gap | Linear Issue | Stage |
|-----|-------------|-------|
| Dynamic OG images | SUR-116 | Beta |
| Founding artist badge | SUR-161 | Beta |
| Admin UI (application review) | SUR-194 + children (SUR-404 through SUR-410) | Alpha |
| GET /auth/me | SUR-195 | Beta |
| Phase 4 transaction features | SUR-191 through SUR-195 (epics) | MVP |

---

## Items Needing NEW Linear Issues (Phase 4 Input)

All other gaps in this document need Linear issues created. See the deduplication in Phase 4 of the planning session.

**Rough count of new issues needed: ~45-55 items** (after deduplication across the 7 agent plans).
