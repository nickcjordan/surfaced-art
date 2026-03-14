# Frontend/UX Stage Plan — 2026-03-09

## Alpha

### Must Complete

**Bug fixes and infrastructure gaps (unblocks internal testing):**
- Fix homepage "Browse all" link hardcoded to `/category/ceramics` — should link to `/artists` or dynamically select the first populated category
- Add `robots: { index: false }` metadata to all auth pages (`/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/verify-email`) so they don't get indexed during preview deployments
- Add skip-to-content link in root layout (a11y baseline)
- Add React error boundaries wrapping the main layout and individual page routes — show a styled fallback instead of a white crash screen
- Custom 404 page (`not-found.tsx`) and 500 error page (`error.tsx`) matching the site's visual identity — warm palette, serif heading, clear "go home" CTA
- Fix category label duplication in `ArtistCard.tsx` — import from `@/lib/category-labels` instead of inline mapping

**Admin UI — minimum viable (SUR-194 parent):**
- Admin layout with sidebar navigation (SUR-197) — route group `(admin)` with role-gated middleware
- Application management page (SUR-198) — list pending applications, approve/reject with one click. This is the critical admin function; the API exists, the UI does not
- Artist management page (SUR-199) — list artists, view profiles, suspend/unsuspend
- Waitlist management page (SUR-201) — view waitlist entries, export CSV

**Content readiness:**
- Ensure seed data renders correctly across all pages — this is the "walk through every page" pass
- Verify dark mode renders correctly on all pages (no broken contrast, no invisible text)

### Exit Criteria
- Every public page renders without console errors on desktop Chrome and mobile Safari
- Admin can approve/reject applications via UI (not curl/Bruno)
- Custom 404/500 pages render with brand styling
- No hardcoded links to wrong destinations
- All auth pages have `noindex` metadata
- Skip-to-content link functional
- Error boundaries catch and display styled fallback on client errors
- Internal team can browse the full site and flag visual issues

### Dependencies
- Backend: Admin API endpoints already exist — no new backend work needed for Alpha admin UI
- Design: No brand decisions needed. Current placeholder tokens are fine for Alpha
- Infra: Vercel preview deployment working (already true)

### Risks
- **Low risk stage.** All work is frontend-only with no backend dependencies. Admin UI is the largest effort (~3-5 days for 3 pages) but the API layer is complete
- Dark mode audit may reveal more token issues than expected — budget extra time for CSS fixes

---

## Beta

### Must Complete

**Brand identity implementation (highest priority, blocks artist outreach):**
- Swap all design tokens in `globals.css` (`:root` and `.dark` blocks) to COO-approved brand colors
- Update `@theme inline` Tailwind registrations to match
- Swap font stacks in `layout.tsx` if brand fonts differ from DM Serif Display / DM Sans
- Update type scale utility classes if font metrics change significantly
- Update OG image (`opengraph-image.tsx`) — brand name, tagline, accent color
- Verify every page in both light and dark mode after token swap (full visual regression pass)

**Artist profile polish (the "Instagram bio link" bar):**
- Dynamic per-page OG images (SUR-116) — when an artist shares their profile link on Instagram/Twitter, the social card must show their cover image or a representative artwork, not a generic fallback. This is critical for artist pride and organic sharing
- Founding artist badge (SUR-161) — visual indicator on profiles and cards for founding cohort artists. Must look premium, not like a participation trophy
- Loading/skeleton states for public pages — artist profile, listing detail, and category browse pages need shimmer skeletons during initial load, not blank space or layout shift

**Browse experience upgrades:**
- Artists directory (`/artists`) — add sorting (alphabetical, newest) and category filter chips. Currently a flat unsorted grid
- Category browse — add sub-filtering by tags within a category (the tag system exists in the backend, the UI filter does not)

**Studio page refinement:**
- Verify studio page (`/studio/[slug]`) renders perfectly with real artist content — this is what artists will actually share
- Add share button / copy-link affordance to studio page if not present

**Pre-launch Lighthouse audit (SUR-178):**
- Run Lighthouse CI on all key pages
- Hit targets: Performance 90+, Accessibility 90+, SEO 95+, Best Practices 90+
- Fix any issues surfaced (likely: image sizing, CLS from masonry, color contrast in dark mode)

