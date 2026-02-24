# Surfaced Art — Brand Guide Implementation

**Version 1.0 | February 2026**

---

## How to Use This Document

This is the definitive design system specification for Surfaced Art. It contains every visual decision needed to implement the platform's frontend. It is formatted for use with AI-powered design tools (Vercel V0, Bolt.new, Claude Code) and as a reference for any developer or designer working on the platform.

**For AI tools**: Feed this entire document as context when generating components, pages, or design systems. Every token, value, and behavioral specification is included.

**For developers**: All values are implementation-ready. CSS custom properties, Tailwind configuration, and component specifications map directly to code.

---

## Brand Identity

**Platform name**: Surfaced Art
**Tagline**: A curated digital gallery for real makers.
**Positioning**: Digital gallery — not a marketplace. Anti-AI, anti-dropship, anti-mass production. The credibility of a gallery, accessible online.
**Mood**: Warm, refined, spacious, editorial.
**Reference brands**: Aesop (warm minimalism, typography-forward, muted palette), Soho House (curated luxury, exclusive but inviting, editorial warmth).
**Anti-references**: Etsy (cluttered, inconsistent, marketplace-feel), any SaaS product (blue/white/boxy/dashboard aesthetic).

### Gallery Quality Definition

> Gallery quality means every element exists with intention. Generous whitespace lets artwork breathe. Typography is confident and considered. The platform recedes — warm, quiet, and minimal — so the art and the artist are always the focal point. Nothing competes for attention. Nothing feels accidental. The experience should feel like walking through a well-lit, warm gallery where someone thoughtful chose exactly what to hang and exactly where to hang it.

---

## Color System

All colors are defined as CSS custom properties and Tailwind theme tokens. This architecture supports dark mode implementation without refactoring.

**Palette philosophy**: Moderately muted — warm but identifiable hues. The artwork provides vibrancy; the platform is a quiet, warm frame.
**Saturation**: Moderate. Not monochromatic, not bold. Accent colors are clearly colors, but recessive enough that artwork remains the star.
**Avoided color families**: No blue, no neon, no purple, no bright pink, no teal. Nothing that feels digital-first or competes with artwork.

### Light Mode (Default)

| Token | Hex | Usage |
|---|---|---|
| `--background` | `#FAFAF8` | Main page background. Warm off-white, like gallery walls. |
| `--surface` | `#F2F0ED` | Cards, panels, elevated sections. Warm linen. Subtle layering without harsh contrast. |
| `--foreground` | `#1A1A1A` | Primary text — headings, body copy, all primary content. Near-black, softer than pure black. Like ink on paper. |
| `--muted` | `#6B6460` | Secondary text — dates, captions, metadata, helper text. Warm medium gray with brown undertone. |
| `--border` | `#E5E0DB` | Lines, card edges, input outlines, section dividers. Barely visible, warm. Prefer whitespace over borders where possible. |
| `--accent-primary` | `#B8956A` | Primary brand color. Muted gold — brass, warmth, understated luxury. Used for primary buttons, active links, focus rings, selected states. |
| `--accent-secondary` | `#C4775A` | Secondary accent. Terracotta. Used sparingly for secondary buttons, hover variations, visual variety. Supporting character, not co-lead. |
| `--error` | `#C4534A` | Error messages, form validation failures, destructive actions. Muted warm red — urgent but native to the palette. |
| `--success` | `#6B8F6B` | Success messages, confirmations. Muted sage green. Reads as positive while feeling organic and earthy. |
| `--warning` | `#D4A054` | Warnings, caution states. Warm amber — distinct from the muted gold primary accent. |

### Dark Mode (Deferred — Architecture Ready)

Dark mode is not implemented in Phase 2 but the token architecture supports it. All colors are defined as CSS custom properties; dark mode is a token swap, not a codebase refactor.

