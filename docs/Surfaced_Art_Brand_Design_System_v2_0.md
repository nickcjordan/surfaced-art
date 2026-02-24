# Surfaced Art — Brand & Design System

**Version 2.0 | February 2026**

**Status**: Definitive source of truth for all frontend implementation. Supersedes `Surfaced_Art_Brand_Guide_v1_0.md`.

---

## How to Use This Document

This is the single reference for every visual decision in the Surfaced Art platform. It contains brand identity, design tokens, component specifications, and implementation details.

**For AI tools**: Feed this entire document as context when generating components, pages, or design systems. Every token, value, and behavioral specification is included.

**For developers**: All values are implementation-ready. CSS custom properties, Tailwind v4 `@theme inline` configuration, and component specifications map directly to code.

**Reference implementation**: The `design_system/` folder contains an interactive component showcase built with these exact tokens. Use it to preview components visually.

---

## 1. Brand Identity

**Platform name**: Surfaced Art
**Tagline**: A curated digital gallery for real makers.
**Positioning**: Digital gallery — not a marketplace. Anti-AI, anti-dropship, anti-mass production. The credibility of a gallery, accessible online.
**Mood**: Warm, refined, spacious, editorial.
**Reference brands**: Aesop (warm minimalism, typography-forward, muted palette), Soho House (curated luxury, exclusive but inviting, editorial warmth).
**Anti-references**: Etsy (cluttered, inconsistent, marketplace-feel), any SaaS product (blue/white/boxy/dashboard aesthetic).

### Gallery Quality Definition

> Gallery quality means every element exists with intention. Generous whitespace lets artwork breathe. Typography is confident and considered. The platform recedes — warm, quiet, and minimal — so the art and the artist are always the focal point. Nothing competes for attention. Nothing feels accidental. The experience should feel like walking through a well-lit, warm gallery where someone thoughtful chose exactly what to hang and exactly where to hang it.

---

## 2. Color System

All colors are defined as CSS custom properties and mapped to Tailwind theme tokens via `@theme inline`. The architecture supports light and dark mode via a class toggle.

**Palette philosophy**: Moderately muted — warm but identifiable hues. The artwork provides vibrancy; the platform is a quiet, warm frame.
**Saturation**: Moderate. Not monochromatic, not bold. Accent colors are clearly colors, but recessive enough that artwork remains the star.
**Avoided color families**: No blue, no neon, no purple, no bright pink, no teal. Nothing that feels digital-first or competes with artwork.

### Light Mode (Default)

| Token | Hex | Usage |
|---|---|---|
| `--background` | `#FAFAF8` | Main page background. Warm off-white, like gallery walls. |
| `--surface` | `#F2F0ED` | Cards, panels, elevated sections. Warm linen. Subtle layering without harsh contrast. |
| `--foreground` | `#1A1A1A` | Primary text — headings, body copy, all primary content. Near-black, softer than pure black. |
| `--muted` | `#6B6460` | Secondary text — dates, captions, metadata, helper text. Warm medium gray with brown undertone. |
| `--border` | `#E5E0DB` | Lines, card edges, input outlines, section dividers. Barely visible, warm. Prefer whitespace over borders where possible. |
| `--accent-primary` | `#B8956A` | Primary brand color. Muted gold — brass, warmth, understated luxury. Used for primary buttons, active links, focus rings, selected states. |
| `--accent-primary-hover` | `#A6845C` | Darkened primary for hover states. |
| `--accent-secondary` | `#C4775A` | Secondary accent. Terracotta. Used sparingly for secondary visual variety. Supporting character, not co-lead. |
| `--accent-secondary-hover` | `#B5694D` | Darkened secondary for hover states. |
| `--error` | `#C4534A` | Error messages, form validation, destructive actions. Muted warm red — urgent but native to the palette. |
| `--success` | `#6B8F6B` | Success messages, confirmations. Muted sage green. |
| `--warning` | `#D4A054` | Warnings, caution states. Warm amber — distinct from the muted gold primary accent. |
| `--overlay` | `rgba(26, 26, 26, 0.6)` | Modal backdrop. |

