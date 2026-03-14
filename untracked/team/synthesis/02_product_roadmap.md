# Product Roadmap

*Planning Session v1 — 2026-03-09*

---

## Vision

Surfaced Art is a curated digital gallery for handmade art. Artists are vetted and accepted. Buyers browse and purchase directly from artists. The platform takes 30% commission.

**Current state**: A polished gallery that cannot sell art. Artist profiles are gallery-quality. Complete artist self-service tools exist. But zero revenue capability — Phase 4 (transactions) is entirely unstarted.

---

## Stage Roadmap

### Alpha — Internal Testing (Target: ~2026-03-30)

**Theme**: "Fix what's broken, see what we have"

The platform works for browsing but has known bugs in auth, email configuration, and several UI issues. Alpha is about reaching internal confidence that the core experience is solid enough to show real artists.

**Key deliverables:**
1. Fix auth/login flow bugs (known issues, not yet triaged)
2. Fix email configuration (WaitlistWelcome is dead code)
3. Remove fake testimonial from /for-artists page
4. Verify PostHog API key is actually configured in production
5. Build minimal admin UI for application review (SUR-194 children)
6. Fix S3 CORS wildcard → restrict to actual origins
7. Fix hardcoded ceramics link in "Browse all"
8. Add custom 404/500 error pages
9. Add React error boundaries
10. Add skip-to-content accessibility landmark
11. Set auth pages to noindex
12. Add X-Request-Id middleware to API
13. Set up budget alarm ($75/mo threshold)
14. Align CI workflow action versions

**Exit criteria:** Team can demo the full browse experience without encountering errors. Admin can review artist applications via UI. Analytics data is actually flowing.

---

### Beta — Founding Artists (Target: ~2026-05-15)

**Theme**: "Impressive enough to invite artists"

Beta is the "Instagram bio link" threshold — when an artist can link to their Surfaced Art profile and feel proud. This requires real brand identity (not placeholder), dynamic social sharing images, and legal foundations.

**Key deliverables:**
1. **COO brand decisions applied** — font swap, color palette, logo (BLOCKER)
2. Dynamic OG images (SUR-116) — highest-leverage single item
3. Founding artist badge (SUR-161)
4. GET /auth/me endpoint (SUR-195)
5. Google OAuth credentials setup
6. Artist agreement (legal) — requires attorney
7. DMCA policy page — requires attorney
8. Artist terms acceptance tracking in API
9. Webhook idempotency
10. Custom CDN domain
11. MFA enforcement for admin accounts
12. Secrets migration begins
13. 4 new PostHog events + UTM parameter capture
14. Analytics dashboards built
15. Email campaign infrastructure
16. Social media presence established
17. Warm artist outreach begins (after 3+ real artists)
18. Lighthouse performance audit + fixes
19. Sentry error tracking integration
20. Backup retention policy configured

**Exit criteria:** 10-25 real artists have profiles. Brand identity is applied. Artists share their profile links on social media. OG images render correctly when shared. Legal docs in place.

**Critical dependency:** COO brand decisions and attorney engagement are both on the critical path. Engineering work can proceed in parallel, but Beta cannot ship without both.

---

### MVP — Purchase Loop (Target: ~2026-08-15)

**Theme**: "Money moves"

MVP is the heaviest engineering phase. The entire Phase 4 feature set (checkout, payments, fulfillment) must be built — roughly 25 issues. This is when Surfaced Art becomes a real marketplace.

**Key deliverables:**
1. Full checkout UI flow (cart → payment → confirmation)
2. Payment capture via Stripe
3. Stripe webhook handling (payment events)
4. Order management endpoints
5. Shipping label generation
6. Buyer account pages (order history, saved addresses)
7. PCI SAQ-A compliance documentation
8. WAF deployment
9. Automated rollback capability
10. TanStack Query adoption (frontend data fetching)
11. Purchase funnel analytics events
12. Web Vitals monitoring
13. PostHog alerts for key metrics
14. Refund policy (legal)
15. Data deletion workflow (GDPR)
16. IAM database authentication
17. Expanded monitoring alarms

**Exit criteria:** A buyer can discover art, purchase it, and the artist receives payment (minus commission). End-to-end money flow works. Error rates are monitored.

---

### MMP — Minimum Marketable Product (Target: ~2026-10-15)

**Theme**: "Worth telling people about"

MMP is when the platform is mature enough for cold outreach and organic growth. Social proof (reviews), content marketing (blog), and viral mechanics (referral program) are added.

**Key deliverables:**
1. Review system (submission UI + API)
2. Blog infrastructure
3. Referral program
4. Cold artist outreach begins (25+ artists)
5. API versioning prefix
6. Load testing
7. Faceted search / filters
8. Commission transparency dashboard for artists
9. WCAG 2.1 AA accessibility audit
10. Feature flags (PostHog)
11. A/B testing framework
12. Artist analytics API
13. CloudFront access logging
14. API response caching
15. Incident response plan
16. Penetration test
17. Automated dependency update workflow
18. Content marketing cadence established

**Exit criteria:** 25+ artists with live profiles. Real buyer reviews visible. Blog has 5+ posts. Referral program driving measurable signups. Platform handles load testing targets.

---

### GA — General Availability (Target: ~2026-12-31)

**Theme**: "Open for business"

GA is full operational maturity. Artist applications open to anyone. International shipping supported. Infrastructure scaled for growth.

**Key deliverables:**
1. Open artist applications (self-serve)
2. Guided onboarding wizard
3. International shipping support
4. OAuth (Google, Apple Sign In)
5. Commission calculation flow (automated)
6. RDS Proxy (connection pooling)
7. Multi-AZ RDS (high availability)
8. X-Ray distributed tracing
9. Canary deployments
10. DR testing
11. Sales tax compliance
12. Annual security review cadence
13. External uptime monitoring
14. Revenue ops dashboards
15. Session recording (PostHog)
16. PR / press outreach
17. Performance optimization pass

**Exit criteria:** Platform is self-sustaining. Artists apply and onboard without manual intervention. Buyers trust the platform (reviews, return policy). Infrastructure handles growth without manual scaling.

---

## Key Metrics by Stage

| Stage | Artists | Listings | Monthly Buyers | Revenue |
|-------|---------|----------|----------------|---------|
| Alpha | 0 (24 demo) | 0 (demo) | 0 | $0 |
| Beta | 10-25 | 50-125 | 0 (browse only) | $0 |
| MVP | 25-50 | 125-250 | 10-50 | First sales |
| MMP | 50-100 | 250-500 | 50-200 | Growing |
| GA | 100+ | 500+ | 200+ | Sustainable |

---

## Cost Trajectory

| Stage | Est. Monthly AWS Cost | Key Cost Drivers |
|-------|----------------------|------------------|
| Current | ~$55/mo | RDS, Lambda, S3, CloudFront |
| Beta | ~$75-100/mo | + Sentry, email service |
| MVP | ~$150-200/mo | + WAF, expanded monitoring, higher usage |
| MMP | ~$200-300/mo | + CloudFront logging, caching infra |
| GA | ~$250-400/mo | + RDS Proxy, Multi-AZ, X-Ray |

---

## What's NOT on the Roadmap

These are explicitly out of scope for all stages:
- Native mobile app
- Multi-currency support (beyond USD)
- Auction/bidding system
- Print-on-demand integration
- AI art curation/recommendation engine
- Social features (following, messaging between buyers)
- Wholesale/gallery partnerships
