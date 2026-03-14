# Product / Artist Advocate Stage Plan — 2026-03-09

## Perspective

This plan is written from the perspective of the product holistically, with special emphasis on the artist experience. The central question driving every stage gate: **"At this point, would an artist feel proud to be here?"**

The platform's supply-side (artists) must lead demand-side (buyers). Artists won't list work where no one buys, and buyers won't come where there's nothing to buy. Breaking this chicken-and-egg problem requires making the platform valuable to artists *before* sales exist — as a portfolio tool, a credibility signal, and a community.

---

## Alpha

### What Must Be Completed

**Artist-facing:**
1. **Replace fake testimonial on /for-artists** — Remove the "Surfaced Art Creator" quote entirely. Replace with either a real quote from a founding artist or a placeholder that doesn't fabricate social proof (e.g., "Coming soon: hear from our founding artists"). A fake testimonial discovered by a prospective artist would be devastating to trust.
2. **Admin UI — Application Management (SUR-407)** — The COO must be able to review applications in a browser, not via curl commands. This is the single biggest operational bottleneck. At minimum: list applications, view details, approve/reject with one click.
3. **Admin UI — Layout and Auth (SUR-404, SUR-406)** — Foundation for the admin UI. Auth infrastructure so only admins can access /admin/*.
4. **Fix demo seed image URLs (SUR-6)** — Ensure all 24 demo artist images resolve. Broken images on demo profiles make the platform look abandoned.
5. **Google OAuth configuration** — Email/password-only auth feels unfinished. Google Sign-In is infrastructure-ready; configuring the credentials is a small task with large perception impact.
6. **Mobile responsiveness audit** — Walk through every page on a phone. Fix any layout breaks. Artists will check the site on their phone first (from an Instagram link).

**Buyer-facing:**
7. **Intentional "Coming Soon" state on listings** — Replace the generic waitlist form on listing pages with a more intentional message: "This gallery opens to buyers soon. Leave your email and we'll notify you when [Artist Name]'s work becomes available." Make the waitlist artist-aware so buyers can express interest in specific artists.

**Operational:**
8. **Application confirmation email** — When an artist submits an application, they should receive a confirmation email immediately. Silence after applying feels wrong for a platform positioning itself as premium.
9. **Internal testing checklist** — Document a manual QA checklist for the full artist journey: apply, get approved (admin UI), sign in, set up profile, create listing, view public profile. Every team member walks through this.

### Exit Criteria
- Every page loads without errors on desktop and mobile
- Demo artist profiles display correctly with all images
- Admin can review and approve/reject applications through a web UI
- Fake testimonial removed
- At least one team member has completed the full artist journey end-to-end (apply through listing creation)
- Google OAuth works

### Dependencies
- COO: Generate remaining AI demo images for SUR-6
- Infra: Google OAuth credentials (Cognito configuration)
- Backend: None (admin API already exists)

### Risks
- Demo seed images (SUR-6) are blocked on COO content generation — could delay Alpha exit
- Admin UI is the largest engineering task; if scoped too broadly it could stall. Keep it to application management only for Alpha

---

## Beta (Closed)

**The critical threshold: artists would put their Surfaced Art link in their Instagram bio.**

### What Must Be Completed

**Artist-facing (highest priority):**
1. **Real founding artists onboarded (3-5 minimum)** — The platform must have real artists with real work before showing it to more artists. These are hand-recruited through the COO/advisor network. Their profiles must be fully populated: bio, process photos, CV, at least 3 listings with real photography.
2. **Dynamic OG images for artist profiles (SUR-116)** — When an artist shares their /artist/[slug] link on Instagram or Twitter, the preview image must show their artwork, not a generic Surfaced Art card. This is the single highest-leverage growth feature. Artists share their profiles; the share preview IS the marketing.
3. **Founding artist badge and commission rate (SUR-160, SUR-161)** — The 20% commission rate for founding artists is a key recruiting pitch. It must be visible in the product: badge on profile, rate shown in dashboard. Without this, the incentive is just a verbal promise.
4. **Artist agreement/terms page (SUR-173)** — Real artists need to know what they're agreeing to. Terms of the relationship must be published before asking artists to list real work for sale.
5. **Guided onboarding flow** — After acceptance, artists need more than a congratulations email. A checklist email ("Here's how to set up your profile in 15 minutes") or an in-app onboarding wizard would dramatically reduce time-to-first-listing.
6. **Artist analytics in dashboard** — Even basic view counts (profile views, listing views) from PostHog would give artists a reason to check their dashboard daily. "Your profile was viewed 47 times this week" is a powerful retention signal. This is high-value, moderate-effort since PostHog already tracks this data.
7. **Social sharing buttons on artist profiles and listings** — Make it effortless for artists and buyers to share. Instagram story share, copy link, Twitter/X share.

**Buyer-facing:**
8. **Listing page polish** — Even without checkout, the listing page should feel complete: multiple image gallery with zoom, clear dimensions/medium/edition info, artist card with link to profile, "similar work" or "more from this artist" section.
9. **Price range display on category pages** — Show price ranges so buyers browsing categories can calibrate expectations.

**Operational:**
10. **Admin UI — Artist Management (SUR-408)** — View all artists, see their profiles, feature/unfeature listings from the admin panel. The COO needs to curate the homepage.
11. **Admin UI — Listing Management (SUR-409)** — Moderate listings, feature selections for homepage.
12. **Content guidelines + DMCA procedure published (SUR-185)** — Required before accepting real artwork.
13. **Returns/refund policy drafted (SUR-174)** — Even if Phase 4 isn't built, the policy should be documented for artist and buyer reference.
14. **Remove or replace demo artists in production** — Once real artists are live, the 24 AI-generated demo profiles should be removed from production. They undermine the "curated" positioning. Keep them in dev only.
15. **Sensitive content flag (SUR-201)** — Nude figure work is common in fine art. The platform needs the content warning mechanism before real artists upload figure studies.

**Growth/Marketing:**
16. **At least one real testimonial** — From a founding artist who has set up their profile. Use their words and their name.
17. **Social media presence** — At minimum, an active Instagram account (@surfacedart) posting founding artist spotlights. The recruitment strategy identifies Instagram as where "87% of art buyers discover artists."

### Exit Criteria
- 3-5 real artists with fully populated profiles and at least 3 listings each
- Every founding artist has shared their Surfaced Art profile link on at least one social platform
- Dynamic OG images render correctly when artist profiles are shared
- Founding artist badge visible on profiles
- Artist agreement published
- Admin can manage applications, artists, and listings through web UI
- Demo/seed artists removed from production
- At least one genuine testimonial on /for-artists
- Artists report they would (or already have) put the link in their Instagram bio

### Dependencies
- COO: Recruit and personally onboard 3-5 founding artists
- COO: Set up and maintain @surfacedart Instagram
- COO/Legal: Finalize artist agreement terms (SUR-173)
- COO/Legal: Define returns/refund policy (SUR-174)
- Frontend: Dynamic OG image generation (SUR-116) — this is the highest-priority engineering task for Beta
- Backend: Founding artist commission rate implementation (SUR-160)
- Frontend: Founding badge component (SUR-161)

### Risks
- **Artist recruitment is the bottleneck, not engineering.** If the COO cannot recruit 3-5 artists willing to spend time populating profiles before the platform can sell their work, Beta stalls. Mitigation: position it as "build your portfolio page for free" — the profile IS the value, not the sales channel (yet).
- **Dynamic OG images are technically non-trivial.** Edge-rendered images pulling from artist data and artwork. Budget 1-2 weeks of engineering time.
- **Artists may be reluctant without a purchase flow.** The pitch must be honest: "We're building the buy button next. Right now, you get a gallery-quality portfolio page for free." Some artists will find this compelling; others won't. Target artists who currently sell through Instagram DMs — for them, ANY professional listing page is an upgrade.

---

## MVP

**The purchase loop works end-to-end. A buyer can find art, pay for it, and the artist gets paid.**

### What Must Be Completed

**Transaction layer (Phase 4 core):**
1. **Buyer accounts (SUR-98)** — Sign up, sign in, save listings, follow artists, view order history. Buyer auth uses the same Cognito pool with a `buyer` role.
2. **Checkout flow (SUR-99)** — "Buy Now" button on listings. Shipping rate calculation via Shippo. Stripe payment capture. Listing status changes to `reserved` on payment, `sold` on fulfillment. This is the single most complex feature in the entire platform.
3. **Post-purchase fulfillment (SUR-100)** — Artist receives order notification, marks as shipped (enters tracking number), buyer gets shipping notification, delivery confirmation, payout to artist via Stripe Connect.
4. **Transactional email templates (SUR-157)** — Order confirmation (buyer), order notification (artist), shipping confirmation (buyer), delivery confirmation (buyer), payout notification (artist). These must match the gallery brand tone.
5. **Commission flow (SUR-102)** — 30% platform commission (20% for founding artists) automatically deducted from Stripe payouts. Transparent breakdown shown to artists in dashboard.
6. **Notification preferences (SUR-182)** — Artists and buyers must be able to control what emails they receive.

**Artist-facing:**
7. **Order management in dashboard** — Artist sees incoming orders, marks as shipped, enters tracking, sees payout status. This is the artist's primary interaction after listing creation.
8. **Payout history in dashboard** — Artists need to see what they've earned, when payouts hit their bank, and the commission breakdown.
9. **Listing report mechanism (SUR-186)** — Community flagging for inappropriate content.

**Buyer-facing:**
10. **Buyer notifications (SUR-159)** — "New listing from [Artist] you follow" email alerts. This is the re-engagement mechanism.
11. **Waitlist-to-buyer conversion** — Email all waitlist subscribers: "The gallery is now open. Browse and buy original art." This is the launch moment for demand-side.
12. **Shipping cost transparency** — Show estimated shipping cost on the listing page before checkout, not just at checkout. Unexpected shipping costs are the #1 cause of cart abandonment.

**Operational:**
13. **Disputes table and basic flow (SUR-183)** — When something goes wrong (damaged in shipping, not as described), there must be a resolution path even if it's manual/email-based initially.
14. **Artist onboarding content** — Packaging guidance, photography tips, shipping best practices. Non-code content pages that make artists successful sellers.

### Exit Criteria
- At least one real purchase has been completed end-to-end: buyer pays, artist ships, buyer receives, artist gets paid
- 8-15 artists with active listings
- Stripe payments and payouts are working in production
- All transactional emails send correctly
- Waitlist subscribers have been notified of launch
- Artist dashboard shows orders and payout history
- Returns/refund policy is published and actionable

### Dependencies
- Stripe: Production Stripe Connect account with payouts enabled
- Shippo: Production account with carrier rate APIs
- COO: Packaging and shipping guidance content
- COO: Continued artist recruitment to reach 8-15 active artists
- Backend: Phase 4 is estimated at 8-12 weeks of engineering (the largest remaining engineering effort)
- Legal: Returns/refund policy finalized
- Growth: Waitlist conversion email campaign designed and built

### Risks
- **Phase 4 is massive.** Checkout + shipping + payments + fulfillment + payouts is the most complex engineering work in the project. Scope creep here could delay MVP by months. Mitigation: ship the simplest possible checkout first (single item, domestic shipping only, no cart).
- **Shipping complexity.** Fragile handmade art requires careful packaging. Damage claims will happen. The platform needs a plan for this before the first shipment.
- **Artist payout timing.** Stripe Connect payouts have delay periods. Artists need clear expectations about when money arrives. Communicate this in onboarding.
- **Commission pushback.** 30% is competitive vs. Saatchi/Singulart but high vs. Etsy (10-13%). Some artists will balk. The founding artist 20% rate mitigates this for early adopters.

---

## MMP (Minimum Marketable Product)

**Polished enough to actively recruit artists beyond the founding cohort. The platform markets itself.**

### What Must Be Completed

**Artist experience polish:**
1. **Review system (SUR-101)** — 3-dimensional ratings (product, communication, packaging) with artist response capability. Reviews are social proof that drives both buyer confidence and artist credibility.
2. **Commission flow — custom work/inquiries (SUR-102)** — Buyer-to-artist messaging for commission requests. Even "ask the artist a question" capability would be valuable.
3. **Artist referral tracking** — The incentive strategy specifies 5% referral commission. Build the tracking mechanism so founding artists can recruit peers and earn from it. This turns artists into a growth channel.
4. **Artist analytics dashboard (expanded)** — Beyond view counts: conversion funnel (views > inquiries > sales), revenue trends, best-performing listings. Make the dashboard a tool artists check weekly.
5. **Portfolio customization** — Per-artist theme colors (the token architecture already supports this). Let artists make their profile feel like theirs, not a template.

**Buyer experience polish:**
6. **Faceted search and filters** — Browse by price range, medium, size, category. Keyword search alone is insufficient for art browsing.
7. **"More like this" / similar work** — Cross-selling within the platform. Based on category, medium, price range, and tags.
8. **Wishlist/favorites for logged-in buyers** — Save art for later, build collections. This drives return visits.
9. **In-platform messaging** — Buyer can message artist about a piece. Even without full commission flow, Q&A about dimensions, custom colors, or shipping improves conversion.

**Growth/Marketing:**
10. **Blog infrastructure** — Artist spotlights, "how it's made" features, art buying guides. This is the SEO content flywheel (Growth Loop #3).
11. **Email marketing campaigns** — New artist announcements, weekly picks, seasonal collections. Re-engage waitlist and buyer accounts.
12. **Artist case studies** — Real stories with real numbers: "Sarah joined 3 months ago, listed 12 pieces, sold 8, earned $X." This is the most persuasive recruiting content possible.

**Operational:**
13. **Dispute resolution UI** — Move disputes from email/manual to a structured workflow in the admin panel.
14. **Financial reporting dashboard in admin** — Revenue, commissions, payout status, artist earnings. The admin API exists; the UI is needed.
15. **Waitlist management UI (SUR-200)** — CSV export, segmentation, email campaigns from the admin panel.

### Exit Criteria
- 25+ active artists with regular listing activity
- Review system live with real reviews
- At least 50 completed sales
- Artists are discovering the platform organically (not just through personal network)
- Blog has 5+ published artist spotlights
- Buyer return rate > 20% (measured via PostHog)
- Platform revenue covers infrastructure costs

### Dependencies
- COO: Artist case study content creation (requires willing artists with sales history)
- COO: Editorial content for blog (artist spotlights, buying guides)
- Growth: Email marketing infrastructure beyond transactional emails
- Frontend: Blog CMS integration (headless CMS or MDX-based)
- Backend: Messaging infrastructure, review system, referral tracking

### Risks
- **Content is a human bottleneck.** Blog posts, artist spotlights, and case studies require editorial effort. If the COO is also doing artist recruitment and platform operations, content will lag. Consider: can founding artists write their own spotlights with a template?
- **Review quality.** Early reviews from friends/family of artists may not be credible. Consider delaying review display until there's sufficient volume for authenticity.
- **Messaging abuse.** In-platform messaging opens the door to spam, off-platform transaction requests, and inappropriate contact. Need moderation tools before launch.

---

## GA (General Availability)

**The business is running. Applications are open. Marketing is active. Support processes exist.**

### What Must Be Completed

**Scale-readiness:**
1. **Open artist applications** — Unblock /apply from robots.txt. Allow inbound applications from search and social. The jury review process must handle volume.
2. **Apple Sign In** — Complete the OAuth trifecta. Some artists and buyers are Apple-only.
3. **International shipping** — Expand from domestic-only to international. Customs declarations, duties estimation, international carrier rates via Shippo.
4. **Automated quality signals** — Not full AI moderation, but: image quality scoring (is this photo blurry/dark?), listing completeness scoring, response time tracking. Help maintain curation quality at volume.
5. **WCAG accessibility audit (SUR-178)** — Full accessibility compliance. Skip-to-content links, ARIA live regions, reduced-motion support, screen reader testing.

**Operational maturity:**
6. **Support ticket system** — Email-based initially, but structured. Artists and buyers need a way to get help beyond "email us."
7. **Artist re-vetting / quality maintenance** — Periodic review of artist quality. The curation promise must hold as the roster grows.
8. **Comprehensive admin dashboard** — KPIs: GMV, take rate, artist churn, buyer conversion, average order value, time-to-first-sale for new artists.
9. **Automated onboarding** — New artist acceptance triggers a full onboarding sequence: welcome email series, profile setup guide, photography tips, packaging guide, first listing prompt. Human intervention should be exception, not rule.

**Growth at scale:**
10. **SEO content flywheel running** — Regular blog content, artist profiles indexed, category pages ranking for long-tail art keywords.
11. **Email marketing automation** — Drip sequences for buyers (browse > save > purchase), re-engagement for inactive artists, seasonal campaigns.
12. **Social media integration** — Instagram feed display on artist profiles, Pinterest rich pins for listings, share-to-stories functionality.
13. **Dynamic collections/curations** — Themed collections ("Ceramic Mugs Under $75", "Abstract Prints for Small Spaces") curated by the platform. Merchandising capability.

### Exit Criteria
- 100+ active artists across all 4 categories
- Consistent monthly GMV growth
- Artist application pipeline producing accepted artists without founder intervention
- Support processes handling issues without founder intervention
- Infrastructure auto-scaling handles traffic spikes (feature on a blog, social media viral moment)
- Unit economics are understood and trending positive

### Dependencies
- COO: Hire or contract support help
- COO: Establish editorial calendar for content
- Legal: International shipping compliance (customs, duties, restricted items)
- Infra: RDS Proxy for connection scaling, potentially OpenNext migration if Vercel costs escalate
- Growth: Paid acquisition experimentation (likely too early, but should be testable)

### Risks
- **Curation quality at scale.** The platform's entire value proposition is "curated." If quality drops as volume increases, the brand erodes. This is the existential risk. Mitigation: strict acceptance rates, quality monitoring, artist re-vetting.
- **Buyer acquisition cost.** Artist supply may outpace buyer demand. The marketplace only works if both sides are healthy. If artists list work that doesn't sell, they'll leave.
- **Infrastructure costs.** As traffic grows, Lambda cold starts, RDS connections, CloudFront bandwidth, and Vercel builds add up. Monitor and plan for the OpenNext migration trigger point.

---

## Artist Experience Milestones

### Alpha: "The Prototype"
An artist in the founder's personal network gets a DM: "I'm building something new for artists like you. Take a look." They visit the site, see a polished gallery with demo art, browse the /for-artists page, and think "this looks serious." They apply. The COO reviews their application in the admin UI and approves them. They sign in, fill out their profile, upload some work. They visit their public profile page and think: "This looks better than my own website." But they can't sell anything yet, and they know it. They're here because they believe in what's coming.

### Beta: "The Portfolio"
An artist has a fully populated profile with real photography. They share their /artist/[slug] link on Instagram. The preview image shows their best piece (dynamic OG image). A follower clicks through and sees a gallery-quality portfolio: cover image, bio, process photos, CV, available work. The follower thinks "I want that vase" but sees "Coming Soon." They join the waitlist. The artist checks their dashboard and sees: 47 profile views this week, 12 listing views, founding artist badge. They feel proud. They tell another artist: "You should apply."

### MVP: "The Sale"
An artist's Instagram follower sees a new listing notification email. They click through, see the piece, see the price with shipping estimate, and click "Buy Now." They pay. The artist gets an order notification, packages the piece carefully (using the platform's packaging guide), ships it, enters the tracking number. The buyer gets a shipping notification, then a delivery confirmation. The artist sees the payout hit their Stripe account (minus 20% founding commission). They list another piece the same day.

### MMP: "The Business"
An artist checks their dashboard weekly. They see: revenue trends, best-performing listings, 4.8 average rating across 15 reviews, 3 new followers this week. They've sold 20 pieces in 4 months. A buyer left a review mentioning the beautiful packaging. Another artist applied because of their referral — the referral commission shows in their payout history. They're featured in a blog spotlight: "How [Artist] Went from Instagram DMs to a Professional Gallery." They share it everywhere.

### GA: "The Gallery"
An artist discovers Surfaced Art through a Google search for "online gallery for ceramics." They read an artist spotlight on the blog, visit the /for-artists page, see real testimonials and real numbers, and apply. Two weeks later they're accepted, and an automated onboarding sequence guides them through profile setup. Within a month, they've listed 8 pieces and made 2 sales. They don't think about the platform — it just works. They tell people "I sell through Surfaced Art" the way they'd say "I'm represented by [gallery name]."

---

## Buyer Experience Milestones

### Alpha: "The Window Shopper"
A buyer visits the homepage, sees beautiful art, browses by category, views artist profiles. Everything looks professional. But every listing ends with a waitlist form. They sign up because they're genuinely interested, but they can't buy anything.

### Beta: "The Interested Buyer"
A buyer discovers an artist's profile through an Instagram share. They browse the artist's work, read about their process, and find a piece they love. They can't buy it yet, but they leave their email specifically for that artist's work. They come back to browse other artists. The site feels like a destination, not a dead end.

### MVP: "The First Purchase"
A buyer gets a "the gallery is open" email. They return, find the piece they saved, see the price with shipping, and buy it. The checkout is simple (single item, credit card, Stripe). They get a confirmation email, shipping notification, and tracking. The piece arrives beautifully packaged. They leave a review. They browse for more.

### MMP: "The Regular"
A buyer follows 5 artists. They get email notifications when new work is listed. They've bought 3 pieces. They browse by price range and medium when decorating a new room. They share a listing with a friend: "You'd love this artist." They leave detailed reviews that help other buyers.

### GA: "The Collector"
A buyer has purchase history, a wishlist, and follows a dozen artists. They discover new artists through blog content and "similar work" recommendations. They commission a custom piece through in-platform messaging. They tell friends "I buy all my art on Surfaced Art" because the experience is trustworthy and the quality is consistent.

---

## Feature Prioritization

Ranked by impact-to-effort ratio within each stage:

### Beta (highest leverage features)
1. **Dynamic OG images (SUR-116)** — Highest ROI feature in the entire backlog. Every artist share becomes marketing. Moderate effort, massive impact.
2. **Founding artist badge (SUR-161)** — Low effort, high signal. Makes founding artists feel special.
3. **Founding commission rate (SUR-160)** — Low-moderate effort (backend commission logic), essential for the recruiting pitch.
4. **Artist agreement (SUR-173)** — Content/legal task, not engineering. Blocks real artist onboarding.
5. **Artist analytics (basic view counts)** — Moderate effort (PostHog data already exists), high engagement value.
6. **Guided onboarding email** — Low effort (email template), meaningful experience improvement.
7. **Social sharing buttons** — Low effort, high utility for artist promotion.
8. **Sensitive content flag (SUR-201)** — Moderate effort, blocks certain art categories.

### MVP (highest leverage features)
1. **Checkout flow (SUR-99)** — The feature that turns a gallery into a marketplace. Highest effort, highest impact.
2. **Transactional emails (SUR-157)** — Essential for trust in the purchase flow. Moderate effort.
3. **Waitlist conversion email** — Low effort, converts existing demand into revenue.
4. **Shipping cost transparency** — Low-moderate effort, directly reduces abandonment.
5. **Buyer accounts (SUR-98)** — Moderate effort, enables the full buyer lifecycle.
6. **Commission flow (SUR-102)** — Must work correctly from day one. Moderate effort.
7. **Order management in artist dashboard** — Moderate effort, essential for artist operations.

### MMP (highest leverage features)
1. **Review system (SUR-101)** — Social proof that builds buyer confidence and artist reputation.
2. **In-platform messaging** — Unlocks commission requests and pre-sale questions.
3. **Blog infrastructure** — Enables the SEO content flywheel.
4. **Faceted search/filters** — Makes browsing productive at scale.
5. **Artist referral tracking** — Turns artists into a growth channel.

---

## Competitive Parity Milestones

### After Beta
- **Matches no competitor on transactions** — but matches/exceeds Saatchi Art and Singulart on artist profile quality and process documentation
- **Exceeds all competitors** on artist economics transparency (commission clearly stated, no hidden fees)
- **Unique differentiator**: Process documentation section on artist profiles — no competitor has this

### After MVP
- **Matches Etsy** on basic purchase flow (browse, buy, ship, receive)
- **Matches UGallery** on curation + purchase capability
- **Still behind** Saatchi Art and Singulart on volume, international shipping, and review depth
- **Still behind** Etsy on buyer features (favorites, collections, messaging, cart)

### After MMP
- **Matches Saatchi Art** on core features: profiles, listings, purchases, reviews, messaging
- **Exceeds Saatchi Art** on artist economics (30% vs 40%) and process transparency
- **Matches Singulart** on curation quality (but different price range and category focus)
- **Still behind** all competitors on volume and social proof (fewer artists, fewer reviews)
- **Unique position**: Only curated gallery covering ceramics, mixed media, and craft disciplines

### After GA
- **Feature parity** with Saatchi Art and UGallery on core marketplace features
- **Differentiated** on: category coverage (craft disciplines), artist economics, process documentation, curation consistency
- **Still behind** Etsy on: volume, mobile app, international reach, buyer feature depth
- **The goal is not to match Etsy** — the goal is to be the best curated gallery for handmade art in the $40-$4,000 range

---

## "Ready to Show Artists" Assessment

The platform crosses the threshold for **warm outreach** (personal network, DM-based recruiting) when ALL of the following are true:

- [ ] Fake testimonial removed or replaced
- [ ] /for-artists page loads correctly on mobile
- [ ] Admin can approve applications via web UI (not curl)
- [ ] Google OAuth works
- [ ] Demo artist images all load correctly
- [ ] Application confirmation email sends
- [ ] At least one complete artist journey tested end-to-end

**This is Alpha exit. Currently blocked on: SUR-6 (demo images), SUR-404/406/407 (admin UI), Google OAuth config, fake testimonial removal.**

The platform crosses the threshold for **cold outreach** (Instagram DMs to strangers, Reddit posts, art fair networking) when ALL of the following are true:

- [ ] Everything above, PLUS:
- [ ] 3-5 real artists with populated profiles visible on the site
- [ ] Dynamic OG images on artist profiles
- [ ] Founding artist badge visible
- [ ] Artist agreement published
- [ ] Real testimonial on /for-artists
- [ ] @surfacedart Instagram active with artist content
- [ ] Demo/seed artists removed from production

**This is Beta exit. A cold prospect must see real artists, real social proof, and a professional presentation — not demo data.**

The platform crosses the threshold for **"apply to join" as a public CTA** (unblock /apply from robots.txt, run ads, feature on blogs) when:

- [ ] Everything above, PLUS:
- [ ] Purchase flow works (MVP complete)
- [ ] At least one real sale has occurred
- [ ] Review system exists
- [ ] Blog with artist spotlights exists

**This is somewhere between MVP and MMP.**

---

## New Work Discovered

Items not currently in any Linear issue or plan:

| # | Item | Recommended Stage | Effort Estimate | Rationale |
|---|------|------------------|-----------------|-----------|
| 1 | **Remove/replace fake testimonial** | Alpha | 1-2 hours | Brand integrity risk. Must happen before any outreach |
| 2 | **Application confirmation email** | Alpha | 2-4 hours | SES + React Email infrastructure exists. Just need the template |
| 3 | **Intentional "Coming Soon" state on listings** | Alpha | 4-8 hours | Artist-aware waitlist on listing pages. Better than generic form |
| 4 | **Artist-aware waitlist (per-artist interest tracking)** | Beta | 8-16 hours | Store which artists/listings a waitlist subscriber expressed interest in, so launch emails can be personalized |
| 5 | **Guided onboarding email sequence** | Beta | 4-8 hours | Email template with profile setup checklist, photography tips link, packaging guide link |
| 6 | **Social sharing buttons** | Beta | 4-8 hours | Share to Instagram stories, copy link, Twitter/X on artist profiles and listings |
| 7 | **Basic artist analytics (view counts in dashboard)** | Beta | 16-24 hours | Pull PostHog data into dashboard. Profile views, listing views, weekly trends |
| 8 | **Price range display on category/browse pages** | Beta | 4-8 hours | Min-max price from API, display on category headers |
| 9 | **Waitlist-to-buyer conversion email campaign** | MVP | 8-16 hours | Email template + send mechanism for "the gallery is open" announcement |
| 10 | **Shipping cost preview on listing pages** | MVP | 16-24 hours | Shippo API call with estimated dimensions/weight, show range on listing detail |
| 11 | **Artist referral tracking mechanism** | MMP | 24-40 hours | Schema changes, tracking codes, payout integration |
| 12 | **Blog/CMS infrastructure** | MMP | 24-40 hours | Headless CMS or MDX-based blog with artist spotlight template |
| 13 | **Founder/team story page** | Beta | 4-8 hours | Trust signal. Who is behind this platform? |

---

## Priority Conflicts

### Conflict 1: Admin UI vs. Phase 4 Transactions
The admin UI (SUR-403 and children) is the natural next engineering priority — it unblocks COO operations. But Phase 4 (transactions) is the existential feature that makes the platform a business. **Resolution:** Build minimal admin UI (application management only) for Alpha, then pivot to Phase 4 for MVP. Full admin UI can be expanded incrementally between transaction features.

### Conflict 2: Dynamic OG Images vs. Phase 4
Dynamic OG images (SUR-116) are the highest-ROI growth feature but don't contribute to the transaction layer. **Resolution:** Dynamic OG images should be built during Beta, before Phase 4 engineering begins. They enable the artist-as-marketing-channel growth loop that will generate demand for when purchases are possible.

### Conflict 3: Blog Infrastructure vs. Core Product
The growth strategy identifies the SEO content flywheel as a key growth loop, but blog infrastructure is engineering time not spent on core marketplace features. **Resolution:** Defer blog to MMP. Use artist profiles themselves as the SEO surface area for Beta and MVP. Blog becomes important when the platform needs to attract artists beyond the personal network.

### Conflict 4: Feature Depth vs. Feature Breadth
Should the checkout flow be simple (single item, domestic only) or comprehensive (cart, international, gift options)? **Resolution:** Ship the simplest possible checkout at MVP. Single item purchase, domestic shipping only, credit card via Stripe. Expand to international shipping and additional features at MMP/GA. Perfectionism here would delay revenue by months.

### Conflict 5: Demo Data Removal vs. Content Sparsity
Removing 24 demo artists from production before having 25+ real artists means the site will look empty. 3-5 real artists is a thin gallery. **Resolution:** This is intentional. A small, real gallery is more credible than a large, fake one. Position it as "exclusive" — "Our founding cohort." The /for-artists page sells the vision; the gallery shows the reality. Authenticity over volume.

### Conflict 6: Artist Analytics vs. Engineering Priority
Artists want to see their view counts and engagement metrics. PostHog has the data. But building a dashboard integration is moderate engineering effort that doesn't directly enable transactions. **Resolution:** Build basic view counts (profile views, listing views) for Beta as a retention mechanism. It gives artists a reason to log in. Expanded analytics (conversion funnels, revenue trends) can wait for MMP.

---

## Summary: The Critical Path

```
TODAY ──── Alpha ──────── Beta ──────────── MVP ──────────── MMP ────── GA
           │                │                  │                │         │
           │ Admin UI       │ Real artists     │ Checkout       │ Reviews │ Scale
           │ Fix demo data  │ Dynamic OG       │ Payments       │ Blog    │ Open apps
           │ Remove fake    │ Founding badge   │ Fulfillment    │ Filters │ Int'l ship
           │   testimonial  │ Artist agreement │ Buyer accounts │ Msg     │ Support
           │ Google OAuth   │ Analytics        │ Commissions    │ Referral│
           │                │ Real testimonial │ Waitlist email  │         │
           │                │                  │                │         │
           ▼                ▼                  ▼                ▼         ▼
        "Looks right"   "Artists proud    "Money moves"    "Markets    "Business
                          to be here"                       itself"     runs"
```

**The single most important insight:** The platform is closer to Beta-ready than it appears. The artist profile experience is genuinely gallery-quality. The gap is not engineering quality — it's operational readiness (admin UI, real artists, content) and the transaction layer. Alpha is achievable in 2-3 weeks. Beta is achievable in 4-6 weeks after Alpha (assuming artist recruitment succeeds). MVP is the heavy lift: 8-12 weeks of Phase 4 engineering after Beta.

The artist experience is the leading indicator. If founding artists are proud to be here, they'll recruit peers. If peers apply, the supply side grows. If the supply side is strong, buyer acquisition follows. **Get to Beta. Everything flows from there.**