**Direction when implemented**:
- Temperature: Warm dark (dark browns and charcoals — dimly lit gallery, not a tech product)
- Approach: Warm-shifted — same hue families adjusted for dark backgrounds, not a simple inversion
- Background range: `#1C1917` to `#1A1814`
- Text: Warm off-white, not pure white
- Accent colors: Shift slightly brighter/more saturated for contrast on dark backgrounds

**Placeholder dark mode tokens** (to be refined when implemented):

| Token | Hex (placeholder) | Notes |
|---|---|---|
| `--background` | `#1C1917` | Warm dark charcoal |
| `--surface` | `#282420` | Slightly lighter for card layering |
| `--foreground` | `#F5F2EE` | Warm off-white text |
| `--muted` | `#9C9590` | Warm medium gray |
| `--border` | `#3D3835` | Subtle warm borders |
| `--accent-primary` | `#C9A678` | Slightly brighter gold for contrast |
| `--accent-secondary` | `#D08A6E` | Slightly brighter terracotta |

### CSS Custom Properties

```css
:root {
  /* Light mode (default) */
  --background: #FAFAF8;
  --surface: #F2F0ED;
  --foreground: #1A1A1A;
  --muted: #6B6460;
  --border: #E5E0DB;
  --accent-primary: #B8956A;
  --accent-secondary: #C4775A;
  --error: #C4534A;
  --success: #6B8F6B;
  --warning: #D4A054;

  /* Derived / utility */
  --accent-primary-hover: #A6845C; /* Darkened for hover states */
  --accent-secondary-hover: #B5694D;
  --overlay: rgba(26, 26, 26, 0.6); /* Modal backdrop */
}

/* Dark mode (placeholder — refine when implementing) */
[data-theme="dark"] {
  --background: #1C1917;
  --surface: #282420;
  --foreground: #F5F2EE;
  --muted: #9C9590;
  --border: #3D3835;
  --accent-primary: #C9A678;
  --accent-secondary: #D08A6E;
  --error: #D4645C;
  --success: #7FA37F;
  --warning: #E0B060;

  --accent-primary-hover: #D4B48A;
  --accent-secondary-hover: #DC9A7E;
  --overlay: rgba(0, 0, 0, 0.7);
}
```

### Tailwind Configuration

```javascript
// tailwind.config.js — color theme
module.exports = {
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        surface: 'var(--surface)',
        foreground: 'var(--foreground)',
        muted: 'var(--muted)',
        border: 'var(--border)',
        accent: {
          primary: 'var(--accent-primary)',
          'primary-hover': 'var(--accent-primary-hover)',
          secondary: 'var(--accent-secondary)',
          'secondary-hover': 'var(--accent-secondary-hover)',
        },
        error: 'var(--error)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        overlay: 'var(--overlay)',
      },
    },
  },
};
```

---

## Typography

**Philosophy**: Serif headings + sans body is a classic editorial pairing. The heading font carries the brand voice (tradition, craftsmanship). The body font stays neutral and highly legible so it never competes with artwork. The scale is large and dramatic — editorial magazine, not SaaS dashboard.

### Font Families

| Role | Font | Source | Weight Range |
|---|---|---|---|
| Headings (h1–h6), wordmark, display text | **DM Serif Display** | Google Fonts | 400 only |
| Body text, navigation, buttons, metadata | **DM Sans** | Google Fonts | 400, 500, 600 |

### Font Loading

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display&display=swap" rel="stylesheet">
```

### Tailwind Font Configuration

```javascript
// tailwind.config.js — fonts
const { fontFamily } = require('tailwindcss/defaultTheme');

