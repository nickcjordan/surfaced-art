# Surfaced Art — Data Model
*Version 1.0 · CTO Reference Document · February 2026 · Confidential*

*Surfaced Art*

## 1. Overview

This document defines the complete database schema for Surfaced Art. All tables are implemented in PostgreSQL on AWS RDS and managed through Prisma migrations. Every schema change is version-controlled and applied via CI/CD.

**Key Design Principles**
- All monetary values stored in cents as integers — no floating point in financial fields
- UUIDs as primary keys throughout — portable, non-sequential, safe to expose in URLs
- Financial values on orders are snapshotted at purchase time — historical records are immutable
- Behavioral and observability data (page views, search terms, session data) belongs in the analytics layer, not the database
- Denormalized counts deferred until query profiling justifies them — calculate in real time at launch
- Schema changes are always made through Prisma migrations, never by manually altering the database

**Legend**
- Fields marked PK are primary keys — shown in orange
- Fields marked FK are foreign keys — shown in blue
- nullable fields may contain no value
- default values are applied automatically on insert if no value is provided

## 2. Schema

### users

The base authentication record for every person on the platform — artists and buyers alike. Role assignments live in user_roles, not here. This table holds only identity and authentication data.

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| cognito_id | string | Unique. The Cognito sub claim — links an incoming JWT to a user record |
| email | string | Unique |
| full_name | string |  |
| avatar_url | string | Nullable |
| preferences | jsonb | Nullable. Flexible key/value store for future user preferences — no fixed schema |
| last_active_at | timestamp | Nullable. Updated on each authenticated session. Used to identify dormant accounts |
| acquisition_utm_source | string | Nullable. e.g. instagram, google, newsletter |
| acquisition_utm_medium | string | Nullable. e.g. social, email, cpc |
| acquisition_utm_campaign | string | Nullable. e.g. launch_2026, artist_recruitment |
| acquisition_self_reported | string | Nullable. Free text or dropdown answer to 'how did you hear about us' |
| created_at | timestamp |  |
| updated_at | timestamp |  |

### user_roles

Each row represents one role held by one user. A user can hold multiple roles simultaneously — an artist is also always a buyer. Admin and curator roles are granted manually by platform staff.

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| user_id | uuid | FK → users.id |
| role | enum | buyer | artist | admin | curator | moderator |
| granted_at | timestamp | When the role was assigned |
| granted_by | uuid | Nullable. FK → users.id. Which admin granted this role. Null for system-assigned buyer role on signup |

| Constraints & Indexes |
| --- |
| UNIQUE (user_id, role) — a user cannot hold the same role twice |
| Every new user automatically receives a buyer role row on signup |
| artist role row inserted when artist application is approved |

### artist_profiles

Created when a user is accepted as an artist. This is a rich entity with its own lifecycle — it is not merely an extension of the user record. Has its own status, Stripe identity, and public presence.

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| user_id | uuid | FK → users.id. Unique — one artist profile per user |
| display_name | string | Studio name or artist name shown publicly |
| slug | string | Unique. Used in the public URL: surfaced.art/artist/slug |
| bio | text | 80-140 words recommended |
| location | string | City and region only — never a full address |
| website_url | string | Nullable |
| instagram_url | string | Nullable |
| stripe_account_id | string | Nullable. Set after artist completes Stripe Connect onboarding. Required before payouts can be received |
| origin_zip | string | Required for Shippo shipping rate calculation at checkout |
| status | enum | pending | approved | suspended |
| commissions_open | boolean | Default false. Artist toggles this to indicate they are accepting commission requests |
| cover_image_url | string | Nullable. Banner image on artist profile page |
| profile_image_url | string | Nullable. Headshot or representative image |
| application_source | string | Nullable. How the artist was recruited — e.g. advisor_network, instagram_outreach, artist_referral |
| created_at | timestamp |  |
| updated_at | timestamp |  |

| Constraints & Indexes |
| --- |
| UNIQUE (user_id) — one artist profile per user |
| UNIQUE (slug) — slugs are globally unique across all artist profiles |
| INDEX on status — frequent filter for approved artist queries |