### Dark Mode

Dark mode uses warm dark tones — dimly lit gallery, not a tech product. Same hue families adjusted for dark backgrounds.

| Token | Hex | Usage |
|---|---|---|
| `--background` | `#1C1917` | Warm dark charcoal. |
| `--surface` | `#282420` | Slightly lighter for card layering. |
| `--foreground` | `#F5F2EE` | Warm off-white text. |
| `--muted` | `#9C9590` | Warm medium gray for secondary text. |
| `--border` | `#3D3835` | Subtle warm borders. |
| `--accent-primary` | `#C9A678` | Slightly brighter gold for contrast on dark backgrounds. |
| `--accent-primary-hover` | `#D4B48A` | Lighter gold hover. |
| `--accent-secondary` | `#D08A6E` | Slightly brighter terracotta. |
| `--accent-secondary-hover` | `#DC9A7E` | Lighter terracotta hover. |
| `--error` | `#D4645C` | Lighter warm red. |
| `--success` | `#7FA37F` | Lighter sage. |
| `--warning` | `#E0B060` | Lighter amber. |
| `--overlay` | `rgba(0, 0, 0, 0.7)` | Modal backdrop. |

### ShadCN Token Mapping

ShadCN components consume their own token names. These alias our brand tokens so ShadCN components render with our palette automatically.

#### Light Mode

| ShadCN Token | Value | Maps To |
|---|---|---|
| `--card` | `#F2F0ED` | `--surface` |
| `--card-foreground` | `#1A1A1A` | `--foreground` |
| `--popover` | `#FAFAF8` | `--background` |
| `--popover-foreground` | `#1A1A1A` | `--foreground` |
| `--primary` | `#B8956A` | `--accent-primary` |
| `--primary-foreground` | `#FFFFFF` | White text on primary buttons |
| `--secondary` | `#F2F0ED` | `--surface` |
| `--secondary-foreground` | `#1A1A1A` | `--foreground` |
| `--muted-foreground` | `#6B6460` | `--muted` |
| `--accent` | `#F2F0ED` | `--surface` |
| `--accent-foreground` | `#1A1A1A` | `--foreground` |
| `--destructive` | `#C4534A` | `--error` |
| `--destructive-foreground` | `#FFFFFF` | White text on destructive buttons |
| `--input` | `#E5E0DB` | `--border` |
| `--ring` | `#B8956A` | `--accent-primary` (focus rings) |

#### Dark Mode

| ShadCN Token | Value | Maps To |
|---|---|---|
| `--card` | `#282420` | `--surface` |
| `--card-foreground` | `#F5F2EE` | `--foreground` |
| `--popover` | `#1C1917` | `--background` |
| `--popover-foreground` | `#F5F2EE` | `--foreground` |
| `--primary` | `#C9A678` | `--accent-primary` |
| `--primary-foreground` | `#1C1917` | Dark text on primary buttons |
| `--secondary` | `#282420` | `--surface` |
| `--secondary-foreground` | `#F5F2EE` | `--foreground` |
| `--muted-foreground` | `#9C9590` | `--muted` |
| `--accent` | `#282420` | `--surface` |
| `--accent-foreground` | `#F5F2EE` | `--foreground` |
| `--destructive` | `#D4645C` | `--error` |
| `--destructive-foreground` | `#1C1917` | Dark text on destructive buttons |
| `--input` | `#3D3835` | `--border` |
| `--ring` | `#C9A678` | `--accent-primary` (focus rings) |

#### Sidebar Tokens

| Token | Light | Dark |
|---|---|---|
| `--sidebar` | `#F2F0ED` | `#282420` |
| `--sidebar-foreground` | `#1A1A1A` | `#F5F2EE` |
| `--sidebar-primary` | `#B8956A` | `#C9A678` |
| `--sidebar-primary-foreground` | `#FFFFFF` | `#1C1917` |
| `--sidebar-accent` | `#F2F0ED` | `#282420` |
| `--sidebar-accent-foreground` | `#1A1A1A` | `#F5F2EE` |
| `--sidebar-border` | `#E5E0DB` | `#3D3835` |
| `--sidebar-ring` | `#B8956A` | `#C9A678` |

