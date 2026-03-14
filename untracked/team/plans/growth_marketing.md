# Growth & Marketing Stage Plan — 2026-03-09

## Alpha

### What Must Be Completed

**Marketing pages:**
- No changes needed. The /for-artists page, /about, /apply, homepage, and legal pages all exist. Alpha is internal testing only.

**Content:**
- Remove or flag the fake testimonial on /for-artists. Even for internal testing, the team should see the page as it will appear to artists. Replace the "Surfaced Art Creator" quote with an empty state or a clearly-marked placeholder (e.g., "[Founding artist testimonial — TBD]"). This prevents the team from forgetting about it before Beta.

**Analytics:**
- Verify PostHog is capturing events on the deployed preview URL. The current `opt_out_capturing_by_default: true` setting means zero data is flowing unless someone clicks the consent banner. For Alpha (internal users), confirm the team has opted in and that key events fire: page views, waitlist signups, application submissions.
- Set up a PostHog dashboard with the three funnels that matter: (1) Homepage > /for-artists > /apply, (2) Homepage > Category > Listing Detail, (3) Waitlist signup conversion rate. These do not need to have real data yet — just have the dashboards ready.

**Outreach infrastructure:**
- Nothing. Alpha is internal only.

### Exit Criteria
- Fake testimonial removed or clearly marked as placeholder
- PostHog funnels configured and verified to capture events from opted-in users
- Team members have walked through the /for-artists > /apply flow and confirmed it works end-to-end
- Team has reviewed the homepage, artist profiles, and listing detail pages on mobile and desktop

### Dependencies
- None. All work is internal.

### Risks
- Low. The only risk is forgetting to fix the testimonial before Beta.

---

## Beta (Closed)

This is the most critical stage from a growth/marketing perspective. Beta is when the platform is shown to real artists for the first time. The "ready to show artists" threshold is crossed here.

### What Must Be Completed

**Marketing pages:**
- **Replace the fake testimonial** with either (a) a real quote from the first accepted founding artist, or (b) remove the testimonial section entirely. A fabricated testimonial discovered by an artist would be fatal to trust. There is no compromise on this.
- **Artist agreement page** (SUR-173): Before any artist uploads work, there must be a published terms page covering IP rights, commission structure, exclusivity (non-exclusive), and takedown rights. This is blocked on legal review — COO must unblock.
- **Founder story / team page**: Add a brief "Who's behind this?" section to /about or a dedicated page. Artists joining an unknown platform need to know real humans are running it. A name, a photo, and a paragraph about why Surfaced Art exists. This is a COO content task.

**Content:**
- Write a "Welcome to the founding cohort" email template. When the COO accepts a founding artist via the admin API, the acceptance email should feel personal, warm, and gallery-toned. The current SES template may already handle this — verify tone and content.
- Write a brief onboarding guide (can be a simple page or PDF): how to set up your profile, upload listings, connect Stripe, and what to expect in the first few weeks. Artists should not have to figure out the dashboard alone.

**Analytics:**
- **Dynamic OG images** (SUR-116): This is critical for Beta. When an accepted founding artist shares their Surfaced Art profile on Instagram stories or Twitter, the link preview must show their artwork, not the generic Surfaced Art gold logo. Without this, Growth Loop #1 (Artist Portfolio Effect) is dead on arrival. Every founding artist sharing their profile link generates zero visual impact.
- Configure PostHog to track: artist profile views (already done), listing views (already done), time-on-page for artist profiles, and referral source (UTM parameters).

**Outreach infrastructure:**
- **Notion Artist Pipeline DB** should be actively used by COO. Verify the pipeline stages match reality: Identified > Contacted > Interested > Applied > Accepted > Onboarded.
- Prepare a short outreach message template for warm contacts: 2-3 sentences, link to /for-artists, personal note from the founder. This is a COO deliverable but Marketing should draft it.
- Prepare an "artist profile showcase" — take screenshots of the best-looking demo artist profile and use them in outreach to show what a real artist's page would look like.

