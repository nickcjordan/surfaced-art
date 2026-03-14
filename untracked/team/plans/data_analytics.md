# Data/Analytics Stage Plan — 2026-03-09

## Executive Summary

PostHog is integrated with clean, GDPR-compliant architecture but is almost certainly not collecting data in production (API key appears unset). The analytics codebase has only 3 custom events for a platform with 6+ page types. This plan stages analytics work so each release has the data visibility it needs — starting with the critical fix of actually turning PostHog on.

---

## Alpha

**Goal**: Confirm analytics infrastructure works end-to-end. See basic traffic data flowing.

### What Must Be Completed

1. **Verify and set PostHog API key in Vercel production environment**
   - Check `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` in Vercel project settings (both prod and preview)
   - If unset, set them. This is a 5-minute task that unblocks all analytics work.
   - Verify events appear in PostHog after deployment by visiting the site, accepting cookies, and checking PostHog's Live Events view.

2. **Verify PostHog API key in dev/preview environments**
   - Set env vars in Vercel preview environment settings so PR previews also generate data (or use a separate PostHog project to avoid polluting prod data).

3. **Create a "Site Health" PostHog dashboard**
   - Daily active visitors (unique `$pageview` users)
   - Total pageviews by page
   - Cookie consent acceptance rate (see item 4)
   - Top pages by view count

4. **Add server-side cookie consent tracking**
   - PostHog can't track users who decline cookies. Add a lightweight server-side counter (API endpoint or edge function) that increments on consent grant/deny without storing PII.
   - This is a meta-metric: tells you what percentage of your traffic you're actually measuring.

5. **Validate existing events fire correctly**
   - Manually test `waitlist_signup`, `listing_view`, `artist_profile_view`, and `$pageview` in PostHog Live Events after key is set.
   - Confirm `$pageleave` fires automatically.

### Exit Criteria

- [ ] PostHog Live Events shows real pageview and custom event data from the production deployment
- [ ] "Site Health" dashboard exists in PostHog with at least daily visitors and pageview counts
- [ ] Team can answer "how many people visited the site yesterday?" from the dashboard
- [ ] Consent acceptance rate is being tracked (even if just via server logs initially)

### Dependencies

- Vercel project settings access (to set env vars)
- PostHog project access (to create dashboards)

### Risks

- **Consent-gated tracking will undercount significantly.** With `opt_out_capturing_by_default: true`, only users who accept cookies generate data. This is correct for GDPR but means analytics will show a fraction of actual traffic. The server-side consent counter mitigates this for overall volume metrics.
- **If PostHog project doesn't exist yet**, someone needs to create it and get the API key. This is a prerequisite blocker.

---

## Beta (Closed)

**Goal**: Understand how invited artists and early visitors engage with artist profiles, listings, and category browsing. Provide enough data to validate "do artists want to be here?"

### What Must Be Completed

1. **Add category browse tracking event**
   - New event: `category_browse` — fired when a user navigates to a category page
   - Properties: `category` (slug), `source` (header nav, footer, category grid, breadcrumb)
   - Tells us which categories attract the most browsing interest

2. **Add homepage section engagement events**
   - New event: `homepage_section_click` — fired when a user clicks into a featured artist, featured listing, or category grid item from the homepage
   - Properties: `section` (featured_artists, featured_listings, category_grid), `target_type` (artist, listing, category), `target_id` (slug or ID), `position` (index in the list)
   - Answers: "What do people click first on the homepage?"

3. **Add UTM parameter capture**
   - On first pageview, extract `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` from URL and set as PostHog person properties via `posthog.register()` or `posthog.people.set_once()`
   - Critical for measuring which artist recruitment channels work

4. **Add image gallery interaction tracking** (listing detail page)
   - New event: `listing_image_interact` — fired when user swipes/clicks through gallery images
   - Properties: `listing_id`, `image_index`, `action` (next, previous, thumbnail_click, zoom)
   - Proxy for purchase intent: users who browse multiple images are more engaged

5. **Add social link click tracking** (artist profiles)
   - New event: `social_link_click` — fired when a user clicks an external social link on an artist profile
   - Properties: `artist_slug`, `platform` (instagram, website, etc.), `url`
   - Important: if artists are putting our link in their Instagram bio, we should track outbound clicks back to their profiles too

