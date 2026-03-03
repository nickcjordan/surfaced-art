# Deferred Work Items — Not Issued (as of 2026-03-03)

Items reviewed during the comprehensive issue audit and deliberately excluded from GitHub issues. These are either explicitly deferred to post-launch, out of scope for v1, or too small to warrant standalone issues.

## Post-Launch Features (explicitly deferred in Vision/Architecture docs)
- **Internal admin dashboard UI** — use Airtable/Notion until external tooling is insufficient
- **In-platform messaging** between buyers and artists
- **Faceted search and filters** — beyond keyword search (which IS issued as #333)
- **Personalized recommendations**
- **Artist analytics dashboard**
- **Studio subscription tier** (optional paid tier for artists)
- **Split payment for commissions** (deposit + final)
- **International shipping**
- **Native mobile app**

## Post-Launch Infrastructure (deferred until metrics justify)
- **RDS Proxy** — add only when CloudWatch shows connection exhaustion
- **OpenNext migration** — move from Vercel to AWS only when cost justifies
- **Dedicated search service** (Algolia/OpenSearch) — only if PostgreSQL full-text becomes insufficient
- **ElastiCache (Redis)** — for frequently accessed data, only if needed
- **Cross-region RDS backup** — cost/risk decision deferred until launch volume justifies
- **Automated backup verification** — periodic restore test, post-launch operational task
- **Edge caching for API responses** — post-launch optimization
- **Database connection pooling review** — monitor first via CloudWatch

## Post-Launch Operations
- **Alerting escalation policy** — solo CTO project, no team to escalate to yet
- **Cost forecasting and right-sizing review** — post-launch
- **Status page** (Statuspage.io or alternative) — post-launch
- **On-call schedule** — when team grows
- **Automated moderation** (AWS Rekognition for image screening) — post-launch enhancement
- **Artist re-vetting criteria** — periodic quality review, post-launch

## Already Covered Elsewhere
- **Print policy enforcement** — already enforced by listing field validation in #182 (edition_number/edition_total required for prints)
- **Cookie consent banner** — not needed; using Plausible-compatible PostHog, no cookies (per #190)
- **GDPR deletion readiness** — covered by #349 (refund/dispute policies and data deletion workflow)
- **Content & IP policies** — covered by #360 (content guidelines, child of #140)
- **DMCA takedown** — covered by #360 (child of #140)

## Not Code Tasks
- **Artist vetting criteria system** — explicitly deferred to external tooling (Notion/Airtable) per Vision doc
- **"Non-exclusive" messaging to artists** — marketing/content task, not code
- **Founding artist recruitment specifics** — business development, not engineering

## Explicitly Future Schema
- **`custom_accent_color`** on artist_profiles — marked as future in data model doc, for per-artist theme customization

## Not Specified in Any Phase
- **Mux video integration** — process media management exists (#258) but uses image uploads only. Video upload via Mux is implicitly deferred. Can be issued when prioritized.
- **Venue support** (Phases 5-8) — requires hundreds of active artists and real transaction volume first. Data model is already venue-ready (ADR-007).