**Frontend error tracking (SUR-170):**
- Integrate Sentry (or PostHog error tracking if sufficient) — client-side errors must be visible to the team before real artists are using the site

### Exit Criteria
- Brand tokens are COO-approved and deployed — the site has a distinctive visual identity, not placeholder warm neutrals
- An artist sharing their `/artist/[slug]` or `/studio/[slug]` link on Instagram gets a compelling social preview card with their art
- Founding artist badge visible on founding cohort profiles
- All public pages have loading skeletons (no blank flashes)
- Lighthouse scores meet targets on homepage, artist profile, listing detail, and category browse
- Frontend errors are captured and alertable
- **The "Instagram bio link" test passes: would a working artist put this URL in their Instagram bio?** If yes, Beta is ready

### Dependencies
- **COO brand decisions (BLOCKING):** Colors, fonts, tagline, and visual personality must be finalized before this stage can complete. This is the single largest external dependency in the entire frontend plan
- Backend: OG image generation may need an API endpoint to fetch artist cover image URLs server-side (check if `generateMetadata` can already access this data — it likely can via the existing artist API)
- Backend: Tag filtering on category browse may need a query parameter addition to `GET /listings` (check if `tags` filter already exists)
- Design: Founding artist badge visual design needs COO approval

### Risks
- **Brand decisions delayed:** If COO brand guide is not finalized, Beta cannot exit. This is the #1 risk to the entire timeline. Mitigation: start all non-brand work immediately; brand token swap is a 1-day effort once decisions are made
- **OG image generation complexity:** Dynamic OG images with artist artwork may hit Vercel's edge function size limits or timeout constraints. Mitigation: test early with a single artist, use `ImageResponse` from `next/og`
- **Lighthouse performance on masonry grids:** Large image grids may fail Core Web Vitals. Mitigation: implement `loading="lazy"` on below-fold images, use `srcset` with WebP variants (infrastructure exists via image processor Lambda)

---

## MVP

### Must Complete

**Checkout flow UI (Phase 4 core — SUR-99):**
- Listing detail page: replace waitlist CTA with "Buy Now" button (conditionally shown when checkout is enabled)
- Checkout page: artwork summary card, shipping address form, real-time shipping rate display (Shippo), tax calculation display (Stripe Tax), order total, Stripe Elements payment form
- Order confirmation page with order number, estimated delivery, and next steps
- Payment processing states: loading spinner during capture, success redirect, error handling with retry

**Buyer accounts (SUR-98):**
- Buyer sign-up/sign-in flow (shared Cognito pool with artists)
- Buyer dashboard: order history list, order detail page (status timeline, tracking link)
- Saved listings functionality — heart icon on listing cards, saved listings page in buyer dashboard
- Follow artists functionality — follow button on artist profiles, followed artists feed or list

**Fulfillment tracking UI (SUR-100):**
- Artist dashboard: order management list, enter tracking number + carrier for each order
- Buyer dashboard: order detail with shipping status, tracking link
- Delivery confirmation UI (buyer marks as received, or auto-confirm after window)

**Review flow UI (SUR-101):**
- Post-delivery review prompt (email drives to review page)
- Review form: 3 rating dimensions (product, communication, packaging) with star/numeric input, optional text, shipping flags
- Reviews displayed on listing detail page and artist profile
- Artist response form on individual reviews

**Client-side state management (SUR-121):**
- Introduce TanStack Query for data fetching/caching — checkout flow, buyer dashboard, and order management need optimistic updates and cache invalidation
- React Hook Form for checkout and review forms — the current `useState` pattern won't scale to multi-step forms with validation

**Artist dashboard order view:**
- New dashboard section: incoming orders, pending shipment, shipped, completed
- Order detail with buyer shipping address, packing slip generation, tracking entry

### Exit Criteria
- A buyer can browse, find a piece, check out with a credit card, and receive an order confirmation — end-to-end
- A buyer can track their order status after purchase
- A buyer can leave a review after delivery
- An artist can see incoming orders, enter tracking, and see payout status
- Saved listings and followed artists work for logged-in buyers
- All checkout/payment error states handled gracefully (card declined, network error, listing sold while in checkout)
- No `useState`/`useEffect` data fetching patterns in new transaction pages — TanStack Query used consistently