**Site readiness for artist eyes:**
- The homepage and gallery must not look empty or fake. Options:
  - (a) Accept 3-5 founding artists before broader Beta invitations, so new invitees see real artists on the site. This is the COO's responsibility but Marketing must flag it as a hard dependency.
  - (b) If no real artists are live yet, add a clear "Coming soon — founding artists being onboarded" message on the homepage instead of showing demo data as if it were real.
- The /apply page should be unblocked from robots.txt once Beta begins (currently blocked). Artists shared a direct link will still reach it, but allowing indexing signals confidence.

### Exit Criteria
- Fake testimonial removed or replaced with a real founding artist quote
- Dynamic OG images live (SUR-116) so artist profile links render their artwork in social media previews
- Artist agreement page published (SUR-173)
- At least 3 real founding artists have profiles live on the platform
- Those artists have shared their profile links and the experience felt professional ("would put it in their Instagram bio")
- PostHog dashboards show real traffic data from founding artists and their audiences
- Onboarding guide exists (page or email)
- Founder/team story visible on the site

### Dependencies
- **COO**: Must recruit and onboard 3-5 founding artists before broader Beta invitations. Marketing cannot manufacture this.
- **COO**: Must unblock artist agreement (SUR-173) — requires legal review.
- **COO**: Must provide a real testimonial quote or approve removing the section.
- **Engineering**: Dynamic OG images (SUR-116) must be built. This is a frontend task.
- **Engineering**: Admin UI (SUR-403) is strongly recommended so the COO can review applications without developer assistance. Not strictly required (API works) but operational friction is high without it.

### Risks
- **Showing too early.** If the platform is shown to artists before real artists are live, prospects see a gallery of AI-generated demo profiles and a fake testimonial. This would actively damage the brand. The COO must onboard at least a small cohort before broader invitations.
- **Dynamic OG images delayed.** Without SUR-116, the Artist Portfolio Effect growth loop cannot activate. Every profile share is wasted reach.
- **No buy button.** Artists will ask "can buyers actually purchase my work?" The answer is no. This must be handled with clear messaging: "We're onboarding founding artists now. The full purchase flow launches [month]. Your work will be listed and visible to buyers immediately." Transparency is the only option.

---

## MVP

### What Must Be Completed

**Marketing pages:**
- **Update /for-artists** to reflect that real artists are on the platform. Replace any remaining demo-data references with real founding artist examples (with their permission). The "Sarah Chen" browser mockup in the Artist Studio section should show a real founding artist's profile.
- **Add social proof**: Display the number of founding artists, waitlist subscribers, or both. "Join 12 founding artists" or "500+ buyers on the waitlist" — whichever number is more impressive.
- **Publish a returns/refund policy** (SUR-174). Buyers need this before purchasing. Artists need it before listing at prices.

**Content:**
- **Launch announcement email** to the waitlist: "The gallery is now open. Browse and buy original handmade art." This is the waitlist-to-buyer conversion moment. SES infrastructure exists but no campaign templates are built.
- **Artist spotlight content**: Write 2-3 short artist profiles (500-800 words) that can live on a /blog or /stories page. These serve double duty as SEO content and artist recruitment social proof. Blog infrastructure must be built (no issue exists for this — new work).
- **Social media accounts**: Create and verify Instagram (@surfacedart) and Pinterest accounts. Begin posting founding artist work. The recruitment strategy identifies Instagram as where "87% of art buyers discover artists." At MVP, the goal is presence, not virality — 2-3 posts per week showcasing founding artist work.

**Analytics:**
- **Full funnel tracking**: Homepage > Browse > Listing Detail > Checkout > Purchase. PostHog must track the complete buyer journey now that transactions work.
- **Artist conversion funnel**: /for-artists > /apply > Accepted > Profile Complete > First Listing. This measures recruitment effectiveness.
- **Revenue dashboard**: Track GMV, platform commission, average order value, conversion rate. PostHog or a simple admin dashboard metric.

**Outreach:**
- Begin warm outreach beyond the founder's immediate network. Use the Notion Artist Recruitment Strategy channels:
  - SIL network extensions (friends of friends)
  - Instagram DMs to artists followed by founding cohort members
  - Founding artist referrals (if incentive program is live)
- Target: 15-25 total artists on the platform by end of MVP.