### CSS Implementation

```css
@import 'tailwindcss';
@import 'tw-animate-css';

@custom-variant dark (&:is(.dark *));

:root {
  /* Surfaced Art — Light Mode */
  --background: #FAFAF8;
  --surface: #F2F0ED;
  --foreground: #1A1A1A;
  --muted: #6B6460;
  --border: #E5E0DB;
  --accent-primary: #B8956A;
  --accent-primary-hover: #A6845C;
  --accent-secondary: #C4775A;
  --accent-secondary-hover: #B5694D;
  --error: #C4534A;
  --success: #6B8F6B;
  --warning: #D4A054;
  --overlay: rgba(26, 26, 26, 0.6);

  /* ShadCN alias tokens */
  --card: #F2F0ED;
  --card-foreground: #1A1A1A;
  --popover: #FAFAF8;
  --popover-foreground: #1A1A1A;
  --primary: #B8956A;
  --primary-foreground: #FFFFFF;
  --secondary: #F2F0ED;
  --secondary-foreground: #1A1A1A;
  --muted-foreground: #6B6460;
  --accent: #F2F0ED;
  --accent-foreground: #1A1A1A;
  --destructive: #C4534A;
  --destructive-foreground: #FFFFFF;
  --input: #E5E0DB;
  --ring: #B8956A;
  --radius: 5px;

  /* Sidebar */
  --sidebar: #F2F0ED;
  --sidebar-foreground: #1A1A1A;
  --sidebar-primary: #B8956A;
  --sidebar-primary-foreground: #FFFFFF;
  --sidebar-accent: #F2F0ED;
  --sidebar-accent-foreground: #1A1A1A;
  --sidebar-border: #E5E0DB;
  --sidebar-ring: #B8956A;

  /* Font stacks */
  --active-font-sans: var(--font-dm-sans), 'DM Sans', sans-serif;
  --active-font-serif: var(--font-dm-serif), 'DM Serif Display', serif;
}

.dark {
  --background: #1C1917;
  --surface: #282420;
  --foreground: #F5F2EE;
  --muted: #9C9590;
  --border: #3D3835;
  --accent-primary: #C9A678;
  --accent-primary-hover: #D4B48A;
  --accent-secondary: #D08A6E;
  --accent-secondary-hover: #DC9A7E;
  --error: #D4645C;
  --success: #7FA37F;
  --warning: #E0B060;
  --overlay: rgba(0, 0, 0, 0.7);

  --card: #282420;
  --card-foreground: #F5F2EE;
  --popover: #1C1917;
  --popover-foreground: #F5F2EE;
  --primary: #C9A678;
  --primary-foreground: #1C1917;
  --secondary: #282420;
  --secondary-foreground: #F5F2EE;
  --muted-foreground: #9C9590;
  --accent: #282420;
  --accent-foreground: #F5F2EE;
  --destructive: #D4645C;
  --destructive-foreground: #1C1917;
  --input: #3D3835;
  --ring: #C9A678;

  --sidebar: #282420;
  --sidebar-foreground: #F5F2EE;
  --sidebar-primary: #C9A678;
  --sidebar-primary-foreground: #1C1917;
  --sidebar-accent: #282420;
  --sidebar-accent-foreground: #F5F2EE;
  --sidebar-border: #3D3835;
  --sidebar-ring: #C9A678;

  --active-font-sans: var(--font-dm-sans), 'DM Sans', sans-serif;
  --active-font-serif: var(--font-dm-serif), 'DM Serif Display', serif;
}

@theme inline {
  --font-sans: var(--active-font-sans);
  --font-serif: var(--active-font-serif);
  --font-mono: 'Geist Mono', 'Geist Mono Fallback';
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-surface: var(--surface);
  --color-muted-text: var(--muted);
  --color-accent-primary: var(--accent-primary);
  --color-accent-primary-hover: var(--accent-primary-hover);
  --color-accent-secondary: var(--accent-secondary);
  --color-accent-secondary-hover: var(--accent-secondary-hover);
  --color-error: var(--error);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--surface);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 2px);
  --radius-md: var(--radius);
  --radius-lg: calc(var(--radius) + 2px);
  --radius-xl: calc(var(--radius) + 6px);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
    scroll-behavior: smooth;
  }
}

/* Skeleton pulse animation */
@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.animate-skeleton {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}
```