### Dependencies
- **Backend: Entire checkout/payment/fulfillment API (BLOCKING)** — none of this exists yet. SUR-99 through SUR-102 backend work must be complete before frontend integration
- **Backend: Buyer account endpoints** — saved listings, followed artists, order history APIs
- **Backend: Shippo integration** — real-time shipping rate API
- **Backend: Stripe Payment Intents** — payment capture API
- **Infra: Stripe production keys** — test mode for dev, live keys for production
- **Design: Checkout UX flow** — needs wireframes or at minimum a flow diagram for the multi-step checkout. This is too important to improvise

### Risks
- **Backend velocity:** The entire Phase 4 API layer (~25 issues) must be built before frontend can integrate. If backend is delayed, MVP frontend work is blocked. Mitigation: build checkout UI against mock data/MSW first, integrate when APIs land
- **Stripe Elements complexity:** PCI-compliant payment forms have strict requirements. First-time integration typically takes longer than expected. Mitigation: use Stripe's pre-built Payment Element, not custom Card Element
- **Shipping rate UX:** Real-time Shippo rate fetching can be slow (2-5 seconds). Must design loading states that don't feel broken. Mitigation: show skeleton rate while loading, cache rates for the session
- **Checkout abandonment:** If the flow has too many steps, buyers will leave. Keep it to a single page if possible (address + payment + confirm on one screen)

---

## MMP

### Must Complete

**Commission flow UI (SUR-102):**
- Artist dashboard: commission toggle (open/closed), commission proposal creation form
- Buyer-facing: commission request or inquiry flow (depends on product decision — is it a contact form or structured proposal?)
- Commission progress updates: artist posts updates with photos, buyer sees timeline
- Commission completion triggers standard checkout (payment, shipping, review)

**Faceted search and filtering:**
- Search results: add filters for category, price range, medium, size, tags
- Category browse: price range slider, medium checkboxes, size filters
- Filter state in URL params (shareable filtered views)

**Personalization and retention:**
- "You might also like" recommendations on listing detail (simple: same artist, same category, same tags — no ML needed)
- Recently viewed listings (client-side, localStorage)
- "New from artists you follow" feed on buyer dashboard

**Artist analytics in dashboard:**
- Profile views over time (data from PostHog)
- Listing views, saves, and conversion rates
- Top-performing listings
- Basic charts (line chart for views over time, bar chart for listing performance)

**Visual polish pass:**
- Micro-interactions: hover states on cards, smooth page transitions, subtle animations on CTA buttons
- Toast notifications (Sonner) for all user actions — save, follow, add to cart, order confirmed, etc.
- Image zoom on listing detail page (pinch-to-zoom on mobile, hover-zoom on desktop)
- Responsive refinement: audit every page at 320px, 375px, 768px, 1024px, 1440px, 1920px

**Accessibility audit (SUR-178 completion):**
- ARIA live regions for dynamic content (search results count, form validation errors, toast notifications)
- Reduced motion support: `prefers-reduced-motion` media query disabling animations
- Screen reader testing with NVDA or VoiceOver on key flows (browse, checkout, dashboard)
- Color contrast audit for both light and dark themes (WCAG AA minimum)

**Sensitive content flag (SUR-201):**
- Blurred thumbnail with "contains artistic nudity" overlay
- Click/tap to reveal with age confirmation
- Setting in artist dashboard to flag individual listings

### Exit Criteria
- Commission flow works end-to-end from artist proposal to buyer payment
- Search has filters — buyers can narrow results meaningfully
- Artist dashboard shows actionable analytics
- Accessibility audit complete with WCAG AA compliance documented
- Sensitive content appropriately gated
- Visual polish is "professional" — no janky transitions, no orphaned loading states, no layout shifts
- The platform looks like it was built by a funded startup, not a solo developer

### Dependencies
- Backend: Commission API endpoints (SUR-102)
- Backend: Analytics/reporting endpoints for artist dashboard (may pull from PostHog API directly)
- Backend: Faceted search query parameters on listings endpoint
- Design: Commission flow UX (structured proposal vs. free-form inquiry — product decision needed)
- Design: Analytics dashboard chart designs

