# Surfaced Art — Product Vision
*Version 0.4 · February 2026 · Confidential*

*Surfaced Art*

## 1. Platform Vision & Positioning

This platform is a digital gallery — not a marketplace. That distinction is foundational to every design decision. Artists understand galleries. They trust galleries. They know the relationship, the commission structure, and the credibility that comes with being represented. The word 'marketplace' means Etsy. The word 'gallery' means legitimacy.
The platform exists to give genuine, independent artists a credible online home where buyers can trust that every piece is handmade by the artist who is selling it. It is anti-AI, anti-dropship, and anti-mass production by design and by culture.

### Core Positioning Statement

A curated digital gallery for real makers. Every artist is vetted. Every piece is handmade. No AI. No drop shipping. No mass production. The credibility of a gallery, accessible online.

### What We Are Not

- Not an Etsy competitor in the marketplace sense
- Not a place for AI-generated art or prints
- Not a place for drop-shipped or mass-produced goods
- Not a platform where anyone can sign up and start selling
- Not a replacement for established gallery relationships

### What We Are

- A pipeline for emerging and independent artists who don't yet have gallery representation
- A trust signal for buyers who are tired of being burned by Etsy slop
- A scouting ground where galleries can discover emerging talent
- A community built by artists, for artists

## 2. Target Audience

### Primary Artist Target: The Gray Area Artist

The platform's primary artist is not defined by career stage — hobbyist and emerging artists are equally welcome. The only criteria is authenticity. The target artist is someone who:
- Makes real, physical, handmade work themselves
- Has demonstrated effort to share their work publicly (social media, website, or exhibition history)
- Does not have an exclusive gallery relationship that would conflict with participation
- Wants more exposure and a credible online presence but lacks the right avenue

### Artist Career Stage Targets

**Primary targets: **Hobbyist and Emerging artists
**Secondary targets: **Mid-career artists (later stage growth)
**Out of scope at launch: **Blue-chip and established gallery-represented artists

### Primary Buyer Target

Buyers who have been burned by Etsy and want a trustworthy alternative. They are willing to pay fair prices for genuine handmade work and want to connect with the story and the maker behind the piece.

## 3. Business Model

### Revenue Model

**Gallery Commission: **30% of each sale. This covers all transaction fees, marketing, artist profile maintenance, and customer service — framed as a bundled service to artists, not merely a revenue cut. Industry standard at physical galleries is 40%; 30% is competitive and validated by real-world comparable operators.
**No commission on shipping: **Shipping costs are a buyer-paid pass-through to the artist. The platform takes no commission on shipping.
**Future consideration: **Optional monthly studio subscription tier unlocking premium features (analytics, featured placement, additional portfolio slots)
**No listing fees at launch: **Artists are not charged to maintain a profile or list work

### Commission Disclosure to Buyers

The raw commission percentage is not displayed to buyers. The platform communicates value rather than mechanics. Suggested language: 'Prices are set by the artist. A portion of each sale supports the platform and keeps this gallery running.' The 30% figure is artist-facing only.

### Financial Viability

The model is viable provided curation costs are managed carefully. The primary operating cost is the artist vetting process. Early stage this is manageable with a small team (founder + advisors). At scale, a community-based flagging system combined with a curatorial team (ideally composed of artists) is the path forward.
Key principle: Incentives must be aligned with quality over volume. Unlike Etsy, revenue should never depend on maximizing the number of sellers regardless of quality.

## 4. Artist Vetting & Application

### Application Philosophy

Applying to this platform should feel like applying to a gallery — an honor, not a formality. Acceptance should mean something. Artists who earned their place have skin in the game and are less likely to violate the platform's culture.

### Vetting Criteria

An applicant must demonstrate at least one of the following to be considered:
- An active social media presence (Instagram primary) showing their work and process
- A personal website or portfolio
- Exhibition history — galleries, shows, academic, juried exhibitions, art fairs