module.exports = {
  theme: {
    extend: {
      fontFamily: {
        heading: ['"DM Serif Display"', ...fontFamily.serif],
        body: ['"DM Sans"', ...fontFamily.sans],
      },
    },
  },
};
```

### Type Scale

Large and dramatic. Headings command the page like gallery exhibition titles. Body text is comfortable reading size with generous line height.

| Token | Size | Weight | Line Height | Letter Spacing | Font | Usage |
|---|---|---|---|---|---|---|
| `heading-1` | 48px / 3rem | 400 | 1.1 | -0.02em | DM Serif Display | Page titles, hero text |
| `heading-2` | 36px / 2.25rem | 400 | 1.15 | -0.01em | DM Serif Display | Section headings |
| `heading-3` | 28px / 1.75rem | 400 | 1.2 | -0.01em | DM Serif Display | Subsection headings, card titles |
| `heading-4` | 22px / 1.375rem | 400 | 1.25 | 0 | DM Serif Display | Minor headings |
| `body-large` | 18px / 1.125rem | 400 | 1.7 | 0 | DM Sans | Artist statements, featured text |
| `body-default` | 16px / 1rem | 400 | 1.65 | 0 | DM Sans | Descriptions, paragraphs |
| `body-small` | 14px / 0.875rem | 400 | 1.5 | 0 | DM Sans | Metadata, captions, prices, dimensions |
| `caption` | 12px / 0.75rem | 400 | 1.4 | 0.01em | DM Sans | Fine print, copyright, disclaimers |

### Font Weight Usage

Only three weights are used across the entire site:

| Weight | Value | Usage |
|---|---|---|
| Regular | 400 | All headings (DM Serif Display), body text, descriptions |
| Medium | 500 | Navigation links, button text, form labels |
| Semibold | 600 | Emphasis within paragraphs, prices, key metadata |

### Letter Spacing Rules

- **Headings**: Slightly tighter than default (-0.01em to -0.02em) — editorial, premium feel
- **All-caps text** (wordmark, badges if applicable): Increased spacing (0.08em–0.12em) for readability
- **Body text**: Default spacing (0)

### Line Height Rules

- **Headings**: Tight (1.1–1.25) — large enough to not need much breathing room
- **Body text**: Generous (1.5–1.7) — comfortable, airy reading experience. Gallery-like openness.

---

## Logo and Wordmark

### Current State: Text-Only Wordmark

No icon or symbol logo exists yet. The site uses a text-only wordmark. A designed logo will be swapped in later (easy change — single component swap).

### Wordmark Specification

| Property | Value |
|---|---|
| Text | `SURFACED ART` |
| Case | All caps |
| Font | DM Serif Display |
| Weight | 400 (regular) |
| Letter spacing | 0.1em |
| Color (light mode) | `--foreground` (#1A1A1A) |
| Color (dark mode) | `--foreground` (#F5F2EE) |

### Favicon

Placeholder: Monogram "S" in DM Serif Display. Sizes needed: 16×16, 32×32, 180×180 (Apple touch icon).

### Implementation

```html
<!-- Wordmark in header -->
<span class="font-heading text-foreground text-xl tracking-[0.1em] uppercase">
  SURFACED ART