6. **Enrich existing events with more properties**
   - `artist_profile_view`: add `referrer_page` (internal, e.g., "homepage", "category", "search", "direct")
   - `listing_view`: add `artist_slug`, `price_cents` (enables revenue-weighted analytics later)

7. **Create "Browse Behavior" PostHog dashboard**
   - Top 10 most viewed artist profiles
   - Top 10 most viewed listings
   - Category browse distribution (pie/bar chart)
   - Homepage click-through rate by section
   - Average pages per session

8. **Create "Artist Profile Quality" dashboard**
   - Per-artist profile view count
   - Per-artist listing view count
   - Social link click-through rate per artist
   - Image gallery engagement depth per listing (average images viewed)
   - This dashboard answers the Beta question: "Are artist profiles compelling enough?"

9. **Define and save key funnels in PostHog**
   - Browse funnel: `$pageview` (homepage) -> `category_browse` -> `listing_view`
   - Artist discovery funnel: `$pageview` (homepage) -> `artist_profile_view` -> `listing_view`
   - Waitlist funnel: `$pageview` (any) -> `waitlist_signup`

### Exit Criteria

- [ ] All 6 new custom events fire correctly in production (verified via PostHog Live Events)
- [ ] UTM parameters are captured and visible as person properties in PostHog
- [ ] "Browse Behavior" and "Artist Profile Quality" dashboards exist and show real data
- [ ] 3 funnels are saved in PostHog
- [ ] Team can answer "which artist profiles get the most engagement?" from the dashboard
- [ ] Team can answer "which recruitment channel drove the most signups?" via UTM data

### Dependencies

- Alpha analytics work complete (PostHog actually collecting data)
- Beta artists onboarded with real profiles (otherwise dashboards show seed data)
- Search functionality deployed (SUR-333) if search tracking is to be included

### Risks

- **Low data volume.** 10-25 artists + their networks = maybe 100-500 visitors/week. Statistical significance on funnels will be impossible. Use analytics directionally, not as decision-proof.
- **Artist sensitivity.** If artists can see their own view counts (future feature), low numbers early on could be demoralizing. Don't expose per-artist metrics to artists until traffic justifies it.

---

## MVP

**Goal**: Track the full purchase loop end-to-end. Measure conversion from browse to buy. Detect problems in the checkout flow.

### What Must Be Completed

1. **Add purchase funnel events**
   - `add_to_cart` — Properties: `listing_id`, `artist_slug`, `price_cents`, `category`
   - `checkout_started` — Properties: `listing_id`, `price_cents`, `payment_method`
   - `checkout_completed` — Properties: `listing_id`, `artist_slug`, `price_cents`, `commission_cents`, `order_id`
   - `checkout_abandoned` — Properties: `listing_id`, `price_cents`, `step` (shipping, payment, confirmation), `time_in_checkout_seconds`
   - These are the most important events in the entire platform. No marketplace works without understanding purchase conversion.

2. **Add artist onboarding funnel events** (if artist self-service onboarding exists at MVP)
   - `artist_application_started`
   - `artist_application_submitted`
   - `artist_profile_setup_completed`
   - `artist_first_listing_created`
   - Properties: `artist_id`, `step`, `time_spent_seconds`

3. **Add search tracking events**
   - `search_performed` — Properties: `query`, `result_count`, `filters_applied`
   - `search_result_clicked` — Properties: `query`, `result_type` (artist, listing), `result_id`, `position`
   - `search_no_results` — Properties: `query` (critical for understanding inventory gaps)

4. **Implement frontend error tracking**
   - SUR-170: Integrate Sentry for frontend error tracking
   - Configure Sentry to capture unhandled exceptions, unhandled promise rejections, and React error boundaries
   - Set up Sentry alerts for new error types and error rate spikes
   - This was acceptable to skip pre-launch but is mandatory once real money flows through the platform

5. **Add Web Vitals reporting**
   - SUR-178: Implement Core Web Vitals (LCP, FID/INP, CLS) reporting
   - Pipe to PostHog as events or use PostHog's built-in web vitals capture
   - Google uses CWV as a ranking signal — matters for organic discovery