---

## 3. Typography

**Philosophy**: Serif headings + sans body is a classic editorial pairing. The heading font carries the brand voice (tradition, craftsmanship). The body font stays neutral and highly legible so it never competes with artwork. The scale is large and dramatic — editorial magazine, not SaaS dashboard.

### Font Families

| Role | Font | Source | Weights |
|---|---|---|---|
| Headings (h1–h4), wordmark, display text | **DM Serif Display** | Google Fonts | 400 only |
| Body text, navigation, buttons, metadata | **DM Sans** | Google Fonts | 400, 500, 600 |

**Production note**: Only load these two fonts. The `design_system/` explorer loads additional fonts for exploration; those are not used in production.

### Font Loading (Next.js)

```typescript
import { DM_Sans, DM_Serif_Display } from 'next/font/google';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-dm-sans',
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-dm-serif',
});
```

### Type Scale

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

Only three weights across the entire site:

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

## 4. Logo and Wordmark

### Current State: Text-Only Wordmark

No icon or symbol logo exists yet. The site uses a text-only wordmark. A designed logo will be swapped in later (single component swap).

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
| Size (navigation) | 20px |
| Size (hero/footer) | 32px |

### Favicon

Placeholder: Monogram "S" in DM Serif Display. Sizes needed: 16x16, 32x32, 180x180 (Apple touch icon).

### Implementation

```html
<span class="font-serif text-foreground text-xl tracking-[0.1em] uppercase">
  SURFACED ART
</span>
```

---

## 5. Imagery and Art Presentation

These rules govern how artwork — the core content of the platform — is displayed. The platform should frame the art, never compete with it.

### Image Corner Radius

| Context | Radius Token | Value | Rationale |
|---|---|---|---|
| Artwork images (listings, gallery views) | `--radius-sm` | 3px | Subtle softening. Gallery-appropriate. |
| UI elements (cards, buttons, inputs) | `--radius-md` | 5px | Consistent across all interactive elements. |
| Profile photos (artist headshots) | — | 50% / full circle | Distinguishes people from artwork. |

### Listing Grid Aspect Ratio

| Context | Aspect Ratio | Treatment |
|---|---|---|
| Grid views (browse, category, artist profile) | **1:1 (square)** | Object-fit: cover with center crop. Clean, uniform grid across all 9 categories. |
| Detail page (listing detail) | **Natural** | Full uncropped image at original proportions. |

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
| **Browse / featured contexts** (homepage, category pages, search results) | **Info overlay on hover**: title, artist name, and price slide up from the bottom of the image with a subtle gradient backdrop `bg-gradient-to-t from-[rgba(26,26,26,0.7)] to-transparent` | Gives buyers useful information without requiring click-through. |
| **Artist profile contexts** (available work grid, archive section) | **Slight scale up (~2–3%)** `group-hover:scale-[1.02]` with smooth transition | Info is already visible on the page alongside the grid. Hover communicates "this is clickable." |

**Transition**: 250–300ms ease-in-out for both behaviors.

### Sold Artwork Indicator

Sold pieces remain visible on artist profiles as body of work / credibility.