</span>
```

---

## Imagery and Art Presentation

These rules govern how artwork — the core content of the platform — is displayed. The platform should frame the art, never compete with it.

### Image Corner Radius

| Context | Radius | Rationale |
|---|---|---|
| Artwork images (listings, gallery views) | 2–4px | Subtle softening. Avoids early-internet sharp corners while staying structured and gallery-appropriate. |
| UI elements (cards, buttons, inputs) | 4–6px | Slightly more rounded than artwork. Consistent across all interactive elements. |
| Profile photos (artist headshots) | 50% / full circle | Distinguishes people from artwork. Universal "this is a person" signal. |

### Listing Grid Aspect Ratio

| Context | Aspect Ratio | Treatment |
|---|---|---|
| Grid views (browse, category, artist profile "available work") | **1:1 (square)** | Object-fit: cover with center crop. Clean, uniform grid across all 9 categories. |
| Detail page (listing detail) | **Natural** | Full uncropped image at original proportions. The artwork gets its full presentation here. |

This is a **hard-to-change decision**. The square grid works for ceramics, paintings, jewelry, and all other categories. The Sharp image pipeline generates square crop variants for grid views alongside full-resolution originals for detail pages.

### Image Border and Shadow

| Treatment | Value |
|---|---|
| Border | None |
| Shadow | None |
| Presentation | Flat. Art speaks for itself against the warm background. |

### Hover Behavior — Context Dependent

| Context | Behavior | Rationale |
|---|---|---|
| **Browse / featured contexts** (homepage, category pages, search results) | **Info overlay on hover**: title, artist name, and price slide up from the bottom of the image with a subtle gradient backdrop | Gives buyers useful information without requiring click-through. Page doesn't already show this data per-image. |
| **Artist profile contexts** (available work grid, archive section) | **Slight scale up (~2–3%)** with smooth transition | Info is already visible on the page alongside the grid. Hover just communicates "this is clickable." |

**Transition**: 250–300ms ease-in-out for both behaviors.

### Sold Artwork Indicator

Sold pieces remain visible on artist profiles as body of work / credibility. The sold treatment must be clear to buyers without degrading the artwork presentation.

| Element | Specification |
|---|---|
| **Red dot** | Small circle (8–10px), positioned in the upper-right corner of the image. Color: `--error` (#C4534A). Gallery convention — recognized by artists as a trust signal. |
| **"Sold" text label** | Small text in `--muted` color, positioned near the bottom-right or below the image. Font: body-small (14px), weight 500. Ensures buyers understand the piece is unavailable. |
| **Image treatment** | No opacity reduction, no grayscale, no overlay. Artwork stays fully visible. |

### Profile Photo

| Property | Value |
|---|---|
| Shape | Circle (border-radius: 50%) |
| Sizes | 120px on artist profile page, 48px on listing detail artist card, 40px in compact contexts |
| Border | None, or 2px solid `--background` when overlapping cover image |

### Cover Image (Artist Profile Banner)

| Property | Value |
|---|---|
| Aspect ratio | 2:1 (standard banner) |
| Width | Full-width (edge to edge) |
| Overlay | Subtle gradient at bottom — transparent to rgba(26, 26, 26, 0.3). Ensures profile photo and text overlapping the bottom edge are readable against any image. |
| Object-fit | cover, center |

---

## Component Specifications

All components use consistent 4–6px border radius, the warm color palette, and smooth 250–300ms transitions.

### Buttons

| Property | Primary | Secondary |
|---|---|---|
| Background | `--accent-primary` (#B8956A) | Transparent |
| Border | None | 1px solid `--accent-primary` |
| Text color | White (#FFFFFF) | `--accent-primary` |
| Font | DM Sans, 500 weight | DM Sans, 500 weight |
| Text case | Sentence case | Sentence case |
| Border radius | 4–6px | 4–6px |
| Padding | 12px 24px | 12px 24px |
| Hover | Background darkens to `--accent-primary-hover` | Background fills with accent at 10% opacity |
| Transition | 250ms ease-in-out | 250ms ease-in-out |

```html
<!-- Primary button -->
<button class="bg-accent-primary text-white font-body font-medium rounded-[5px] px-6 py-3 
  hover:bg-accent-primary-hover transition-colors duration-250 ease-in-out">
  Join the waitlist
</button>

<!-- Secondary button -->
<button class="border border-accent-primary text-accent-primary font-body font-medium rounded-[5px] px-6 py-3
  hover:bg-accent-primary/10 transition-colors duration-250 ease-in-out">
  View profile