The underlying principle is demonstrated effort to be seen. A real artist is trying to get their work into the world in some form. This is publicly verifiable and does not favor fame over authenticity — a hobbyist with 200 genuine Instagram followers who shows at local art fairs is legitimate.

### Application Requirements

- Social media links (Instagram primary)
- Personal website or portfolio URL (if applicable)
- Exhibition or show history (if applicable)
- Artist statement in their own words
- Medium / category selection
- Process photos — works in progress, studio shots, tools, materials (in addition to finished work)

### Review Process

All applications include a human review step. Early stage this is the founding team and advisory artists. Applications are not fully automated. Reviews are managed through external tooling at launch (e.g. Airtable or Notion) — a custom internal admin tool is a future build. Accepted artists receive a formal acceptance communication that mirrors a gallery acceptance letter in tone.

### Artist Re-Vetting

At launch, re-vetting of existing artists is handled ad hoc through occasional manual review. No automated tooling is required at v1. Periodic re-vetting processes and automated flagging are future enhancements.

### Seeding Strategy — Pre-Launch

The platform cannot launch to the public without credibility already baked in. A minimum of 4-5 legitimate artists per category must be in place before public launch. These founding artists are hand-selected through the founding advisor network and serve as the anchor cohort that gives the platform instant legitimacy.

## 5. Art Categories

The platform launches with the following 9 categories. Categories may be subdivided organically as the platform grows and volume warrants it.

- Ceramics
- Painting
- Print (see Print Policy below)
- Jewelry
- Illustration
- Photography
- Woodworking
- Fibers / Textiles
- Mixed Media (catch-all for glass, leather, enamel, candles, bookbinding, metalwork, and anything that does not fit neatly into the above)

Note: The historical art vs. craft distinction is acknowledged. Categories like glasswork, leatherwork, and metalwork are housed under Mixed Media at launch. If volume in any subcategory warrants its own section, it can be broken out at that time.

## 6. Print Policy

Prints are a legitimate and important medium with a long fine art history. The platform welcomes prints that meet the following criteria:
- Limited edition with a defined and declared print run number
- Signed by the artist
- The artist is meaningfully involved in the production beyond uploading a file
- Archival quality production

The following are explicitly not permitted:
- Open edition prints with no defined run limit
- Print-on-demand services (Printful, Printify, or similar) where the artist does not touch the final product
- Unlimited runs without artist involvement or signature

## 7. Artist Profile Structure

### Philosophy

The artist profile is a flagship feature of the platform — not just a functional page but a shareable, gallery-quality representation of the artist and their work. It should be something artists are proud to share. Profiles have clean, shareable URLs (e.g. surfaced.art/artist/studioname) and support easy QR code generation for physical sharing. All profile content is publicly visible — no login required to view a profile.

### Profile Elements

- Name or studio name
- Location (city / region — not full address)
- Category / medium
- Profile photo and cover image / banner
- Artist statement — in their own words, 80-140 words recommended
- CV / history — exhibitions, awards, education, press
- Process section — behind-the-scenes photos and short video of them making their work (key trust and differentiation feature)
- Social links — Instagram, personal website (not hidden; real galleries don't pretend artists don't exist elsewhere)
- Available work — active listings shoppable from profile
- Archive / past work — sold pieces shown as body of work, not for sale but for credibility and storytelling

### Media Handling

**Photos: **Stored on AWS S3 or Cloudflare R2, served via CDN with image optimization. Maximum upload size: 2MB per image. Accepted formats: JPEG, JPG, PNG.
**Video (process section): **Hosted via Cloudflare Stream or Mux — managed third-party video hosting handles transcoding and delivery. Artist uploads directly. No self-hosted video infrastructure required at launch.

### Artist Onboarding Post-Acceptance

Profile setup is self-serve. No guided wizard required at v1. Accepted artists receive a welcome message (either via email or a first-login prompt) outlining a few high-level steps to get their profile live. Stripe Connect onboarding is a required step before an artist can receive payment — this is either completed during profile setup or gated at first listing publish.

## 8. Listings

### Listing Types