| Element | Specification |
|---|---|
| **Red dot** | Small circle (8–10px), positioned in the upper-right corner of the image. Color: `--error` (#C4534A). Gallery convention. |
| **"Sold" text label** | Small text in `--muted` color, positioned near the bottom-right or below the image. Font: body-small (14px), weight 500. |
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

## 6. Border Radius Tokens

Structured token system with a 5px base. All radius values are derived from the base.

| Token | Value | Computed | Usage |
|---|---|---|---|
| `--radius` | `5px` | 5px | Base value (not used directly in classes) |
| `--radius-sm` | `calc(var(--radius) - 2px)` | 3px | Artwork images, subtle rounding |
| `--radius-md` | `var(--radius)` | 5px | Cards, buttons, inputs, UI elements |
| `--radius-lg` | `calc(var(--radius) + 2px)` | 7px | Larger containers, dialogs |
| `--radius-xl` | `calc(var(--radius) + 6px)` | 11px | Large feature cards, modals |

Tailwind classes: `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`.

---

## 7. Spacing and Layout

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
| Content max width | **1280px** | Standard for all content areas |
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

## 8. Component Specifications

All components use the structured radius tokens, the warm color palette, and smooth 250–300ms transitions.

### Buttons

#### Variants

| Variant | Background | Border | Text Color | Usage |
|---|---|---|---|---|
| **Primary** | `--accent-primary` | None | White (#FFFFFF) | Main CTAs, confirmations |
| **Secondary (Outline)** | Transparent | 1px solid `--accent-primary` | `--accent-primary` | Secondary actions, "View profile" |
| **Tertiary** | Transparent | 1px solid `--border` | `--muted` | Tertiary actions, less prominent |
| **Ghost** | Transparent | None | `--foreground` | Inline actions, icon buttons |
| **Link** | Transparent | None | `--accent-primary` | Text-style links styled as buttons |
| **Destructive** | `--error` | None | White (#FFFFFF) | Dangerous actions, delete |

#### Sizes

| Size | Padding | Usage |
|---|---|---|
| Large | `px-6 py-3` (24px x 12px) | Primary CTAs, hero sections |
| Medium | `px-5 py-2.5` (20px x 10px) | Standard buttons |
| Small | `px-4 py-2` (16px x 8px) | Compact contexts, inline |

#### Common Properties

| Property | Value |
|---|---|
| Font | DM Sans, 500 weight |
| Text case | Sentence case |
| Border radius | `rounded-md` (5px) |
| Transition | 250ms ease-in-out |
| Loading state | Disabled, opacity 50%, spinner in `--accent-primary` |

```html
<!-- Primary button -->
<button class="bg-accent-primary text-white font-medium rounded-md px-6 py-3
  hover:bg-accent-primary-hover transition-colors duration-250">
  Join the waitlist
</button>

<!-- Secondary button -->
<button class="border border-accent-primary text-accent-primary font-medium rounded-md px-6 py-3
  hover:bg-accent-primary/10 transition-colors duration-250">
  View profile
</button>

<!-- Tertiary button -->
<button class="border border-border text-muted-text font-medium rounded-md px-5 py-2.5
  hover:border-accent-primary transition-colors duration-250">
  Filter
</button>
```

### Cards

| Property | Value |
|---|---|
| Background | `--surface` (#F2F0ED) |
| Border | None by default |
| Shadow | None by default |
| Border radius | `rounded-md` (5px) |
| Hover | Subtle shadow (`hover:shadow-md`) + slight lift (`hover:-translate-y-0.5`) |
| Transition | 250ms ease-in-out |

```html
<!-- Listing card -->
<div class="bg-surface rounded-md overflow-hidden
  hover:shadow-md hover:-translate-y-0.5 transition-all duration-250">
  <img class="w-full aspect-square object-cover rounded-sm" />
  <div class="p-4">
    <h3 class="font-serif text-foreground">Title</h3>
    <p class="text-muted-text text-sm">Artist Name · Medium</p>
    <p class="text-foreground font-semibold text-sm mt-1">$125.00</p>
  </div>
</div>
```

ShadCN Card sub-components available: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`.

### Form Inputs

| Property | Value |
|---|---|
| Border | 1px solid `--border` (#E5E0DB) |
| Border radius | `rounded-md` (5px) |
| Background | Transparent (shows page background) |
| Text | `--foreground` |
| Placeholder text | `--muted` |
| Focus state | Border color changes to `--accent-primary` (#B8956A) |
| Error state | Border color changes to `--error` (#C4534A) |
| Transition | 200ms ease-in-out on border-color |
| Padding | 10px 14px |

### Badges / Pills

| Property | Value |
|---|---|
| Shape | `rounded` (4px) |
| Fill | `--surface` or `--border` at low opacity |
| Text | `--muted`, body-small (14px), weight 500 |
| Size | Small and understated |
| Color coding | None — all badges use the same neutral style. Artwork provides the color. |

```html
<span class="bg-surface text-muted-text text-sm font-medium px-3 py-1 rounded">
  Ceramics
</span>
```

### Navigation

| State | Treatment |
|---|---|
| Default | `--foreground` text, DM Sans weight 500 |
| Hover | Text color shifts to `--accent-primary` |
| Active page | `--accent-primary` text + 2px underline in `--accent-primary` |
| Transition | 200ms ease-in-out |

### Modals / Dialogs

| Property | Value |
|---|---|
| Backdrop | `--overlay` (rgba(26, 26, 26, 0.6)), no blur |
| Background | `--background` |
| Border radius | `rounded-lg` (7px) |
| Shadow | Large shadow for elevation (`shadow-xl`) |
| Animation | Fade in, 200ms ease-out |
| Max width | 560px for standard dialogs, full-width minus padding for image lightboxes |

### Loading / Skeleton States

| Property | Value |
|---|---|
| Style | Skeleton blocks matching content layout shapes |
| Color | `--border` (#E5E0DB) as base |
| Animation | Opacity pulse between 0.4 and 1.0, 1.5s ease-in-out infinite (`animate-skeleton` class) |
| Spinners (button loading) | Simple circular spinner in `--accent-primary`, 20px |

---

## 9. Motion and Interaction

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

## 10. Artist Profile Customization

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

Artist accent color stored on the `artist_profiles` table (`custom_accent_color` field, nullable, hex string). Applied via CSS custom property override scoped to the profile page. Constrained to a curated set of warm, muted hues — not a free color picker.

---

## 11. Page-Specific Design Notes

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

## 12. Implementation Reference

### Tech Stack

- **Tailwind CSS v4** with `@theme inline` in `globals.css` (not v3 `tailwind.config.js`)
- **ShadCN/ui** component library (Radix UI based)
- **Class utilities**: `clsx` + `tailwind-merge` via `cn()` helper
- **Icons**: `lucide-react`
- **Animations**: `tw-animate-css`

### ShadCN Components Available

57 components in the design system reference (`design_system/components/ui/`). Key components for early phases:

- **Layout**: Card, Separator, Aspect Ratio, Scroll Area
- **Forms**: Button, Input, Textarea, Select, Checkbox, Radio Group, Label, Form, Field
- **Feedback**: Alert, Badge, Skeleton, Spinner, Progress, Toast/Sonner
- **Overlay**: Dialog, Sheet, Drawer, Popover, Tooltip, Hover Card
- **Navigation**: Navigation Menu, Breadcrumb, Tabs, Pagination, Sidebar
- **Data**: Table, Accordion, Collapsible

### Quality Checklist

- [ ] No `@vercel/*` imports
- [ ] Colors reference CSS custom properties (never hardcoded hex in components)
- [ ] Monetary values stored as cents
- [ ] UUIDs used for primary keys
- [ ] Only DM Serif Display and DM Sans loaded (no extra fonts)
- [ ] Radius uses token classes (`rounded-sm`, `rounded-md`, etc.), not hardcoded values
- [ ] Transitions use 200–300ms ease-in-out
- [ ] Dark mode tokens defined for all custom properties

---

*This document is the definitive design system for Surfaced Art. All visual implementation decisions derive from this guide. The `design_system/` folder serves as an interactive reference implementation. Update this document when brand decisions change.*

*Version 2.0 | February 2026 | Surfaced Art*