**Email infrastructure:**
- **Post-application confirmation email**: When an artist submits an application, they should receive an email acknowledging receipt and setting expectations for review timeline. Currently they see a success state on the page but receive nothing in their inbox. No issue exists for this — new work.
- **Post-purchase transactional emails** (SUR-157): Order confirmation for buyer, sale notification for artist, shipping confirmation, delivery confirmation. These must exist at MVP.

### Exit Criteria
- At least one real purchase has been completed end-to-end (buyer pays, artist ships, platform collects commission)
- Waitlist subscribers have been emailed the launch announcement
- Social media accounts exist and have posted content
- 2-3 artist spotlight articles published
- Post-application and post-purchase email flows working
- Revenue tracking dashboard shows real data
- 15-25 artists on the platform with live listings

### Dependencies
- **Engineering**: Phase 4 (Transactions) must be complete — checkout (SUR-99), buyer accounts (SUR-98), fulfillment (SUR-100), transactional emails (SUR-157).
- **Engineering**: Blog/content infrastructure must be built. This is unplanned work.
- **COO**: Social media accounts must be created and content calendar established.
- **COO**: Returns/refund policy must be defined (SUR-174).
- **Founding artists**: Must have listed work at real prices and be prepared to fulfill orders.

### Risks
- **Chicken-and-egg problem.** Buyers arrive but see only 15-25 artists with limited inventory. The gallery feels sparse. Mitigation: curate the homepage aggressively to show the best work, and use category pages to avoid showing empty sections.
- **First purchase experience.** The first real transaction is a moment of truth for both the buyer and artist. Any friction (confusing checkout, shipping issues, delayed payouts) will be amplified because the cohort is small and every experience matters.
- **Content capacity.** Writing artist spotlights, managing social media, and running email campaigns requires sustained effort. If the COO is also handling artist recruitment, application review, and operations, content may slip.

---

## MMP (Minimum Marketable Product)

### What Must Be Completed

**Marketing pages:**
- **Redesign /for-artists with real social proof**: founding artist testimonials (multiple), artist count, buyer count, GMV processed, average artist earnings. Replace the conceptual pitch with evidence.
- **Artist success stories page**: Dedicated page with 3-5 in-depth profiles of founding artists — their experience, how SA compared to other platforms, specific outcomes (profile views, sales, collector interactions).
- **Press/media kit page**: Logo assets, brand description, founder bio, key statistics, high-res artist images (with permission). Ready for press outreach.

**Content:**
- **Blog established and regularly updated**: At minimum, bi-weekly posts. Content types:
  - Artist spotlights (ongoing)
  - "How it's made" process features (leveraging the process photo/video architecture)
  - Art buying guides ("How to choose original ceramics for your home")
  - Platform updates and new artist announcements
- **Email newsletter**: Monthly or bi-weekly newsletter to waitlist + registered buyers. New artists, featured work, artist stories. SES infrastructure exists; campaign templates must be built.
- **SEO content strategy executing**: Target long-tail keywords identified in Growth Loop #3 (SEO Content Flywheel). Focus on category + intent keywords: "buy handmade ceramics online," "original printmaking for sale," "contemporary mixed media art."

**Analytics:**
- **Attribution tracking**: UTM parameters on all outreach links (social media, email, artist referrals). Know which channels drive artist signups and buyer conversions.
- **Cohort analysis**: Track founding artist retention (are they still listing new work?), buyer repeat purchase rate, and waitlist-to-buyer conversion.
- **A/B testing capability**: PostHog feature flags are infrastructure-ready. Test /for-artists variants, homepage layouts, and CTA copy.

**Outreach — cold outreach begins here:**
- **Instagram DM outreach** at scale: Use the hashtag and geographic discovery methods from the Artist Recruitment Strategy. Target 10-20 personalized DMs per week.
- **Etsy seller outreach**: Identify top-rated handmade sellers in SA's categories who might benefit from a gallery presence alongside their Etsy shop (non-exclusive positioning).
- **Art fair and market outreach**: Research local/regional craft fairs and reach out to exhibitors.
- **Reddit and community engagement**: Participate in r/ceramics, r/pottery, r/printmaking, r/artstore with genuine community presence (not spam).
- **Founding artist referral program live** (SUR-160, SUR-161): The 5% referral commission and founding artist badge must be implemented. These are force multipliers — every happy founding artist becomes a recruiter.