**Documented Work: **Listing includes at least one process photo. Receives a trust badge on the listing. Aspirational, not mandatory.
**Portfolio Work: **Completed pieces without process photos. Permitted, especially at onboarding. The artist's vetting already established legitimacy.

Over time, artists are nudged toward documenting their process because documented listings are expected to convert better. The badge makes it aspirational rather than a hard gate.

### Required Listing Information

- Multiple photos of the finished work (square format preferred, plain background, multiple angles including front, back, and detail shots)
- At least one process photo (for Documented Work badge)
- Title and medium
- Artwork dimensions — length x width x height
- Packed/shipping dimensions — length x width x height of the packed box (used for shipping rate calculation)
- Packed/shipping weight — total weight of packed box in lbs (used for shipping rate calculation)
- Edition information (for prints and limited works)
- Story / description of the specific piece — 40-100 words recommended
- Price (artist sets; platform takes 30% at sale; shipping is separate and not subject to commission)
- Availability status — see Inventory Status Model below

Note: Artwork dimensions and packed/shipping dimensions are collected as separate fields. Artwork dimensions describe the piece itself. Packed dimensions describe the shipping box including all packaging materials. Both are required. Shipping rate APIs need packed dimensions and packed weight, not artwork dimensions.

### Inventory Status Model

Each listing carries one of four statuses:
- Available — listed and purchasable
- Reserved (System) — temporarily locked during an active checkout session. Time-boxed (suggested: 15 minutes). Automatically reverts to Available if checkout is not completed. Set atomically at the database level to handle simultaneous purchase attempts.
- Reserved (Artist) — manually toggled by the artist for any reason (e.g. agreed to an in-person sale, holding for a buyer). No expiry. Artist manages this manually.
- Sold — purchase completed. Piece moves to archive on artist profile.

### Commission Requests

Artists can open or close commissions directly from their profile. See Section 11 for full commission flow details.

## 9. Buyer Experience

### Browsing & Discovery

The platform is fully public — no account required to browse. Primary navigation is category-based. Search is available as a secondary discovery mode. Artist profiles are public and shareable, serving as a key organic marketing channel.

### Trust Signals

- Platform vetting indicator on every accepted artist profile
- Documented Work badge on listings with process photos
- Process section on artist profiles (photos and video of making)
- Buyer reviews visible on artist profiles

### Purchase Flow

Browsing is public. An account is required to purchase. Account creation is frictionless — email, Google, or Apple sign-in. At checkout, artwork price and calculated shipping cost are displayed as separate line items. Shipping is calculated in real time based on artist origin zip, buyer destination zip, packed dimensions, and packed weight. Sales tax is calculated automatically via Stripe Tax. Payment is captured immediately and held until delivery is confirmed. Artist receives payout after the delivery confirmation window passes.

### Buyer Account & Dashboard

- Saved / bookmarked pieces (no inventory hold — first come first served)
- Order history and tracking status
- Followed artists — notified when new work is listed or commissions open
- Open commission requests
- Post-delivery review prompts

### Reviews

After delivery confirmation, buyers are nudged to leave a review of the artist and the piece. Reviews are visible on the artist profile and contribute to the artist's platform reputation over time.

## 10. Shipping & Fulfillment

### Model

Artists ship directly to buyers themselves. The platform does not hold inventory. US-only at launch.

### Shipping Cost Model — Confirmed

Shipping costs are calculated at checkout based on packed dimensions and weight. They are displayed as a separate line item from the artwork price, paid by the buyer, and passed through to the artist in full. The platform takes no commission on shipping costs. This model is validated by Urn Studios, a comparable real-world operator, and cleanly separates artwork revenue (subject to 30% commission) from shipping (pass-through, no commission).

### Shipping Rate Integration

Shipping rates are calculated via Shippo or EasyPost API at checkout. Required inputs: artist origin zip code, buyer destination zip code, packed box dimensions, and packed box weight. Rates are fetched in real time and presented to the buyer at checkout. The platform generates a shipping label for the artist or provides a label purchase flow.