</button>
```

### Cards

| Property | Value |
|---|---|
| Background | `--surface` (#F2F0ED) |
| Border | None by default |
| Shadow | None by default |
| Border radius | 4–6px |
| Hover | Subtle shadow appears (`0 2px 8px rgba(26, 26, 26, 0.08)`) + slight lift (`translateY(-2px)`) |
| Transition | 250ms ease-in-out |

```html
<!-- Listing card -->
<div class="bg-surface rounded-[5px] overflow-hidden 
  hover:shadow-md hover:-translate-y-0.5 transition-all duration-250 ease-in-out">
  <img class="w-full aspect-square object-cover rounded-[3px]" />
  <div class="p-4">
    <h3 class="font-heading text-foreground">Title</h3>
    <p class="text-muted text-sm">Artist Name · Medium</p>
    <p class="text-foreground font-semibold text-sm mt-1">$125.00</p>
  </div>
</div>
```

### Form Inputs

| Property | Value |
|---|---|
| Border | 1px solid `--border` (#E5E0DB) |
| Border radius | 4–6px |
| Background | Transparent (shows page background) |
| Text | `--foreground` |
| Placeholder text | `--muted` |
| Focus state | Border color changes to `--accent-primary` (#B8956A) |
| Transition | 200ms ease-in-out on border-color |
| Padding | 10px 14px |

### Badges / Pills

| Property | Value |
|---|---|
| Shape | Slightly rounded rectangle (border-radius: 4px) |
| Fill | Subtle muted fill — `--surface` or `--border` at low opacity |
| Text | `--muted`, body-small (14px), weight 500 |
| Size | Small and understated |
| Color coding | None — all badges use the same neutral style. Artwork provides the color. |

```html
<!-- Category badge -->
<span class="bg-surface text-muted text-sm font-medium px-3 py-1 rounded">
  Ceramics
