# Frontend/UX Status Report — 2026-03-09

## Current State Summary

The frontend is functionally complete through Phase 3 (Artist Onboarding) with all public-facing pages, artist dashboard, authentication, and search built and deployed. The design system uses placeholder brand tokens (warm neutrals, DM Serif Display + DM Sans) that are architecturally sound but awaiting COO brand approval. The site has a gallery-quality feel with masonry grids, split hero, dark mode, and responsive mobile nav — but no admin UI exists yet and several polish/SEO items remain in backlog.

## Pages Inventory

| Route | Purpose | Status | SEO (meta/OG/JSON-LD/breadcrumbs) |
|---|---|---|---|
| `/` | Homepage — hero, featured artists, recent work, categories, waitlist | Built | Yes (WebSite + Organization JSON-LD) |
| `/artist/[slug]` | Artist profile — cover, bio, process, CV, available/sold work | Built | Yes (Person JSON-LD, breadcrumbs) |
| `/studio/[slug]` | Immersive artist studio view (separate layout, no header/footer) | Built | Yes (Person JSON-LD) |
| `/listing/[id]` | Listing detail — gallery, price, dimensions, artist card, waitlist | Built | Yes (Product JSON-LD, breadcrumbs) |
| `/category/[category]` | Category browse — pieces/artists toggle, masonry grid | Built | Yes (CollectionPage JSON-LD, breadcrumbs) |
| `/artists` | All artists directory | Built | Yes |
| `/search` | Full-text search across listings and artists | Built | Yes (SearchResultsPage JSON-LD) |
| `/for-artists` | Artist recruitment landing page | Built | Yes (WebPage JSON-LD) |
| `/apply` | Artist application form | Built | Yes (noindex, WebPage JSON-LD) |
| `/about` | About the platform | Built | Yes |
| `/privacy` | Privacy policy | Built | Yes |
| `/terms` | Terms of service | Built | Yes |
| `/sign-in` | Authentication — sign in | Built | Minimal |
| `/sign-up` | Authentication — sign up | Built | Minimal |
| `/forgot-password` | Password reset request | Built | Minimal |
| `/reset-password` | Password reset completion | Built | Minimal |
| `/verify-email` | Email verification | Built | Minimal |
| `/dashboard` | Artist dashboard home — profile completion, Stripe status | Built | N/A (protected) |
| `/dashboard/profile` | Artist profile editor | Built | N/A (protected) |
| `/dashboard/listings` | Artist listing management list | Built | N/A (protected) |
| `/dashboard/listings/new` | Create new listing | Built | N/A (protected) |
| `/dashboard/listings/[id]/edit` | Edit listing | Built | N/A (protected) |
| `/admin/*` | Admin management UI | **Not built** | N/A |

## Design System Status

### Token Architecture
- **Light + dark mode**: Full token coverage in `:root` and `.dark` with proper ShadCN alias mapping
- **Tailwind v4 integration**: All tokens registered in `@theme inline` block for utility class access
- **Brand status**: All current tokens are **placeholder/tentative** — COO brand guide not yet finalized. Architecture supports a single-file swap when brand decisions are made
- **Font stacks**: DM Serif Display (headings) + DM Sans (body) with `next/font` injection and CSS variable fallbacks
- **Type scale**: 8 utility classes defined (heading-1 through heading-4, body-large/default/small, caption)
- **Artist theme scoping**: Architecture supports per-artist CSS custom property overrides (future)

### ShadCN Component Library
Installed components in `apps/web/src/components/ui/`:
- badge, button, card, container, dialog, input, label, progress, skeleton, textarea, canvas-texture
- **11 UI primitives** total — lean set, sufficient for current needs
- Missing for admin UI: DataTable, DropdownMenu, Select, Tabs, Toast/Sonner, Sheet