### Risks
- **Scope creep on polish:** "Visual polish" is unbounded work. Must timebox to specific pages and specific interactions, not "make everything perfect"
- **Commission flow product ambiguity:** The Vision doc describes commission flow but the UX details are thin (how does a buyer initiate? is there a deposit?). Needs product decisions before frontend work starts
- **Analytics data availability:** If PostHog event tracking wasn't set up consistently, the artist analytics dashboard may have incomplete data. Audit PostHog events early

---

## GA

### Must Complete

**Onboarding improvements:**
- Guided onboarding wizard for newly accepted artists — step-by-step setup (profile photo, bio, first listing) with progress indicator
- Onboarding content pages: packaging guidelines, photography tips, pricing guidance (static content pages)
- Google and Apple OAuth — credentials must be configured and login buttons enabled

**Buyer experience completion:**
- In-platform messaging between buyers and artists (or at minimum, a structured inquiry form on listings)
- Wishlist sharing — buyers can share saved collections via link
- Email notifications: order updates, followed artist new listings, price drops on saved items

**Platform trust signals:**
- "Verified artist" indicator explaining the curation process
- Platform About page with team, mission, and process — currently exists but may need updates for GA positioning
- FAQ / Help center for common buyer and artist questions

**Performance optimization:**
- `generateStaticParams` populated for high-traffic pages (top artists, featured listings) — currently returns `[]` everywhere
- Image `srcset` with responsive breakpoints using existing WebP variants (400w/800w/1200w)
- Bundle analysis and code splitting audit — ensure no oversized client chunks
- Edge caching headers on static assets

**On-demand ISR revalidation (SUR-119):**
- Wire up webhook-triggered cache busting — when an artist updates their profile or listing via dashboard, the public page revalidates immediately instead of waiting up to 60 seconds

**Internationalization readiness (if applicable):**
- Currency display formatting (USD initially, but architecture should support future currencies)
- Date/time formatting with locale awareness

### Exit Criteria
- New artists can onboard without external help — the platform guides them
- Google/Apple OAuth working in production
- Buyer notifications working (email-driven retention loop)
- Page load performance: LCP < 2.5s on 3G for all key pages
- ISR revalidation is immediate after artist edits — no stale content visible to buyers
- Support/FAQ content exists for common questions
- The platform is fully self-service for both artists and buyers — no manual intervention needed for normal operations

### Dependencies
- Infra: Google OAuth credentials configured in Cognito
- Infra: Apple Sign In credentials configured in Cognito
- Backend: Messaging or inquiry API (if in-platform messaging is built)
- Backend: Email notification system for buyer events (new listing from followed artist, etc.)
- Backend: ISR revalidation webhook endpoint (SUR-119)
- Content: Onboarding copy, packaging guidelines, photography tips (needs content creation)

### Risks
- **OAuth credential setup:** Google and Apple OAuth have been "future infrastructure tasks" since Phase 1. If credentials aren't configured, GA launches with email-only auth, which is a friction point for signups
- **Messaging scope:** In-platform messaging is a significant feature. If scoped too broadly (real-time chat), it delays GA. Scoped as structured inquiry forms, it's manageable
- **Content creation bottleneck:** Onboarding guides, FAQ, packaging tips all need writing. This is content work, not engineering — if no one writes it, the pages stay empty

---

## Artist Outreach Readiness

**The frontend is ready to show artists at Beta exit.** Specifically, all of the following must be true:

1. **Brand identity is live** — the site has a distinctive, intentional visual personality. Not placeholder warm neutrals. An artist should look at the site and think "they care about aesthetics"
2. **Social sharing works** — when an artist pastes their profile URL into Instagram stories or Twitter, the preview card shows their art, their name, and the platform brand. Not a generic fallback image
3. **Studio page is polished** — `/studio/[slug]` renders beautifully as a standalone portfolio page. This is the thing artists will actually share
4. **Founding artist badge exists** — founding cohort gets visible recognition. This is the incentive to join early
5. **Lighthouse scores are green** — the site loads fast, is accessible, and doesn't look broken on any device
6. **Error tracking is active** — if an artist hits a bug, the team knows about it before the artist reports it