6. **Create "Purchase Funnel" dashboard**
   - Conversion rate: listing_view -> add_to_cart -> checkout_started -> checkout_completed
   - Cart abandonment rate and stage
   - Average order value
   - Revenue by category
   - Revenue by artist (top 10)
   - Time from first visit to purchase

7. **Create "Search Effectiveness" dashboard**
   - Top search queries
   - No-results queries (inventory gap signal)
   - Search -> listing_view -> purchase conversion
   - Search result click-through rate

8. **Create "Error & Performance" dashboard**
   - Sentry error count trend
   - Top 5 errors by frequency
   - Web Vitals scores (LCP, INP, CLS) — p50 and p95
   - Pages with worst performance

9. **Set up PostHog Alerts**
   - Alert if daily unique visitors drops > 50% day-over-day (site outage signal)
   - Alert if checkout_abandoned rate exceeds 80%
   - Alert if zero checkout_completed events in 24 hours (payment processing may be broken)

### Exit Criteria

- [ ] Full purchase funnel is tracked: listing_view -> add_to_cart -> checkout_started -> checkout_completed
- [ ] Checkout abandonment is tracked with stage granularity
- [ ] Search events fire and populate the Search Effectiveness dashboard
- [ ] Sentry is integrated and capturing frontend errors
- [ ] Web Vitals are reported
- [ ] Purchase Funnel, Search, and Error dashboards exist with real data
- [ ] PostHog alerts configured for critical metrics
- [ ] Team can answer "what is our listing-to-purchase conversion rate?" from the dashboard
- [ ] Team can answer "where do buyers drop off in checkout?" from the funnel

### Dependencies

- Checkout/payment flow implemented (Phase 4 feature)
- Search functionality deployed (SUR-333)
- Sentry account created and DSN available
- Artist onboarding flow implemented (if tracking those events)

### Risks

- **Purchase event accuracy is critical.** If `checkout_completed` fires but payment actually failed (or vice versa), revenue metrics will be wrong. Ensure the event fires server-side or after confirmed payment webhook, not on client-side optimism.
- **PII in search queries.** Users might search for artist names or personal terms. Ensure search query tracking complies with privacy policy. PostHog's data is EU-hosted but still needs policy coverage.
- **Sentry costs.** Free tier covers 5K errors/month. Monitor volume and set rate limits.

---

## MMP (Minimum Marketable Product)

**Goal**: Understand growth levers. Optimize artist acquisition funnel. A/B test key experiences. Provide artists with basic performance visibility.

### What Must Be Completed

1. **Implement feature flags via PostHog**
   - SUR-184: Resolve the feature flags architecture decision — recommend PostHog's built-in feature flags since the SDK is already integrated
   - Wire up PostHog feature flag evaluation in the frontend
   - This unblocks A/B testing for all subsequent experiments

2. **First A/B tests**
   - Homepage hero variant test (different messaging/imagery)
   - Listing page layout test (image gallery position, CTA placement)
   - "For Artists" page CTA variant test
   - Each test needs: hypothesis, primary metric, sample size estimate, duration

3. **Add traffic attribution sophistication**
   - First-touch vs. last-touch attribution tracking
   - Referrer domain capture (organic, social, direct, paid)
   - Create "Acquisition Channels" dashboard: visitors, signups, and purchases by channel

4. **Artist-facing analytics (basic)**
   - API endpoints that return per-artist metrics: profile views, listing views, inquiry count
   - This is listed in deferred-work-items.md as post-launch, but artists need basic visibility to feel the platform is worth their investment
   - Start simple: totals and 30-day trends, no real-time

5. **Add retention/engagement events**
   - `return_visit` — identify returning visitors (PostHog handles this natively via person identification, but define the cohort)
   - Track days between visits for buyer retention analysis
   - Track artist login frequency and listing update frequency

6. **Create "Growth" dashboard**
   - Weekly active visitors trend
   - New vs. returning visitor ratio
   - Artist signup rate (applications per week)
   - Listing creation rate (new listings per week)
   - Purchase rate trend (orders per week)
   - Revenue trend (GMV per week)

7. **Create "Artist Acquisition" dashboard**
   - "For Artists" page visit -> application_started -> application_submitted -> accepted -> first_listing conversion funnel
   - Traffic source breakdown for "For Artists" page
   - Time from application to first listing