### Packaging Guidance

The platform provides packaging guidance to artists as part of onboarding and help documentation, particularly for fragile categories (ceramics, glass, sculpture). Delivery carriers are not known for gentle handling. Breakage due to poor packaging is a reputational and dispute risk for the platform. This is a COO content responsibility.

### Platform Accountability Mechanisms

- Payment hold — buyer payment captured at purchase, not released to artist until delivery confirmation window passes (suggested: 7 days after expected delivery)
- Tracking required — artists must enter a tracking number within 3 business days of sale
- Dispute resolution — buyers and artists submit issues through a simple portal, handled manually at launch
- Artist reputation — shipping reliability, fulfillment rate, and dispute history tracked on artist profile

### Payment Processing

Stripe Connect for marketplace split payments. Stripe Tax for automatic sales tax calculation. Delayed payout configuration handles payment hold natively. Legal review of Terms of Service required before processing real transactions.

### Stripe Connect Artist Onboarding

Artists complete Stripe-hosted identity and banking verification via Stripe Connect Onboarding. Platform stores only a Stripe Account ID per artist. Required gate before artist can receive payment.

## 11. Commission Flow (v1)

The v1 commission flow is intentionally lightweight — tracking and accountability without platform-managed negotiation.

### Flow

- Buyer and artist negotiate off-platform via email — pricing, timeline, details
- Artist submits commission form on the platform, tagging the buyer and entering agreed details
- Buyer receives proposal notification and reviews details
- Buyer accepts or rejects. Acceptance triggers payment capture.
- Commission enters active status — artist begins work
- Artist posts progress updates as work develops
- On completion, follows same shipping, delivery tracking, and review flow as a standard purchase

### Payment Structure

v1 supports full payment at proposal acceptance. Split payment (deposit + final) is a future enhancement.

## 12. Search & Discovery Phases

### Phase 1 — Launch

Keyword search across titles, artist names, materials, and descriptions. Category-based navigation.

### Phase 2 — Enhancement (Future)

Filters by price range, medium, location, dimensions, availability.

### Phase 3 — Future

Personalized recommendations based on browse and save history.

## 13. Platform Administration

### v1 Approach

Internal admin tooling is intentionally minimal at launch. Artist-facing and buyer-facing features are built properly from day one. Internal tooling deferred to external tools early on.
- Artist applications reviewed via external tool (Airtable, Notion, or similar)
- Dispute tickets handled via existing team tooling
- Artist re-vetting handled ad hoc through manual review

## 14. Key Advisors & Team

### Founding Advisor & Brand Ambassador

A professional artist with an established network across multiple media categories. Roles include: input on artist experience design and platform culture, vetting and curatorial advisory, recruiting the founding artist cohort, and ongoing voice of the artist community.

### Core Team

**CTO: **Software engineer responsible for all technical build and implementation decisions
**COO: **Responsible for operations, branding, and all non-technical aspects of building the platform

## 15. Future Enhancements

*The following features have been identified and intentionally deferred.*

### Buyer & Discovery

- Personalized recommendations based on save and browse history (Search Phase 3)
- Faceted filtering by price, medium, location, dimensions (Search Phase 2)

### Artist Tools

- Artist analytics dashboard — profile views, listing views, saves, conversion rates
- Optional monthly studio subscription tier with premium features

### Commission Flow

- Split payment for commissions — deposit at approval, final payment on completion
- In-platform commission negotiation and messaging thread

### Platform & Admin

- Internal custom admin dashboard for application review, content moderation, dispute management
- Automated artist re-vetting with flagging for human review
- Automated dispute resolution workflows
- Native mobile app (iOS and/or Android)

### Buyer-Artist Communication

- In-platform messaging between buyers and artists

### Shipping

- International shipping support (US-only at launch)

### Payments

- Split payment for commissions — deposit at acceptance, final payment on completion

> *This is a living document. Decisions will be added, revised, and expanded as planning continues.*