**Growth loops to activate:**
- **Loop #1: Artist Portfolio Effect** — fully active. Dynamic OG images + real artist profiles + social sharing = organic reach every time an artist shares their SA link.
- **Loop #2: Artist Referral Network** — activate with founding artist incentive program (SUR-160). Each founding artist refers 2-3 peers.
- **Loop #3: SEO Content Flywheel** — blog content + artist listings + category pages generating organic search traffic.

### Exit Criteria
- 50+ artists on the platform with active listings
- Cold outreach has been running for 4+ weeks with measurable response rates
- Blog has 10+ published posts
- Email newsletter has sent 3+ issues
- Social media accounts have 500+ followers (combined)
- Founding artist referral program is live and has generated at least 5 referral applications
- Attribution data shows which channels drive the most qualified artist applications
- At least one press mention or blog feature (even a small one)
- Artist retention: 80%+ of founding artists still active after 90 days

### Dependencies
- **Engineering**: Founding artist incentive program (SUR-160, SUR-161) — variable commission rates and badge display.
- **Engineering**: Blog infrastructure (new work, no issue exists).
- **Engineering**: Email campaign/newsletter system (beyond transactional emails).
- **COO**: Content creation capacity — artist spotlights, blog posts, social media. May need a part-time content contributor.
- **COO**: Press/media outreach strategy and contacts.
- **Founding artists**: Permission to use their work and stories in marketing materials.

### Risks
- **Cold outreach conversion rate.** Artists approached cold will compare SA to established platforms. The pitch must lead with what SA has that competitors don't (curation, economics, process documentation, craft categories). Expect 5-15% response rate on cold DMs.
- **Content bottleneck.** Blog, social media, email, and artist outreach all require content creation. If one person is doing everything, quality or frequency will suffer. Consider whether founding artists can contribute guest content.
- **Platform stability under real load.** MMP is the first time the platform sees organic traffic beyond the founding cohort. Performance issues, edge cases in checkout, or image loading problems become brand-damaging at this stage.

---

## GA (General Availability)

### What Must Be Completed

**Marketing pages:**
- **/apply unblocked from robots.txt and actively promoted.** The application page should rank for "sell handmade art online," "online gallery for artists," and similar queries. SEO metadata on /apply should target these terms.
- **Category landing pages optimized for SEO**: Each of the 4 category pages should have editorial content (not just a grid of listings) — a paragraph about the medium, featured artists in the category, and buying guides. This helps with search ranking and buyer education.
- **Buyer-focused landing pages**: "Why buy from Surfaced Art" — trust signals, artist vetting process, shipping guarantee, returns policy. Currently the site is artist-recruitment-focused; GA needs buyer acquisition messaging.

**Content:**
- **Weekly blog cadence**: Consistent publishing schedule. Mix of artist spotlights, art buying guides, trend pieces ("ceramics for modern interiors"), and platform updates.
- **Email segmentation**: Different email streams for waitlist subscribers, registered buyers (no purchase), one-time buyers, and repeat buyers. Personalized recommendations based on browsing history and category interest.
- **Social media strategy executing on 3+ channels**: Instagram (primary — visual showcase), Pinterest (discovery — link back to listings), and one of TikTok/YouTube Shorts (process videos from artists). Leverage the process photo/video architecture as content.
- **Artist content program**: Provide founding artists with shareable assets — "I sell on Surfaced Art" badges, social media templates, QR code cards for their studio/fair booth.

**Analytics:**
- **Full marketing attribution**: Know the CAC (Customer Acquisition Cost) for both artists and buyers by channel.
- **LTV modeling**: Early data on buyer lifetime value — repeat purchase rate, average basket size, category cross-shopping.
- **Funnel optimization**: Continuously improve /for-artists > /apply conversion, homepage > purchase conversion, and email > repeat purchase conversion based on data.