8. **Define and automate KPI reporting**
   - Weekly summary email/Slack message with key metrics (can use PostHog's subscription feature or a simple cron)
   - Metrics: WAU, new artists, new listings, GMV, conversion rate, top-performing category

### Exit Criteria

- [ ] PostHog feature flags are integrated and at least one A/B test has run
- [ ] Traffic attribution shows channel breakdown for visitors and conversions
- [ ] Artist-facing analytics API returns basic view counts
- [ ] Growth and Artist Acquisition dashboards exist
- [ ] Team receives weekly KPI summary
- [ ] Team can answer "which acquisition channel has the best artist conversion rate?"

### Dependencies

- Feature flags architecture decision (SUR-184) resolved
- Artist onboarding flow complete
- Artist dashboard UI exists (even if minimal)

### Risks

- **Low traffic makes A/B tests unreliable.** At MMP volumes, most tests won't reach statistical significance for weeks. Run longer tests and accept directional results.
- **Artist analytics expectations.** Once you show artists any data, they'll want more. Scope the first version tightly and set expectations clearly.

---

## GA (General Availability)

**Goal**: Full operational analytics. Real-time monitoring. Automated anomaly detection. Data-driven decision-making at scale.

### What Must Be Completed

1. **Uptime and synthetic monitoring**
   - SUR-169: Implement uptime monitoring
   - Synthetic checks for critical paths: homepage load, listing view, checkout completion
   - Alert on downtime or degraded performance
   - Status page for public visibility

2. **Revenue analytics**
   - Real-time GMV dashboard
   - Commission revenue tracking
   - Revenue by artist, category, and time period
   - Average order value trends
   - Refund/dispute rate tracking

3. **Advanced funnel optimization**
   - Session recording (PostHog has this built-in) for checkout drop-off investigation
   - Heatmaps on key pages (PostHog toolbar)
   - Enable these selectively — they increase data volume and cost

4. **Fraud detection signals**
   - Track anomalous patterns: rapid-fire purchases, unusual geographic patterns, payment failure spikes
   - Alert on sudden spikes in checkout_abandoned at payment step (may indicate payment processor issues or card testing)

5. **SEO performance tracking**
   - Integrate Google Search Console data (manual or via API)
   - Track organic search impressions, clicks, and position for key pages
   - Correlate with Web Vitals data

6. **Data export and warehousing readiness**
   - Evaluate PostHog data export to S3 or a data warehouse for long-term retention and custom analysis
   - PostHog's free tier has limited data retention — plan for this

7. **Artist analytics dashboard (full)**
   - Per-listing view counts, conversion rates, and revenue
   - Visitor geographic distribution (at country/region level, not IP-level)
   - Traffic source breakdown (how buyers found their work)
   - Comparison to platform averages (anonymized)

8. **Operational dashboards**
   - System health: API latency p50/p95, error rates, Lambda cold starts
   - Infrastructure costs: correlate with traffic volume
   - Support queue metrics (if support system exists)

### Exit Criteria

- [ ] Uptime monitoring is active with alerting
- [ ] Revenue dashboard shows real-time GMV, commission, and refund data
- [ ] Session recording is available for checkout investigation
- [ ] SEO performance is tracked
- [ ] Artist dashboard shows per-listing analytics
- [ ] Team can identify and respond to anomalies within minutes, not hours
- [ ] Data retention plan is in place

### Dependencies

- Full payment/commission flow operational
- Artist dashboard UI complete
- Google Search Console verified for the domain
- Budget for PostHog growth tier (if free tier limits are hit)

### Risks

- **PostHog costs at scale.** Free tier is generous (1M events/month) but GA-level traffic with session recording, feature flags, and full event tracking may exceed it. Budget for growth plan (~$450/month) at GA.
- **Data retention.** PostHog free tier retains data for 1 year. If the business needs longer historical analysis, data export to S3/warehouse is needed before data ages out.

---

## Event Tracking Roadmap

| Stage | New Events | Running Total |
|---|---|---|
| Current | `$pageview`, `$pageleave`, `waitlist_signup`, `listing_view`, `artist_profile_view` | 5 |
| Alpha | (none new — fix infrastructure) | 5 |
| Beta | `category_browse`, `homepage_section_click`, `listing_image_interact`, `social_link_click` | 9 |
| MVP | `add_to_cart`, `checkout_started`, `checkout_completed`, `checkout_abandoned`, `search_performed`, `search_result_clicked`, `search_no_results`, `artist_application_started`, `artist_application_submitted`, `artist_profile_setup_completed`, `artist_first_listing_created` | 20 |
| MMP | `return_visit` (cohort, not event), feature flag evaluations (automatic via PostHog) | ~20 + flags |
| GA | Fraud signals, session recordings (automatic), heatmaps (automatic) | ~20 + automatic |

### Event Property Standards

All custom events should include these base properties (set via PostHog's `register()` or middleware):

| Property | Type | Description |
|---|---|---|
| `page_path` | string | Current URL path (no query params) |
| `page_type` | string | One of: homepage, category, artist_profile, listing_detail, search, for_artists, about, other |
| `device_type` | string | desktop, tablet, mobile (from viewport width) |
| `theme` | string | light, dark |

Stage-specific properties are listed with each event above.

---

## KPI Definitions

### Alpha KPIs

| KPI | Definition | Target | How to Measure |
|---|---|---|---|
| Analytics operational | PostHog receiving events | Yes/No | PostHog Live Events shows data |
| Daily visitors | Unique persons with $pageview | Any non-zero | PostHog Trends |
| Consent rate | Accepted / (Accepted + Denied) | Baseline (no target) | Server-side counter |

### Beta KPIs

| KPI | Definition | Target | How to Measure |
|---|---|---|---|
| Weekly active visitors (WAV) | Unique persons with any event, per week | 50+ | PostHog Trends, weekly unique |
| Pages per session | Average pageviews per session | 3+ | PostHog session analysis |
| Artist profile view rate | Profile views / total sessions | 40%+ | PostHog funnel |
| Listing view rate | Listing views / total sessions | 25%+ | PostHog funnel |
| Category engagement | Category browse events by category | Balanced distribution | PostHog breakdown |
| Waitlist conversion | waitlist_signup / unique visitors | 2%+ | PostHog funnel |
| Recruitment channel effectiveness | Visitors by UTM source | Know top 3 channels | PostHog breakdown by utm_source |

### MVP KPIs

| KPI | Definition | Target | How to Measure |
|---|---|---|---|
| Browse-to-purchase conversion | checkout_completed / listing_view | 1-3% | PostHog funnel |
| Cart abandonment rate | 1 - (checkout_completed / add_to_cart) | < 70% | PostHog funnel |
| Checkout completion rate | checkout_completed / checkout_started | > 60% | PostHog funnel |
| Average order value (AOV) | Sum of price_cents / count of orders | Baseline | PostHog formula from checkout_completed |
| Search effectiveness | search_result_clicked / search_performed | > 30% | PostHog funnel |
| Zero-result rate | search_no_results / search_performed | < 20% | PostHog ratio |
| Frontend error rate | Sentry errors per 1K sessions | < 5 | Sentry dashboard |
| Core Web Vitals pass rate | % pages meeting Google "good" thresholds | > 75% | PostHog or CrUX |

### MMP KPIs

| KPI | Definition | Target | How to Measure |
|---|---|---|---|
| Artist acquisition rate | New artist applications per week | 5+/week | PostHog trend |
| Artist activation rate | First listing / accepted applications | > 80% | PostHog funnel |
| Buyer retention (30-day) | Returning visitors within 30 days | > 20% | PostHog cohort |
| Revenue growth rate | Week-over-week GMV change | Positive trend | PostHog formula |
| A/B test velocity | Tests completed per month | 1+/month | Manual tracking |

### GA KPIs

| KPI | Definition | Target | How to Measure |
|---|---|---|---|
| Monthly GMV | Total checkout_completed price_cents | Growth trend | PostHog + payment system |
| Monthly commission revenue | Total commission_cents | Covers operating costs | PostHog + payment system |
| Artist satisfaction proxy | Avg listings per artist, login frequency | Increasing | PostHog + database |
| Organic search traffic | Visitors from search engines | 30%+ of total | Google Search Console |
| Uptime | Successful synthetic checks / total checks | 99.9% | Monitoring tool |
| Refund rate | Refunds / orders | < 5% | Payment system |

---

## Dashboard Specifications

### Dashboard 1: Site Health (Alpha)
- **Purpose**: "Is PostHog working? How many people visit?"
- **Widgets**: Daily unique visitors (line chart, 30d), Total pageviews (number, 7d), Top pages by views (table), Cookie consent rate (number), Events per day (line chart, 7d)
- **Refresh**: Daily

### Dashboard 2: Browse Behavior (Beta)
- **Purpose**: "How do visitors navigate the site?"
- **Widgets**: Browse funnel (homepage -> category -> listing), Artist discovery funnel (homepage -> artist -> listing), Category distribution (bar chart), Homepage section click-through (bar chart), Image gallery depth (histogram), Pages per session distribution
- **Refresh**: Daily

### Dashboard 3: Artist Profile Quality (Beta)
- **Purpose**: "Are artist profiles compelling?"
- **Widgets**: Profile views by artist (ranked table), Listing views by artist (ranked table), Social link CTR by artist (table), Image gallery engagement by listing (table), Profile-to-listing conversion by artist (bar chart)
- **Refresh**: Daily

### Dashboard 4: Purchase Funnel (MVP)
- **Purpose**: "Where do buyers drop off?"
- **Widgets**: Full funnel (listing_view -> add_to_cart -> checkout_started -> checkout_completed), Cart abandonment by stage (bar chart), AOV trend (line chart), Revenue by category (pie chart), Revenue by artist top 10 (table), Time to purchase distribution
- **Refresh**: Real-time

### Dashboard 5: Search (MVP)
- **Purpose**: "Can people find what they want?"
- **Widgets**: Top search queries (table), Zero-result queries (table), Search -> purchase funnel, Click-through rate (number), Searches per session (number)
- **Refresh**: Daily

### Dashboard 6: Errors & Performance (MVP)
- **Purpose**: "Is the site fast and error-free?"
- **Widgets**: LCP p50/p95 (line chart), INP p50/p95 (line chart), CLS p50/p95 (line chart), Frontend error count (line chart), Top errors (table)
- **Refresh**: Hourly

### Dashboard 7: Growth (MMP)
- **Purpose**: "Is the business growing?"
- **Widgets**: WAU trend (line chart), New vs returning visitors (stacked area), Artist signup rate (line chart), Listing creation rate (line chart), Weekly GMV (line chart), Acquisition channel breakdown (stacked bar)
- **Refresh**: Daily

### Dashboard 8: Artist Acquisition (MMP)
- **Purpose**: "Is artist recruitment working?"
- **Widgets**: For-Artists page -> application funnel, Channel effectiveness (table by UTM source), Time to activation (histogram), Application volume trend
- **Refresh**: Daily

### Dashboard 9: Revenue Operations (GA)
- **Purpose**: "How is the business performing financially?"
- **Widgets**: Monthly GMV (number + trend), Monthly commission (number + trend), AOV trend, Revenue by category trend, Top artists by revenue, Refund rate, Revenue per visitor
- **Refresh**: Real-time

---

## New Work Discovered

These items are not currently tracked in any Linear issue and need to be created:

| # | Title | Stage | Effort Est. | Notes |
|---|---|---|---|---|
| 1 | **Verify PostHog API key is set in Vercel environments** | Alpha | 15 min | Manual check in Vercel dashboard. Highest priority — nothing works without this. |
| 2 | **Add server-side cookie consent rate tracking** | Alpha | 2-4 hrs | API endpoint or edge middleware counter. PostHog can't measure what it can't see. |
| 3 | **Add category browse tracking event** | Beta | 1-2 hrs | New event in analytics.ts + fire from category page components. |
| 4 | **Add homepage section engagement events** | Beta | 2-3 hrs | Track clicks on featured sections. Requires adding onClick handlers to section links. |
| 5 | **Add UTM parameter capture** | Beta | 2-3 hrs | Extract UTM params on first visit, register as PostHog person properties. |
| 6 | **Add image gallery interaction tracking** | Beta | 2-3 hrs | Track gallery navigation on listing detail page. |
| 7 | **Add social link click tracking** | Beta | 1-2 hrs | onClick handler on social links in artist profile. |
| 8 | **Enrich existing events with additional properties** | Beta | 1-2 hrs | Add referrer_page, artist_slug, price_cents to existing events. |
| 9 | **Add base properties middleware** | Beta | 2-3 hrs | Register page_type, device_type, theme as super properties. |
| 10 | **Create PostHog dashboards (Site Health, Browse, Artist Quality)** | Beta | 3-4 hrs | PostHog UI work, no code. |
| 11 | **Add purchase funnel events** | MVP | 3-4 hrs | Depends on checkout flow implementation. |
| 12 | **Add search tracking events** | MVP | 2-3 hrs | Depends on search implementation (SUR-333). |
| 13 | **Add artist onboarding funnel events** | MVP | 2-3 hrs | Depends on artist onboarding flow. |
| 14 | **Integrate Sentry for frontend error tracking** | MVP | 4-6 hrs | SUR-170 exists but is blocked/backlog. Needs to be unblocked and prioritized. |
| 15 | **Add Web Vitals reporting** | MVP | 2-3 hrs | SUR-178 exists in backlog. |
| 16 | **Create PostHog dashboards (Purchase, Search, Errors)** | MVP | 3-4 hrs | PostHog UI work. |
| 17 | **Set up PostHog alerts for critical metrics** | MVP | 1-2 hrs | PostHog UI configuration. |
| 18 | **Implement PostHog feature flags** | MMP | 4-6 hrs | SUR-184 exists in backlog. Architecture decision needed first. |
| 19 | **Build artist-facing analytics API** | MMP | 8-12 hrs | New API endpoints. Listed in deferred-work-items.md as post-launch — recommend pulling forward to MMP. |
| 20 | **Set up uptime/synthetic monitoring** | GA | 4-6 hrs | SUR-169 exists in backlog. |

---

## Priority Conflicts

### 1. SUR-170 (Sentry) is marked blocked and Phase 4 backlog — recommend unblocking for MVP

Frontend error tracking is essential once real money flows through the platform. A checkout JS error that goes undetected could silently kill revenue. The "blocked" status should be reviewed — Sentry integration is straightforward and the blocker may no longer apply.

**Recommendation**: Unblock SUR-170 and schedule it as a hard requirement for MVP exit criteria.

### 2. Artist analytics dashboard is listed as "post-launch" in deferred-work-items.md — recommend pulling forward to MMP

Artists who are being actively recruited need to see that the platform provides value. Even basic view counts ("your profile was viewed 47 times this week") create stickiness. Waiting until post-launch means the founding cohort artists fly blind during the most critical relationship-building period.

**Recommendation**: Build a minimal artist analytics API at MMP. Full dashboard UI can remain post-launch, but the API and basic data display should exist.

### 3. Feature flags (SUR-184) architecture decision blocks all A/B testing

The decision between PostHog flags, env vars, or a database table has been deferred. Since PostHog is already integrated, using PostHog feature flags is the obvious choice — it requires no new infrastructure and the SDK already supports it.

**Recommendation**: Resolve SUR-184 with "use PostHog feature flags" and close the architecture decision. This unblocks MMP A/B testing work.

### 4. Consent-gated tracking vs. data volume tension

The GDPR-compliant opt-out-by-default approach is correct and should not change. However, it means all funnel metrics, conversion rates, and growth KPIs will systematically undercount. This is not a problem to solve but a context the team must internalize.

**Recommendation**: Always present analytics numbers with the caveat "of consenting users." Track consent rate as a multiplier for estimating true volumes. Consider using privacy-friendly server-side metrics (page request counts from CloudWatch/Vercel analytics) as a "total traffic" baseline to compare against PostHog's consented-user numbers.

### 5. Analytics work competes with feature development for limited engineering time

Most analytics events (items 3-9, 11-13) require touching existing page components to add tracking calls. This is low-effort per event (1-3 hours) but adds up. The risk is that analytics instrumentation keeps getting deprioritized in favor of feature work.

**Recommendation**: Bundle analytics events into the feature work that creates them. When building checkout (Phase 4), add purchase events in the same PR. When building search (SUR-333), add search events. Don't treat analytics as a separate workstream — embed it in feature acceptance criteria.