The profile presentation quality is already above the bar for most art platforms. The missing piece is brand identity — without it, the site looks "nice but generic." With brand tokens applied, the "would you put this in your Instagram bio?" test should pass.

**Pre-outreach checklist:**
- [ ] Brand tokens deployed (COO-approved colors and fonts)
- [ ] Dynamic OG images generating for artist profiles
- [ ] Founding artist badge rendering on profiles and cards
- [ ] Lighthouse audit passing (90+ across all categories)
- [ ] Sentry/error tracking capturing frontend errors
- [ ] Full dark mode regression pass complete
- [ ] Studio page tested with real artist content

---

## New Work Discovered

These items emerged during planning that were not identified in the status report:

1. **Checkout page design** — No wireframes or UX flow exist for the checkout experience. This is the most consequential UI in the entire platform and needs design work before implementation. Must decide: single-page checkout vs. multi-step? Guest checkout allowed? Address autocomplete?

2. **Buyer dashboard design** — Order history, saved listings, followed artists — the information architecture for the buyer dashboard needs planning. What's the primary view? How do notifications surface?

3. **Commission inquiry UX** — The Vision doc describes commissions but the buyer-initiated flow is underspecified. How does a buyer express interest in a commission? Structured form? Free-text message? This needs a product decision before frontend work.

4. **Toast/notification system** — No toast component is installed (Sonner not in ShadCN set). Every interactive action in MVP (save, follow, add to cart, checkout success/error) needs user feedback. Should be installed and patterned before MVP work starts.

5. **Mobile checkout testing** — Stripe Elements on mobile can be finicky (especially with iOS Safari autofill and virtual keyboards). Must be tested on real devices, not just responsive mode in DevTools.

6. **Artist dashboard order management** — The artist side of the transaction flow needs dashboard pages. Current dashboard has profile/listings only. New sections needed: orders (pending/shipped/completed), earnings summary, payout history. This is significant UI work not broken out in current Linear issues.

7. **Review display components** — Star ratings, review cards, review summaries for artist profiles — these are new components needed for MVP that don't exist in the component library.

8. **Empty state designs for new sections** — Buyer dashboard (no orders yet, no saved items), artist dashboard (no orders yet), search (no results). Current `EmptyState` component exists but may need variants.

---

## Priority Conflicts

1. **Admin UI (SUR-194 through SUR-201) is over-scoped for Alpha.** The full admin UI spec includes listing management (SUR-200) and detailed artist management (SUR-199), but for Alpha only application review (SUR-198) is critical. Recommendation: split admin UI into Alpha (application review only) and Beta (remaining admin pages). Listing and artist management via admin UI can wait until Beta since the API + Bruno collection works for the founding team.

2. **SUR-161 (Founding artist badge) is labeled `blocked` but should be `ready` for Beta.** The badge design doesn't need to wait for a full incentive program — it just needs a visual indicator. A simple "Founding Artist" text badge or icon is sufficient for Beta. The incentive program details are a product/marketing concern, not a frontend blocker.

3. **SUR-121 (Client-side state management) should move from backlog to MVP-required.** The checkout flow, buyer dashboard, and order management cannot be built well with raw `useState`/`useEffect`. TanStack Query and React Hook Form should be adopted before or during MVP, not after. Doing the refactor after building checkout would mean rewriting checkout.

4. **SUR-178 (Lighthouse audit) is in backlog but should be Beta-required.** Artists will judge the platform partly on load speed and mobile experience. A slow or janky site undermines the gallery positioning. This must be done before artist outreach, not "whenever we get to it."

5. **SUR-119 (On-demand ISR revalidation) can wait until GA, not MVP.** The 60-second revalidation window is acceptable for MVP. Artists won't notice a 60-second delay between editing their profile and seeing changes on the public page. This becomes important at scale but is not a launch blocker.

6. **SUR-201 (Sensitive content flag) should be MMP, not Beta.** The founding cohort is hand-picked — the platform team knows what art they make. Content flagging matters when applications are open to the public and unknown artists are listing work. Move to MMP.