**Outreach:**
- **Public applications open**: /apply is publicly accessible, indexed, and promoted. No more gate-keeping who sees it.
- **MFA program outreach**: Contact university art programs with student exhibition opportunities on the platform.
- **Art fair presence**: Attend 1-2 art fairs or craft shows as a platform (table/booth), not just to recruit but to build brand awareness with buyers.
- **PR push**: Pitch art blogs, design publications, and local press. Target publications that cover the intersection of craft, design, and e-commerce (e.g., Colossal, Design Milk, Etsy competitor coverage).
- **Partnerships**: Reach out to interior designers, home stagers, and corporate art buyers as bulk/trade accounts.

**Growth loops to activate (all):**
- **Loop #1: Artist Portfolio Effect** — fully mature. Every artist shares their profile; every share brings potential buyers and artists.
- **Loop #2: Artist Referral Network** — running. Track referral conversion rates and optimize incentives if needed.
- **Loop #3: SEO Content Flywheel** — blog + listings + category pages generating consistent organic search traffic. Target 1,000+ organic search visits/month within 6 months of GA.
- **Loop #4: Buyer Word-of-Mouth** — new. Reviews are live (SUR-101), buyers share purchases on social media. Consider a "share your purchase" prompt in post-purchase email.
- **Loop #5: Collector Effect** — new. Repeat buyers building collections. Personalized recommendations based on purchase history.

### Exit Criteria
- 100+ artists on the platform
- Applications arriving organically (not just from outreach)
- Consistent monthly GMV growth
- Blog driving measurable organic search traffic
- Email campaigns showing positive ROI (opens, clicks, conversions)
- Social media following growing week-over-week
- At least 3 press mentions
- Artist NPS score of 40+ (survey founding cohort)
- Buyer repeat purchase rate of 15%+
- All growth loops generating measurable, attributable results

### Dependencies
- **Engineering**: Review system (SUR-101) live for buyer social proof.
- **Engineering**: Email segmentation and personalized recommendation capability.
- **Engineering**: Buyer notifications for followed artists (SUR-159).
- **COO**: Sustained content creation — this likely requires a dedicated part-time content person or contractor.
- **COO**: Press contacts and PR strategy.
- **COO**: Art fair attendance budget and logistics.

### Risks
- **Scaling operations.** GA means accepting applications at volume. Without admin UI (SUR-403), every application review is an API call. Admin UI must be live well before GA.
- **Quality dilution.** As more artists are accepted, maintaining curation standards becomes harder. The jury scoring rubric must be integrated into the review workflow.
- **Buyer acquisition cost.** Artist acquisition has a clear strategy (direct outreach + referrals). Buyer acquisition is less defined. Organic search, social media, and artist-shared links are the primary channels, but if conversion rates are low, paid acquisition may be needed — and the 30% commission leaves limited margin for paid CAC.
- **Content sustainability.** Weekly blog + social media + email requires 10-15 hours/week of content work. If this falls on one person alongside operations, it will not be sustainable.

---

## Artist Outreach Timeline

### Phase 1: Warm Outreach (Beta)
**When**: As soon as 3+ founding artists are live on the platform
**Who**: Artists personally known to the founder/advisor or one degree removed
**Channel**: Personal email, text message, or DM with context ("I'm building something, wanted to show you")
**Volume**: 8-15 artists total
**Prerequisites**:
- Fake testimonial removed
- Dynamic OG images live (SUR-116)
- Artist agreement published (SUR-173)
- At least 3 real artist profiles visible on the site
- Onboarding guide ready

**What must be true**: The site looks professional enough that the founder would not feel embarrassed sharing the link. The artist profile page is the hero — share a link to a real artist's profile, not the homepage.

### Phase 2: Warm-Extended Outreach (Late Beta / Early MVP)
**When**: After 10+ artists are live and the first purchases have occurred
**Who**: Friends-of-friends, artists recommended by founding cohort, local art community
**Channel**: Email with /for-artists link, Instagram DMs with personal context
**Volume**: 15-30 additional artists
**Prerequisites**:
- Purchase flow works (Phase 4 complete)
- At least one real sale has occurred
- Founding artists are positive about the experience (informal check-in)