### artist_categories

An artist can work across multiple categories. Each row is one category assignment for one artist.

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| artist_id | uuid | FK → artist_profiles.id |
| category | enum | ceramics | painting | print | jewelry | illustration | photography | woodworking | fibers | mixed_media |

| Constraints & Indexes |
| --- |
| UNIQUE (artist_id, category) — an artist cannot be assigned the same category twice |

### artist_cv_entries

Exhibition history, awards, education, press, and residencies displayed on the artist profile. Ordered explicitly via sort_order rather than by date to give artists control over presentation.

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| artist_id | uuid | FK → artist_profiles.id |
| type | enum | exhibition | award | education | press | residency | other |
| title | string | e.g. 'Solo Exhibition: Quiet Forms' |
| institution | string | Nullable. e.g. gallery name, university, publication |
| year | integer |  |
| description | text | Nullable |
| sort_order | integer | Controls display order on the profile |

### artist_process_media

Photos and video in the process section of the artist profile. Separate from listing images. The process section is a key trust and differentiation feature — buyers can see the artist actually making their work.

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| artist_id | uuid | FK → artist_profiles.id |
| type | enum | photo | video |
| url | string | Nullable. CloudFront URL. Used for photos |
| video_asset_id | string | Nullable. Video provider's internal asset identifier. Used for videos |
| video_playback_id | string | Nullable. Video provider's public playback identifier. Used for videos |
| video_provider | string | Nullable. e.g. mux. Stored explicitly to support future provider changes |
| sort_order | integer | Controls display order in the process section |
| created_at | timestamp |  |

### listings

The core platform entity. Covers standard one-of-a-kind pieces, limited edition prints, and commission slots. Status drives availability for display; quantity fields drive the underlying inventory count for editions.

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| artist_id | uuid | FK → artist_profiles.id |
| type | enum | standard | commission |
| title | string |  |
| description | text | 40-100 words recommended |
| medium | string | e.g. stoneware, oil on canvas, silver |
| category | enum | ceramics | painting | print | jewelry | illustration | photography | woodworking | fibers | mixed_media |
| price | integer | In cents. Artist-set price. Platform takes 30% at sale |
| status | enum | available | reserved_system | reserved_artist | sold |
| is_documented | boolean | Default false. Set to true when at least one process photo exists on the listing |
| quantity_total | integer | Default 1. For prints and editions — the total number produced |
| quantity_remaining | integer | Default 1. Decrements on each completed sale. When 0, status moves to sold |
| artwork_length | decimal | Nullable. Finished piece dimensions in inches |
| artwork_width | decimal | Nullable. Finished piece dimensions in inches |
| artwork_height | decimal | Nullable. Finished piece dimensions in inches |
| packed_length | decimal | Required. Shipping box dimensions in inches — used by Shippo for rate calculation |
| packed_width | decimal | Required. Shipping box dimensions in inches |
| packed_height | decimal | Required. Shipping box dimensions in inches |
| packed_weight | decimal | Required. Total packed weight in lbs including all packaging — used by Shippo |
| edition_number | integer | Nullable. For prints — this piece's number e.g. 3 |
| edition_total | integer | Nullable. For prints — total in the edition e.g. 50 |
| reserved_until | timestamp | Nullable. Set when status is reserved_system. Checked on read — if now() > reserved_until, status reverts to available |
| created_at | timestamp |  |
| updated_at | timestamp |  |

| Constraints & Indexes |
| --- |
| INDEX on artist_id — frequent filter for artist profile and dashboard queries |
| INDEX on status — frequent filter for available listings queries |
| INDEX on category — frequent filter for category browse pages |
| INDEX on (artist_id, status) — composite index for artist dashboard queries |
| CHECK quantity_remaining >= 0 |

> *Artwork dimensions and packed/shipping dimensions are separate required fields. Shipping rate APIs (Shippo) require packed box dimensions and weight — not the artwork dimensions. Artists are guided to measure and weigh the packed box, not the artwork itself.*

### listing_images