### Custom Components (15)
ArtistCard, ArtistProfileViewTracker, AuthButton, Breadcrumbs, CardGrid, CategoryBrowseView, CategoryFilterBar, CategoryGrid, CookieConsent, EmptyState, Footer, Header, ImageGallery, JsonLd, ListingCard, ListingViewTracker, MasonryGrid, MobileNav, Navigation, ProfilePhoto, ScrollToTop, SearchInput, SearchResultsView, SplitHero, StudioFooter, StudioTopBar, TagPicker, ThemeToggle, ViewToggle, WaitlistForm, Wordmark

### Responsive Patterns
- Mobile nav: hamburger + slide-out drawer with portal, body scroll lock, Escape key handling
- Grid breakpoints: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` pattern used consistently
- MasonryGrid: configurable column counts per breakpoint `[mobile, sm, md, lg]`
- Header: condensing on scroll (reduces padding, shrinks wordmark)
- Container: `max-w-7xl mx-auto px-6` with consistent vertical padding
- SplitHero: stacks vertically on mobile, side-by-side on lg+

### Accessibility
- `aria-label`, `aria-expanded`, `aria-modal`, `aria-current`, `aria-hidden` used in MobileNav, Header, and interactive components
- `focus-visible` ring styling on all focusable elements (global `a:focus-visible` rule)
- `inert` attribute on closed mobile drawer
- Semantic HTML: `<nav>`, `<section>`, `<main>`, `<header>`, `<footer>` used correctly
- `lang="en"` on `<html>`
- Image alt text: descriptive for process photos and cover images (SUR-113 completed)
- **Gaps**: No skip-to-content link. No ARIA live regions for dynamic content (search results, form feedback). No reduced-motion handling beyond `scroll-behavior`. No formal WCAG audit done yet (SUR-178 in backlog).

## Key Findings

### What's Working Well
- **Gallery aesthetic**: The split hero, masonry grid, warm neutral palette, and serif headings create a credible art gallery feel — not a generic e-commerce template
- **SEO foundation**: Sitemap, robots.txt, JSON-LD structured data, OG tags, canonical URLs, and breadcrumbs are consistently implemented across all public pages
- **ISR caching**: All public pages use `revalidate = 60` with on-demand revalidation support
- **Component modularity**: Browse components (ViewToggle, CategoryFilterBar, CardGrid, EmptyState) are extracted and individually tested
- **Dark mode**: Full dark mode with system preference detection, toggling, and proper token mapping
- **Analytics**: PostHog integrated with page view tracking, artist profile view tracking, listing view tracking, and cookie consent
- **Studio page**: Separate immersive layout (`(studio)` route group) for artists to share — clean, minimal, no platform chrome
- **ListingCard**: Smart aspect ratio handling — uses natural dimensions when known, clamps extreme portraits to 2:3, falls back to square
- **Test coverage**: 13 component test files, 9 E2E/visual QA spec files, consistent `data-testid` attributes

### What Needs Attention
- **Brand identity is placeholder**: Colors, fonts, and overall personality are directional but not COO-approved. This is the single biggest visual blocker
- **Homepage "Browse all" link hardcoded to `/category/ceramics`**: Should link to a general browse page or the first category dynamically
- **No loading/skeleton states for public pages**: Dashboard has `DashboardSkeleton` but public pages show nothing during SSR failures — they just return empty arrays silently
- **Auth pages have minimal SEO**: Sign-in, sign-up, etc. have no OG/canonical/JSON-LD (acceptable since they should be noindex, but the metadata is also missing the noindex directive)

## Gaps & Concerns

### Missing Features (in Linear backlog)
- **Admin UI** (SUR-194 parent, SUR-195-200 children) — all labeled `ready`, no admin pages exist yet. This is the next major frontend work. Requires 6 issues: auth infrastructure, layout/sidebar, application mgmt, artist mgmt, listing mgmt, waitlist mgmt
- **Dynamic per-page OG images** (SUR-116) — artist and listing pages use generic fallback or profile photo. No custom social sharing cards
- **Client-side state management** (SUR-121) — no TanStack Query, Zustand, or React Hook Form. Dashboard currently uses raw useState/useEffect/useCallback pattern. Will become painful as more interactive features are added
- **Frontend error tracking** (SUR-170) — no Sentry. Frontend errors go completely undetected in production
- **Pre-launch Lighthouse audit** (SUR-178) — no formal performance/accessibility/SEO audit with targets (Perf 90+, SEO 95+, A11y 90+)
- **On-demand ISR revalidation** (SUR-119) — webhook-triggered cache busting not wired up yet
- **Sensitive content flag** (SUR-201) — artistic nudity warning/age-gate not built
- **Founding artist badge** (SUR-161) — no visual badge for founding/early artists on profiles or cards

### Missing Infrastructure
- **No skip-to-content link** — basic a11y gap
- **No error boundary** — React error boundaries not implemented; unhandled errors crash the page
- **No 404 page customization** — relying on Next.js default `not-found.tsx`
- **Auth pages missing `robots: noindex`** — sign-in, sign-up, etc. could get indexed

### Design Debt
- **generateStaticParams returns empty arrays everywhere** — no pages are pre-rendered at build time; all rely on ISR first-visit rendering. This is fine for now but means first visitors to any page get slower response
- **Category label duplication** — `ArtistCard.tsx` has its own inline `categoryLabels` mapping instead of importing from `@/lib/category-labels`

## Artist Experience Assessment

The artist-facing experience is **solid for a pre-launch platform**:
- **Application flow**: Clean `/apply` page with structured form, canvas dot texture background, proper breadcrumbs
- **For-artists landing**: Dedicated recruitment page explaining the value proposition
- **Dashboard**: Profile completion indicator, Stripe Connect onboarding status, listing management with create/edit/delete, image upload with reorder, category/tag selection
- **Public profile**: Cover image, profile photo, bio, social links, process section (photos + Mux video), CV/background section, available work in masonry grid, sold archive
- **Studio page**: Immersive shareable view for artists to link from their own sites

**Would an artist be impressed?** The profile presentation is above average for art platforms — the masonry layout, natural aspect ratios, serif typography, and warm palette feel intentional. The studio page is a nice differentiator. However, the placeholder brand identity means the site doesn't yet have a distinctive visual personality that would make it memorable. The dashboard is functional but visually plain (Card-based layout, no data visualization).

## Buyer Experience Assessment

The buyer browsing experience is **competent but not yet compelling**:
- **Homepage**: Split hero with artwork + CTA is effective. Featured artists grid and recent work masonry grid give a sense of what's available. Category grid enables exploration. Waitlist capture is prominent
- **Category browsing**: Pieces/Artists toggle is a nice touch. Masonry grid shows art at natural ratios. But no filtering by price, medium, size, or tags within a category
- **Search**: Full-text search works across listings and artists with tabbed results. No autocomplete, no search suggestions, no filters
- **Listing detail**: Image gallery, dimensions, medium, description, artist card — all present. But **no purchase flow exists** (waitlist CTA instead). No "save" or "follow" functionality
- **Artist discovery**: `/artists` directory exists but is a flat grid with no sorting or filtering

**Would a buyer come back?** The browsing experience is pleasant and the art presentation is respectful (no cropping). But without purchase capability, saved items, or personalization, there's no retention hook beyond the waitlist. This is expected for the current phase.

## Unplanned Work Discovered

These items are not tracked in any Linear issue but emerged from the codebase review:

1. **Homepage "Browse all" link hardcoded to `/category/ceramics`** — should be dynamic or link to a general browse page (line 94 of homepage `page.tsx`)
2. **Skip-to-content link missing** — standard a11y pattern not implemented
3. **Auth pages missing `robots: { index: false }`** — could get indexed by search engines
4. **Category label duplication in ArtistCard** — inline mapping instead of shared import from `category-labels.ts`
5. **No custom 404/500 error pages** — using Next.js defaults; should match brand design
6. **No React error boundaries** — unhandled client errors crash the page with no recovery
7. **generateStaticParams returns `[]` on artist and category pages** — the original issue (SUR-115) was completed but the implementation was later changed to return empty arrays, defeating the purpose of build-time pre-rendering