**What must be true**: You can answer "yes" to "Can buyers actually purchase work on your platform?" This is the question every artist will ask. Until the answer is yes, extended outreach carries the risk of artists trying the platform, finding a dead-end purchase flow, and dismissing it permanently.

### Phase 3: Cold Outreach (MMP)
**When**: After 25+ artists, multiple sales completed, founding artist testimonials available
**Who**: Artists discovered through Instagram hashtags, Etsy seller profiles, art fair exhibitor lists
**Channel**: Instagram DMs, email (found via website/linktree), Reddit community engagement
**Volume**: 10-20 personalized contacts per week
**Prerequisites**:
- Real testimonials from founding artists on /for-artists
- Founding artist referral program live (SUR-160)
- Blog with artist spotlights published
- Social media accounts active with regular content
- Dynamic OG images showing real artist work in previews

**What must be true**: A cold prospect clicking the link sees a real gallery with real artists, real sales, and real testimonials. The /for-artists page tells a compelling story backed by evidence, not promises. The artist's first reaction should be "this looks legit" — not "this looks new."

### Phase 4: Public Applications (GA)
**When**: After 50+ artists, consistent monthly sales, positive artist NPS
**Who**: Anyone who discovers the platform
**Channel**: /apply page indexed and promoted, social media ads (if budget allows), PR placements, art school outreach
**Volume**: Inbound-driven, supplemented by targeted outreach
**Prerequisites**:
- Admin UI live (SUR-403) for efficient application review
- Jury scoring rubric integrated into review workflow
- Content guidelines and DMCA procedure published (SUR-185)
- Returns/refund policy live (SUR-174)
- All transactional emails working (SUR-157)

**What must be true**: The platform can accept, review, and onboard artists without requiring developer intervention for any step. The COO can run the artist pipeline independently.

---

## Content Roadmap

### Beta
- Remove/replace fake testimonial (COO task, week 1)
- Write artist onboarding guide (COO + Marketing, week 1-2)
- Draft warm outreach message template (Marketing, week 1)
- Write founding artist welcome email (Marketing, week 1)
- Add founder story to /about page (COO, week 2)

### MVP
- Launch announcement email to waitlist (Marketing, launch week)
- 2-3 artist spotlight articles (Marketing, weeks 1-4 post-launch)
- Create Instagram account, begin posting 2-3x/week (COO, ongoing)
- Create Pinterest account, pin all listings (COO/Marketing, ongoing)
- Post-application confirmation email template (Engineering + Marketing)
- Post-purchase email flow (Engineering, SUR-157)

### MMP
- Bi-weekly blog posts (alternating: artist spotlight, buying guide, process feature)
- Monthly email newsletter to all subscribers
- Instagram: daily stories featuring new listings, 3-5 feed posts/week
- Pinterest: all listings pinned with optimized descriptions, board strategy by category
- Artist shareable assets: "I sell on Surfaced Art" graphics
- Press/media kit page

### GA
- Weekly blog cadence
- Email segmentation: separate streams for prospects, buyers, collectors
- Expand to TikTok/YouTube Shorts with artist process videos
- Guest content from artists (studio tours, process write-ups)
- Seasonal campaigns (holiday gift guides, "art for small spaces," etc.)
- Artist content program: templates, badges, QR cards for fairs

---

## Growth Loop Activation

| Growth Loop | Alpha | Beta | MVP | MMP | GA |
|---|---|---|---|---|---|
| **#1: Artist Portfolio Effect** (artist shares profile link, brings buyers + artists) | Not active | Partially active (needs SUR-116 for full impact) | Active | Fully active | Fully active |
| **#2: Artist Referral Network** (founding artists refer peers for commission) | Not active | Not active | Soft launch (manual tracking) | Active (SUR-160 live) | Fully active |
| **#3: SEO Content Flywheel** (blog + listings generate organic traffic) | Not active | Not active | Seeding (first blog posts) | Active (10+ posts, measurable traffic) | Fully active |
| **#4: Buyer Word-of-Mouth** (buyers share purchases, leave reviews) | Not active | Not active | Not active | Seeding (first reviews) | Active (SUR-101 live) |
| **#5: Collector Effect** (repeat buyers, personalized recs) | Not active | Not active | Not active | Not active | Seeding |