Multiple images per listing with explicit sort ordering. Process photos are flagged separately — the is_documented field on the listing is set to true when at least one process photo exists.

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| listing_id | uuid | FK → listings.id |
| url | string | CloudFront URL. Variants at multiple sizes generated by Sharp at upload time |
| is_process_photo | boolean | Default false. True for behind-the-scenes photos showing the piece being made |
| sort_order | integer | Controls display order. First image is the listing thumbnail |
| created_at | timestamp |  |

| Constraints & Indexes |
| --- |
| INDEX on listing_id |
| INDEX on (listing_id, is_process_photo) — for efficiently checking whether a listing has any process photos |

### commissions

Exists only when a listing has type = commission. Holds commission-specific details, timeline, and status. The listing record is created first — the commission record is attached to it and drives the commission-specific workflow.

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| listing_id | uuid | FK → listings.id. Unique — one commission per listing |
| buyer_id | uuid | FK → users.id. The buyer who requested the commission |
| description | text | Agreed scope captured from off-platform negotiation |
| timeline_days | integer | Nullable. Agreed delivery window in days |
| status | enum | proposed | accepted | in_progress | completed | cancelled |
| accepted_at | timestamp | Nullable. Set when buyer accepts the proposal and payment is captured |
| days_to_complete | integer | Nullable. Calculated on completion — days from accepted_at to status moving to completed |
| notes | text | Nullable. Internal notes visible to artist only |
| created_at | timestamp |  |
| updated_at | timestamp |  |

| Constraints & Indexes |
| --- |
| UNIQUE (listing_id) — one commission record per commission listing |
| INDEX on buyer_id |
| INDEX on status |

### commission_updates

Progress updates posted by the artist while a commission is in_progress. Visible to the buyer. Optional images showing work in progress.

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| commission_id | uuid | FK → commissions.id |
| content | text | Artist's update message |
| image_url | string | Nullable. CloudFront URL for an optional progress photo |
| created_at | timestamp |  |

### orders

Created when a buyer completes checkout — for both standard listings and commissions. All financial values are snapshotted at the moment of purchase. Changing the platform commission rate in the future does not affect historical order records.

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| listing_id | uuid | FK → listings.id |
| buyer_id | uuid | FK → users.id |
| artist_id | uuid | FK → artist_profiles.id. Denormalized for query efficiency |
| stripe_payment_intent_id | string | Unique. Stripe's identifier for this payment |
| artwork_price | integer | In cents. The listing price at the moment of purchase |
| shipping_cost | integer | In cents. Exact shipping amount paid by buyer — passed through to artist in full, no commission taken |
| platform_commission | integer | In cents. 30% of artwork_price |
| artist_payout | integer | In cents. 70% of artwork_price. Shipping is passed through separately |
| tax_amount | integer | In cents. Calculated by Stripe Tax at checkout |
| status | enum | pending | paid | shipped | delivered | complete | disputed | refunded |
| shipping_carrier | string | Nullable. Set when artist enters tracking information |
| tracking_number | string | Nullable. Set when artist marks order as shipped |
| days_to_fulfill | integer | Nullable. Calculated when tracking is entered — days from created_at to shipped_at |
| shipped_at | timestamp | Nullable |
| delivered_at | timestamp | Nullable |
| payout_released_at | timestamp | Nullable. Set when Stripe releases funds to artist after delivery confirmation window |
| created_at | timestamp |  |
| updated_at | timestamp |  |

| Constraints & Indexes |
| --- |
| UNIQUE (stripe_payment_intent_id) |
| INDEX on buyer_id |
| INDEX on artist_id |
| INDEX on listing_id |
| INDEX on status |

### reviews