</span>
```

### Navigation

| State | Treatment |
|---|---|
| Default | `--foreground` text, DM Sans weight 500 |
| Hover | Text color shifts to `--accent-primary` |
| Active page | `--accent-primary` underline (2px), `--accent-primary` text color |
| Transition | 200ms ease-in-out |

### Modals / Dialogs

| Property | Value |
|---|---|
| Backdrop | `--overlay` (rgba(26, 26, 26, 0.6)), no blur |
| Background | `--background` |
| Border radius | 4–6px |
| Shadow | Large shadow for elevation |
| Animation | Fade in, 200ms ease-out |
| Max width | 560px for standard dialogs, full-width minus padding for image lightboxes |

### Loading / Skeleton States

| Property | Value |
|---|---|
| Style | Skeleton blocks matching content layout shapes |
| Color | `--border` (#E5E0DB) as base, subtle pulse animation |
| Animation | Opacity pulse between 0.4 and 1.0, 1.5s ease-in-out infinite |
| Spinners (button loading) | Simple circular spinner in `--accent-primary`, 20px |

---

## Spacing and Layout

**Philosophy**: Very spacious. The site should feel like walking through a gallery — each piece given room to breathe, generous whitespace between sections, editorial pacing. This is the strongest visual differentiator from Etsy's dense, cluttered aesthetic.

### Spacing Scale

| Token | Value | Usage |
|---|---|---|
| `space-xs` | 4px | Tight internal spacing |
| `space-sm` | 8px | Between related elements (icon + label) |
| `space-md` | 16px | Default component internal padding |
| `space-lg` | 24px | Between components in a group |
| `space-xl` | 32px | Grid gaps between listing cards |
| `space-2xl` | 48px | Between distinct content blocks |
| `space-3xl` | 80px | Between major page sections |
| `space-4xl` | 96px | Maximum section spacing for editorial pacing |

### Layout Values

| Property | Value | Notes |
|---|---|---|
| Content max width | 1280px | Standard for content areas |
| Hero / cover images | Full-width | Edge to edge, no max-width constraint |
| Grid gaps | 24–32px (`space-xl`) | Each piece stands alone, like artwork on a gallery wall |
| Section spacing | 80–96px (`space-3xl` to `space-4xl`) | Strong editorial pacing between major sections |
| Mobile padding | 24px (horizontal) | Moderate — content doesn't touch edges |
| Desktop padding | Handled by max-width + centering | No additional horizontal padding needed beyond the centered container |

### Grid Specifications

| Context | Columns | Gap |
|---|---|---|
| Listing grid (desktop) | 3–4 columns | 28px |
| Listing grid (tablet) | 2 columns | 24px |
| Listing grid (mobile) | 1–2 columns | 20px |
| Category grid (homepage) | 3 columns | 28px |
| Featured artists (homepage) | 2–3 cards | 28px |

---

## Motion and Interaction

**Philosophy**: Smooth and measured. Transitions should feel considered and luxurious — not snappy like a SaaS tool, not slow enough to feel sluggish. Motion communicates state changes without distracting from artwork.

### Transition Defaults

| Property | Value |
|---|---|
| Duration | 250–300ms |
| Easing | ease-in-out |
| Properties to animate | color, background-color, border-color, box-shadow, transform, opacity |

### Specific Behaviors

| Interaction | Behavior |
|---|---|
| Button hover | Background color darkens. 250ms ease-in-out. |
| Card hover | Subtle shadow appears + slight lift (translateY -2px). 250ms ease-in-out. |
| Link hover | Color shifts to accent. 200ms ease-in-out. |
| Image hover (browse) | Info overlay slides up from bottom. 300ms ease-in-out. |
| Image hover (profile) | Scale up 2–3%. 300ms ease-in-out. |
| Modal open | Fade in. 200ms ease-out. |
| Skeleton loading | Opacity pulse 0.4 → 1.0. 1.5s ease-in-out infinite. |

### Page Transitions

None. Standard Next.js navigation. Clean and fast. May add subtle fades in a later phase.

### Scroll Behavior

| Behavior | Value |
|---|---|
| Anchor / internal links | Smooth scroll (`scroll-behavior: smooth`) |
| Parallax | None |
| Scroll-triggered animations | None |

---

## Artist Profile Customization

Artists get a personal touch without fragmenting the gallery experience.

### Customizable by Artist

| Aspect | Allowed |
|---|---|
| Cover image | Yes |
| Accent color (subtle personal brand color) | Yes — displayed as a colored line, dot, or subtle tint on their profile |
| Background tone (slight warm/cool shift) | Yes — within a constrained range that stays gallery-appropriate |

### Locked to Platform Brand

| Aspect | Locked |
|---|---|
| Navigation | Yes |
| Footer | Yes |
| Page structure / layout | Yes |
| Typography (fonts, scale, weights) | Yes |
| Spacing and grid | Yes |
| Card style for listings | Yes |
| Component styles (buttons, inputs, badges) | Yes |

### Implementation Note

Artist accent color should be stored on the `artist_profiles` table (add a `custom_accent_color` field, nullable, hex string). Applied via CSS custom property override scoped to the profile page. Constrained to a curated set of warm, muted hues — not a free color picker.

---

## Page-Specific Design Notes

### Homepage

1. **Hero**: Full-width. Platform positioning statement in heading-1. "A curated digital gallery for real makers. Every artist is vetted. Every piece is handmade." Typographically strong, generous vertical padding (120px+).
2. **Featured artists**: 2–3 artist cards with cover image, name, medium, location. Links to profiles.
3. **Featured listings**: 4–6 listing cards across categories. Square images, info overlay on hover.
4. **Category grid**: All 9 categories with listing counts. Visual grid.
5. **Waitlist capture**: Email input + primary button. "Be the first to know when we open to buyers." No auth required.

### Artist Profile (`/artist/[slug]`)

1. **Cover image**: Full-width, 2:1 aspect ratio, subtle bottom gradient.
2. **Profile photo**: Circle, overlapping bottom edge of cover image, 120px.
3. **Hero info**: Display name (heading-1), location, category pills (badges).
4. **Artist statement**: body-large, 80–140 words.
5. **Social links**: Instagram and website displayed openly.
6. **Process section**: Photo grid + Mux video embed. Key trust signal.
7. **CV / history**: Clean list grouped by type, sorted by sort_order.
8. **Available work**: Listing grid with square images. Scale-up hover.
9. **Archive**: Sold pieces with red dot + "Sold" label. Same grid format.

### Listing Detail (`/listing/[id]`)

1. **Photo gallery**: Primary image large, thumbnail strip below. Keyboard navigable. Natural aspect ratio.
2. **Details panel**: Title (heading-2), medium, category badge, price (semibold), artwork dimensions.
3. **Edition info**: "Edition 3 of 50" if applicable.
4. **Description**: body-default, 40–100 words.
5. **Artist card**: Circle profile photo, display name, location, link to full profile.
6. **CTA**: Phase 2 — "Join the waitlist to purchase" with email input. Elegant, not broken-looking.

### Category Browse (`/category/[category]`)

1. **Category header**: Category name (heading-1), listing count.
2. **Listing grid**: Square images, info overlay on hover (title, artist, price).
3. **Category navigation**: Links to all other categories.
4. **Empty state**: Clean message, not broken-looking. Suggest browsing other categories.

---

## Implementation Checklist

### Tailwind Config
- [ ] Custom colors via CSS custom properties
- [ ] Custom font families (heading, body)
- [ ] Custom spacing scale if extending defaults
- [ ] Border radius tokens

### Global Styles
- [ ] CSS custom properties for all color tokens
- [ ] Dark mode token slots (data-theme="dark")
- [ ] Font loading (Google Fonts preconnect + link)
- [ ] Base styles: background-color, color, font-family on body

### Components to Build
- [ ] Button (primary, secondary)
- [ ] Card (listing card with hover)
- [ ] Input / textarea
- [ ] Badge / pill
- [ ] Navigation (header with active states)
- [ ] Footer
- [ ] Modal / dialog
- [ ] Skeleton loader
- [ ] Image with info overlay (browse context)
- [ ] Image with scale hover (profile context)
- [ ] Sold indicator (red dot + text)
- [ ] Artist profile photo (circle, multiple sizes)
- [ ] Cover image with gradient overlay
- [ ] Wordmark

### Pages to Build (Phase 2)
- [ ] Homepage
- [ ] Artist profile (`/artist/[slug]`)
- [ ] Listing detail (`/listing/[id]`)
- [ ] Category browse (`/category/[category]`)

---

## Tools Recommended for Design System Development

### For Mockup / Prototyping
- **Vercel V0** (v0.dev) — Generate React + Tailwind components from this document. Feed the full brand guide as context. Best for individual components and page sections.
- **Bolt.new** — Full app environment. Good for building multi-page prototypes with routing. Feed this document as the design system spec.
- **Lovable** — AI-powered builder for full-page layouts. Good for rapid iteration on page designs.

### For Design System Documentation
- **Storybook** — Industry standard for documenting component libraries. Generate component stories for each component spec in this guide. Serves as the living reference for all developers.
- **Figma** — If the COO wants to iterate visually before code, create a Figma file with color tokens, type scale, and component specs from this document.

### For Token Management
- **Style Dictionary** — Converts design tokens (JSON) into Tailwind config, CSS variables, and other formats. Useful as the single source of truth if the palette is iterated frequently.

### Recommended Workflow
1. Feed this document to **V0** to generate initial React + Tailwind components
2. Assemble components into page layouts in **V0** or **Bolt.new**
3. Review and iterate with COO
4. Transfer finalized components into the actual `apps/web` codebase
5. Optionally document in **Storybook** for ongoing reference

---

*This document is the definitive design system for Surfaced Art. All visual implementation decisions derive from this guide. Update when brand decisions change. Color palette may be swapped as a unit — all other decisions are independent.*

*Version 1.0 | February 2026 | CTO + COO: Surfaced Art*