**Key insight**: Growth Loop #1 is the most important loop for Beta and MVP. It requires only one thing beyond what exists today: dynamic OG images (SUR-116). Every other growth mechanism depends on content creation and feature development that takes months. SUR-116 should be treated as a growth-critical feature, not a nice-to-have.

---

## New Work Discovered

Items not tracked in any existing Linear issue that this plan requires:

1. **Fake testimonial removal/replacement** — No issue exists. Must be done before Beta. COO decision + small frontend change.

2. **Blog/content infrastructure** — No issue exists. Must be built before MVP. Requires: a /blog route, markdown or CMS-based content rendering, proper SEO metadata per post, sitemap integration. Could be as simple as MDX files in the repo or as robust as a headless CMS integration.

3. **Email campaign system** — No issue exists beyond transactional emails (SUR-157). Waitlist announcement, newsletter, and drip sequences require campaign templates and a sending mechanism. SES infrastructure exists but no campaign tooling is built.

4. **Post-application confirmation email** — No issue exists. Artist submits an application and receives nothing in their inbox. Must be built before Beta.

5. **Social media account creation and site linking** — No issue exists. Instagram and Pinterest accounts need to be created, verified, and linked from the site footer and metadata.

6. **Waitlist social proof display** — No issue exists. "Join X others on the waitlist" on the homepage increases signup conversion.

7. **Founder/team story page or section** — No issue exists. Trust signal for both artists and buyers.

8. **Press/media kit page** — No issue exists. Needed at MMP for press outreach.

9. **Artist onboarding guide content** — No issue exists. Non-code task but critical for Beta.

10. **Buyer-focused landing page** — No issue exists. GA requires "Why buy from Surfaced Art" messaging targeted at buyers, not just artists.

11. **Category page editorial content** — No issue exists. SEO value of adding editorial introductions to each category page.

12. **Artist shareable assets** — No issue exists. "I sell on Surfaced Art" graphics, social media templates, QR codes for artist booths.

---

## Priority Conflicts

### SUR-116 (Dynamic OG Images) vs. Phase 4 Engineering

Dynamic OG images are currently labeled as backlog, but they are the single highest-leverage growth feature for Beta. Every founding artist who shares their profile link on Instagram — the primary artist acquisition channel — generates zero visual impact without this. Phase 4 engineering work (checkout, payments) is the obvious priority for the business, but SUR-116 is a 1-2 day task that unlocks the primary growth loop. **Recommendation: prioritize SUR-116 before Phase 4 starts or in parallel during the first sprint.**

### Admin UI (SUR-403) vs. Growth Work

The admin UI is critical for the COO to review applications and manage artists without developer help. Without it, every artist acceptance requires an API call. This creates a bottleneck that directly impacts artist recruitment velocity — the COO cannot efficiently scale the pipeline. However, admin UI is an engineering task competing with Phase 4. **Recommendation: build minimal admin UI (application review only, SUR-407) before Phase 4, defer the rest.**

### Content Creation Capacity

The content roadmap (blog, social media, email, artist spotlights) requires sustained effort starting at MVP. If the COO is also handling artist recruitment, application review, operations, and brand decisions, content will be the first thing to slip. **Recommendation: plan for a part-time content contributor by MMP. This is a budget decision, not an engineering decision.**

### Blog Infrastructure vs. Phase 4

Blog infrastructure is not in any engineering plan. Building a blog system (even a simple MDX-based one) takes engineering time that competes with Phase 4. However, Growth Loop #3 (SEO Content Flywheel) cannot start without it. **Recommendation: defer blog to MVP stage. For Beta, use the /about page and social media for content. The first blog posts can coincide with the purchase flow launch.**

### Founding Artist Incentives (SUR-160, SUR-161) Timing

The referral commission and founding badge are key selling points in artist recruitment ("you get 20% commission as a founding artist"). But these are backlog items competing with Phase 4. If the incentive program is not live when cold outreach begins at MMP, the pitch loses a major differentiator. **Recommendation: implement SUR-160 and SUR-161 before MMP cold outreach begins. Can be parallel with late Phase 4 work.**