Posted by buyers after delivery confirmation. Multi-dimensional ratings capture what the artist actually controls. Shipping and carrier issues are captured as flags rather than rating dimensions — carrier failures should not penalize the artist's score. Overall rating is computed by the platform as a weighted average of the three dimension ratings, not entered by the buyer.

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| order_id | uuid | FK → orders.id. Unique — one review per order |
| listing_id | uuid | FK → listings.id. Denormalized for query efficiency |
| buyer_id | uuid | FK → users.id |
| artist_id | uuid | FK → artist_profiles.id. Denormalized for query efficiency |
| rating_product | integer | 1-5. Does the piece match its description, photos, and stated dimensions? |
| rating_communication | integer | 1-5. Was the artist responsive and professional? |
| rating_packaging | integer | 1-5. Was the piece packaged well and did it arrive safely? |
| overall_rating | decimal | Computed by platform. Weighted average of the three dimension ratings. Not entered by buyer |
| headline | string | Nullable. Short summary line shown in listing preview |
| content | text | Nullable. Full review body |
| arrived_damaged | boolean | Default false. Buyer flag — does not affect ratings |
| arrived_late | boolean | Default false. Buyer flag — does not affect ratings |
| shipping_issue | boolean | Default false. Buyer flag for any carrier-related problem — does not affect ratings |
| artist_response | text | Nullable. Artist's public response to the review |
| artist_responded_at | timestamp | Nullable |
| created_at | timestamp |  |
| updated_at | timestamp |  |

| Constraints & Indexes |
| --- |
| UNIQUE (order_id) — one review per order |
| INDEX on artist_id — for aggregating artist ratings |
| INDEX on listing_id |
| CHECK rating_product BETWEEN 1 AND 5 |
| CHECK rating_communication BETWEEN 1 AND 5 |
| CHECK rating_packaging BETWEEN 1 AND 5 |

> *Shipping flags (arrived_damaged, arrived_late, shipping_issue) are displayed contextually to future buyers as informational notes — they do not factor into the artist's overall_rating. This protects artists from carrier failures outside their control.*

### saves

Buyers bookmarking listings for later. No inventory hold — saving a listing does not reserve it. First come first served at purchase.

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| user_id | uuid | FK → users.id |
| listing_id | uuid | FK → listings.id |
| created_at | timestamp |  |

| Constraints & Indexes |
| --- |
| UNIQUE (user_id, listing_id) — a buyer cannot save the same listing twice |
| INDEX on user_id — for buyer's saved items dashboard |
| INDEX on listing_id — for calculating save counts per listing via real-time aggregation |

> *Save counts per artist are calculated in real time via a JOIN through listings. Denormalized counts are deferred until query profiling justifies them.*

### follows

Buyers following artists to be notified when new work is listed or commissions open.

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| user_id | uuid | FK → users.id |
| artist_id | uuid | FK → artist_profiles.id |
| created_at | timestamp |  |

| Constraints & Indexes |
| --- |
| UNIQUE (user_id, artist_id) — a buyer cannot follow the same artist twice |
| INDEX on user_id |
| INDEX on artist_id — for notifying all followers of an artist on new listing or commission event |

## 3. Relationship Map

| From | To | Relationship |
| --- | --- | --- |
| users | user_roles | One-to-many. A user holds one or more roles |
| users | artist_profiles | One-to-one. A user has at most one artist profile |
| artist_profiles | artist_categories | One-to-many. An artist works in one or more categories |
| artist_profiles | artist_cv_entries | One-to-many |
| artist_profiles | artist_process_media | One-to-many |
| artist_profiles | listings | One-to-many. An artist has many listings |
| listings | listing_images | One-to-many. A listing has multiple images |
| listings | commissions | One-to-one. Only when listing.type = commission |
| commissions | commission_updates | One-to-many |
| listings | orders | One-to-many. Editions may generate multiple orders |
| orders | reviews | One-to-one. One review per completed order |
| users | saves | Many-to-many through saves table |
| users | follows | Many-to-many through follows table |

## 4. Enum Reference

**user_roles.role**
- buyer — default role assigned to all users on signup
- artist — assigned when artist application is approved
- admin — platform staff with full access
- curator — curatorial team with application review access
- moderator — content moderation access

**artist_profiles.status**
- pending — application submitted, awaiting review
- approved — accepted artist, profile visible publicly
- suspended — access revoked, profile hidden

