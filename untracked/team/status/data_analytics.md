# Data/Analytics Status Report — 2026-03-09

## Current State Summary

PostHog is integrated into the frontend with a GDPR-compliant consent-first architecture, tracking three custom events plus pageviews. However, the PostHog API key appears to not yet be configured in production (commented out in `config/prod.env-reference`), meaning **no analytics data is likely being collected in production today**. Backend observability (CloudWatch logs, alarms, structured logging) is solid; frontend analytics and error tracking have significant gaps.

## Analytics Infrastructure

- **PostHog JS SDK** (`posthog-js ^1.360.0`) is the sole analytics provider — installed in `apps/web/package.json`
- **No Google Analytics, Mixpanel, Plausible, or other providers** are integrated
- **PostHog Provider** wraps the entire app in `layout.tsx` via `<AnalyticsProvider>` component
- **CSP headers** properly allow PostHog host (`us.i.posthog.com`) in `script-src` and `connect-src`
- **Env vars**: `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` — both are commented out in `config/prod.env-reference` and `config/dev.env-reference`, suggesting they may not be set in Vercel
- **Graceful degradation**: If `POSTHOG_KEY` is empty, the `AnalyticsProvider` renders children without PostHog — no errors, but no tracking
- **Linear issue SUR-97** ("privacy-friendly analytics") is marked **Done** (completed 2026-03-01), so the code integration is considered complete

## Event Tracking Coverage

### Events Being Tracked (3 custom + 1 automatic)
| Event | Where Fired | Properties |
|---|---|---|
| `$pageview` | `PostHogPageView` component on every client-side navigation | `$current_url` |
| `waitlist_signup` | `WaitlistForm.tsx` after successful API submission | (none) |
| `listing_view` | `ListingViewTracker.tsx` on mount | `listing_id`, `category` |
| `artist_profile_view` | `ArtistProfileViewTracker.tsx` on mount | `artist_slug` |
| `$pageleave` | Automatic (PostHog built-in, `capture_pageleave: true`) | (automatic) |

### User Actions With NO Tracking
- Category browse/navigation clicks
- Search queries and search result clicks
- Homepage section engagement (featured artists, featured listings, category grid)
- CTA button clicks (e.g., "For Artists" page CTAs)
- Cookie consent accept/decline rates
- Scroll depth on any page
- External link clicks (social links on artist profiles)
- Image gallery interactions on listing detail pages
- Dark/light theme toggle
- Any form interactions beyond waitlist (contact, etc.)

### Configuration Notes
- **Autocapture is disabled** (`autocapture: false`) — only explicit events fire
- **Opted out by default** (`opt_out_capturing_by_default: true`) — no data collected until user accepts cookies
- **Memory-only persistence** until consent granted, then switches to `localStorage+cookie`

## Funnel Definitions

**No funnels are defined.** There are no PostHog funnels, actions, or insights configured in code. The three custom events could theoretically construct a basic browse funnel (`$pageview` -> `listing_view` -> future purchase event), but:

- No purchase/checkout events exist (Phase 4 feature)
- No artist application funnel events exist (Phase 3 feature, not instrumented)
- Waitlist signup is a standalone event with no preceding funnel steps tracked
- Could not verify PostHog dashboard state (MCP tool access denied), but given env vars appear unset, likely no data exists

## Key Metrics Capability

| Metric | Can Measure? | Notes |
|---|---|---|
| Page views | Partially | Code exists but likely no data if PostHog key unset in prod |
| Unique visitors | Partially | PostHog would provide this, but only after consent + key setup |
| Traffic sources / referrers | No | No UTM tracking, no referrer capture in custom events |
| Waitlist signups (count) | Yes (API-side) | API tracks in database; PostHog event exists but may not fire |
| Waitlist conversion rate | No | No funnel connecting visit -> waitlist signup |
| Artist profile views | Partially | Event exists in code; no data if key unset |
| Listing views | Partially | Event exists in code; no data if key unset |
| Purchase conversion | No | No checkout/purchase events (Phase 4) |
| Artist signup/application | No | No application events (Phase 3 onboarding) |
| Bounce rate | No | No explicit tracking; PostHog `$pageleave` could help but only with data |
| Category popularity | Partially | `listing_view` has `category` property, but no category browse event |

## Error Tracking

- **No Sentry integration** — zero references to Sentry anywhere in the codebase
- **No frontend error tracking at all** — unhandled JS errors in production go completely undetected
- **Linear issue SUR-170** ("frontend error tracking with Sentry") exists in **Backlog**, labeled `blocked`, assigned to Phase 4
- **Backend errors**: Captured via CloudWatch structured JSON logging (`@surfaced/utils` logger, SUR-45/SUR-46 — Done)
- **CloudWatch alarms**: Lambda error rates, API Gateway 5xx, RDS connection exhaustion — all configured (SUR-42/SUR-43 — Done)
- **PostHog error tracking**: Not enabled (would require PostHog key to be set + explicit configuration)