**listings.status**
- available — listed and purchasable
- reserved_system — locked during an active checkout session. Time-boxed (15 minutes). Reverts to available if reserved_until passes without purchase completion
- reserved_artist — manually toggled by the artist. No expiry. Used for in-person holds or private arrangements
- sold — purchase completed. Piece moves to archive section of artist profile

**listings.category / artist_categories.category**
- ceramics
- painting
- print — limited editions only. See print policy in product vision document
- jewelry
- illustration
- photography
- woodworking
- fibers — fiber arts including weaving, macramé, yarn and thread-based work
- mixed_media — catch-all for glass, leather, enamel, candles, bookbinding, metalwork

**listings.type**
- standard — a completed piece listed for immediate sale
- commission — a slot created by the artist after off-platform negotiation. Checkout flow is identical to standard

**commissions.status**
- proposed — artist has submitted the commission proposal, awaiting buyer acceptance
- accepted — buyer accepted and payment captured. Artist begins work
- in_progress — artist is actively working and posting updates
- completed — artist has marked work complete and shipped
- cancelled — cancelled before completion

**orders.status**
- pending — checkout initiated, payment not yet captured
- paid — payment captured successfully
- shipped — artist has entered tracking number
- delivered — delivery confirmed by buyer or inferred from tracking
- complete — delivery confirmation window passed, payout released to artist
- disputed — buyer or artist has raised a dispute
- refunded — order refunded

## 5. Key Design Decisions

**Cents for all monetary values**
Every monetary field is stored as an integer in cents. $125.00 is stored as 12500. This eliminates floating point precision errors entirely. Stripe's API also works in cents natively, so no conversion is needed at the payment layer.

**Financial snapshot on orders**
artwork_price, platform_commission, artist_payout, shipping_cost, and tax_amount are all recorded at the moment of purchase. If the platform commission rate changes in the future, all historical orders correctly reflect the rate that was in effect at the time they were placed.

**Quantity fields for editions and prints**
One-of-a-kind pieces have quantity_total = 1 and quantity_remaining = 1. Prints and limited editions carry their actual counts. quantity_remaining decrements on each completed sale. The status enum drives the display state — quantity_remaining drives the underlying inventory logic.

**reserved_until checked on read**
System reservations during checkout are implemented as a timestamp on the listing itself. There is no background job required to revert expired reservations — the application checks reserved_until against the current time on every read and treats the listing as available if the window has passed. This is simpler and more reliable than a scheduled cleanup job at v1 scale.

**artist_id denormalized on orders and reviews**
The artist is technically derivable from orders and reviews by joining through listings. However, the most common queries — give me all orders for this artist, all reviews for this artist — are significantly simpler and faster with artist_id stored directly. This is a deliberate and justified denormalization.

**Overall rating computed by platform**
The overall_rating on reviews is not entered by the buyer. It is calculated by the platform as a weighted average of the three dimension ratings (product, communication, packaging). This means the platform controls what constitutes a fair overall score and can adjust weighting over time. Buyers cannot assign a low overall rating because they are unhappy with the weather.

**Behavioral data belongs in analytics, not the database**
Page views, search terms, checkout funnel drop-off, session data, and device/browser information are tracked by the analytics provider (Plausible, PostHog, or similar) rather than stored in the database. These tools handle bot filtering, deduplication, and session logic automatically. If view counts are needed in the database for ranking purposes, a nightly aggregation job pulls summary data from the analytics API and writes it in bulk — not on every page load.

**Denormalized counts deferred**
total_sales_count, total_revenue_cents, average_rating, and save_count are not stored on artist_profiles at launch. They are calculated in real time from orders, reviews, and saves respectively. These queries are fast on indexed foreign keys at early scale. Denormalization is added only when query profiling identifies a genuine performance problem — not preemptively.

**Schema changes via Prisma migrations**
All schema changes — adding tables, adding columns, changing types — are made through Prisma migration files that are version-controlled in the monorepo and applied automatically via GitHub Actions on deploy. No manual database alterations. This ensures every environment (local, staging, production) has an identical schema history.

> *This is a living document. Update when schema decisions change. Schema changes must be implemented as Prisma migrations — never by directly altering the database.*