## Performance Monitoring

- **No Web Vitals reporting** — no `reportWebVitals`, no `@next/web-vitals`, no performance tracking in the codebase
- **No frontend performance monitoring** of any kind
- **Backend performance**: API Gateway access logs capture request latency; structured logger includes `durationMs` on route handlers
- **CloudWatch dashboard** (SUR-44 — Done): Shows Lambda invocations, errors, duration, API Gateway latency, RDS connections — all backend metrics
- **No synthetic monitoring** — SUR-169 ("uptime monitoring and AWS budget alarm") is in Backlog, labeled `blocked`
- **Lighthouse/performance audit**: SUR-178 ("pre-launch SEO/accessibility checklist — Lighthouse targets") is in Backlog for Phase 4

## A/B Testing Readiness

- **No feature flag infrastructure** — zero references to feature flags in application code
- **No PostHog feature flags configured** (PostHog supports this natively but it's not wired up)
- **Linear issue SUR-184** ("feature flags strategy — env vars vs database table vs third-party") is in **Backlog** for Phase 4 — the architectural decision hasn't been made yet
- **No experiment infrastructure** of any kind
- **PostHog's built-in A/B testing** would be available once the SDK is properly connected, but requires feature flags first

## Key Findings

### What's Working Well
- **Clean analytics architecture**: The PostHog integration code is well-structured with proper separation (analytics.ts, posthog-provider.tsx, posthog-pageview.tsx), GDPR consent management, and typed event names
- **Backend observability is solid**: CloudWatch log groups, structured JSON logging, API Gateway access logs, CloudWatch alarms, health dashboard — all deployed via Terraform
- **GDPR compliance is built-in from day one**: Opt-out by default, memory-only persistence, consent banner, proper CSP headers
- **Test coverage**: Analytics module has comprehensive unit tests (consent flow, event tracking, provider rendering)
- **Cookie consent banner** is rendered in the main layout via `CookieConsent` component

### What's Not Working
- **PostHog likely not collecting any data in production** — env vars appear commented out/unset based on config reference files
- **Zero frontend error visibility** — no Sentry, no PostHog error tracking
- **Zero performance metrics** — no Web Vitals, no page load tracking
- **Very thin event coverage** — only 3 custom events for a platform with 6+ page types and dozens of user interactions
- **No funnels, dashboards, or insights defined** in PostHog

## Gaps & Concerns

1. **CRITICAL: PostHog API key may not be set in production.** The `prod.env-reference` has the PostHog vars commented out. If `NEXT_PUBLIC_POSTHOG_KEY` is empty, `isAnalyticsEnabled()` returns false and zero events fire. This needs immediate verification in Vercel project settings.

2. **No frontend error tracking.** The site could be throwing JS errors for real users and nobody would know. SUR-170 (Sentry) is blocked and in Phase 4 backlog — this gap may be acceptable pre-launch but becomes critical with real traffic.

3. **No traffic source attribution.** No UTM parameter capture, no referrer tracking. When the artist recruitment campaign starts driving traffic, there's no way to measure which channels are working.

4. **Consent-gated tracking means low data volume.** With `opt_out_capturing_by_default: true`, only users who click "Accept" on the cookie banner generate any analytics data. This is the right GDPR approach but means analytics will undercount significantly.

5. **No category/search analytics.** Category browsing and search are core navigation patterns but have zero event tracking. Can't measure which categories get the most interest.

6. **Artist analytics dashboard** is listed in deferred-work-items.md as post-launch — artists will have no visibility into their listing performance.

## Unplanned Work Discovered

These analytics/data needs are not tracked in any Linear issue:

1. **Verify PostHog API key is set in Vercel production environment** — zero-effort check that may explain why no data exists
2. **UTM parameter tracking** — capture `utm_source`, `utm_medium`, `utm_campaign` from URL params on first visit for traffic attribution (needed before artist recruitment campaign)
3. **Category browse tracking event** — track when users navigate category pages and which categories they browse
4. **Search query tracking** — track search terms and result click-through (search exists per SUR-333)
5. **Cookie consent acceptance rate tracking** — meta-metric: what percentage of visitors accept analytics cookies (server-side counter needed since PostHog can't track users who decline)
6. **Web Vitals / Core Web Vitals reporting** — needed for SEO (Google uses CWV as ranking signal) and UX monitoring; could pipe to PostHog or CloudWatch
7. **Homepage engagement events** — track which sections users interact with (featured artists, featured listings, category grid, waitlist CTA)
8. **PostHog dashboards and saved insights** — even with the SDK connected, no pre-built dashboards exist for the team to monitor key metrics
