# Surfaced Art -- Design System Audit

**Date**: 2026-02-23
**Branch**: `dev`
**Auditor**: Claude Code (automated audit)

---

## Executive Summary

The codebase has a clean, custom design token system (`--gallery-*`) that is well-tokenized relative to its scope. However, it is built *outside* the ShadCN variable architecture, has dark mode explicitly removed, has no provisions for artist-level theme scoping, and ShadCN itself has not been installed yet. The current token naming and architecture need to be restructured before real components are built, or every future component will be built on the wrong foundation.

**Key findings:**
- ShadCN/ui is not installed at all (no `components.json`, no `cn()` utility, no ShadCN dependencies)
- Dark mode is explicitly disabled with no `.dark` class rule or `prefers-color-scheme` media query
- All tokens use a custom `--gallery-*` namespace that is completely disconnected from ShadCN's expected variable names
- No scoping mechanism exists for artist-level theme overrides
- 7 hardcoded hex values in `:root` that will need swapping when the brand guide arrives
- 1 hardcoded color literal (`bg-black/30`) in component code

---

## 1. Dark Mode Architecture

### 1.1 Dark mode explicitly removed

**File**: `apps/web/src/app/globals.css`
**Lines**: 46

```css
/* Remove dark mode for now -- the gallery aesthetic is light */
```

**Issue**: Dark mode has been intentionally excluded. There is no `.dark` selector rule, no `@media (prefers-color-scheme: dark)` block, and no dark-mode variable overrides anywhere in the codebase. This means:
- No dark palette values are defined
- Tailwind's `dark:` variant will have no effect
- There is no mechanism to toggle themes

**Fix**: Add a `.dark` rule block (even if values are identical to light for now) that redefines all design tokens. This keeps the architecture in place so that when dark mode values are designed, it is a value change, not a structural refactor.

```css
/* globals.css -- add after :root block */
.dark {
  --background: ...;
  --foreground: ...;
  --muted: ...;
  /* etc. -- can initially mirror light values as placeholders */
}
```

### 1.2 No `darkMode` configuration

**File**: N/A (no `tailwind.config.*` exists; Tailwind v4 is used via `@tailwindcss/postcss`)

**Issue**: Tailwind v4 uses automatic dark mode detection via the `.dark` class on `<html>`. The `<html>` element in `layout.tsx` (line 32) has no mechanism to receive a `dark` class:

```tsx
<html lang="en">
```

**Fix**: When implementing dark mode, the `<html>` element needs to support a `class` attribute that can be toggled (e.g., via `next-themes` or a custom context). No immediate code change is needed, but this is the integration point. The architecture should anticipate this.

### 1.3 Body styles use light-only custom properties

**File**: `apps/web/src/app/globals.css`
**Lines**: 48-54

```css
body {
  background: var(--gallery-bg);
  color: var(--gallery-foreground);
  font-family: var(--font-sans);
  ...
}
```

**Issue**: These consume `--gallery-bg` and `--gallery-foreground` which are only defined under `:root` (light). Once the token system is restructured to use ShadCN's names (see Section 2), these should reference `--background` and `--foreground`, which will automatically respond to `.dark` overrides.

**Fix**: Change to `var(--background)` and `var(--foreground)` (after ShadCN alignment).

---

## 2. ShadCN Alignment

### 2.1 ShadCN is not installed

**Files affected**: `apps/web/package.json`, project root

**Issue**: ShadCN/ui has not been installed. The following are all missing:
- `components.json` (ShadCN configuration file)
- `@/lib/utils.ts` with the `cn()` utility function
- Dependencies: `clsx`, `tailwind-merge`, `class-variance-authority`
- Any ShadCN component files under `src/components/ui/`

**Fix**: Initialize ShadCN with `npx shadcn@latest init` (selecting the appropriate style and color scheme). This will:
1. Create `components.json`
2. Create `src/lib/utils.ts` with `cn()`
3. Install `clsx`, `tailwind-merge`, `class-variance-authority` as dependencies
4. Set up the ShadCN CSS variable system in `globals.css`

### 2.2 Custom `--gallery-*` namespace bypasses ShadCN's variable system

**File**: `apps/web/src/app/globals.css`
**Lines**: 11-26

```css
:root {
  --gallery-bg: #FAFAF8;
  --gallery-surface: #F2F0ED;
  --gallery-foreground: #1A1A1A;
  --gallery-muted: #6B6460;
  --gallery-border: #E5E0DB;
  --gallery-accent: #B8956A;
  --gallery-accent-warm: #C4775A;
}
```

**Issue**: ShadCN expects its components to consume a specific set of CSS custom properties: `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--destructive-foreground`, `--border`, `--input`, `--ring`, `--radius`, `--sidebar-*`, and `--chart-*`.

The current `--gallery-*` tokens are a parallel system. When ShadCN components are added (Button, Dialog, Card, etc.), they will not pick up the gallery palette because they look for `--primary`, `--border`, etc. -- not `--gallery-accent`, `--gallery-border`.

**Fix**: Map the gallery palette INTO ShadCN's expected variable names. Keep the gallery values as the source-of-truth hex values, but assign them to ShadCN's variable names. Note: ShadCN v2 (Tailwind v4 compatible) uses oklch or HSL values, not hex -- the format will need to match what the ShadCN init generates.

Example restructured approach:

```css
:root {
  /* === Source palette (gallery aesthetic) === */
  /* These are the "what" -- swap when brand guide arrives */

  /* === ShadCN semantic tokens === */
  /* These map gallery values into ShadCN's expected names */
  --background: 60 10% 98%;       /* maps to --gallery-bg (#FAFAF8) */
  --foreground: 0 0% 10%;         /* maps to --gallery-foreground (#1A1A1A) */
  --muted: 30 5% 94%;             /* maps to --gallery-surface (#F2F0ED) */
  --muted-foreground: 15 5% 40%;  /* maps to --gallery-muted (#6B6460) */
  --border: 25 12% 88%;           /* maps to --gallery-border (#E5E0DB) */
  --primary: 30 30% 57%;          /* maps to --gallery-accent (#B8956A) */
  --accent: 15 40% 56%;           /* maps to --gallery-accent-warm (#C4775A) */
  /* ...fill in remaining ShadCN tokens... */
}
```

### 2.3 Tailwind `@theme inline` block uses custom namespace

**File**: `apps/web/src/app/globals.css`
**Lines**: 28-44

```css
@theme inline {
  --color-gallery-bg: var(--gallery-bg);
  --color-gallery-surface: var(--gallery-surface);
  --color-gallery-foreground: var(--gallery-foreground);
  --color-gallery-muted: var(--gallery-muted);
  --color-gallery-border: var(--gallery-border);
  --color-gallery-accent: var(--gallery-accent);
  --color-gallery-accent-warm: var(--gallery-accent-warm);

  --font-serif: ...;
  --font-sans: ...;
}
```

**Issue**: The `@theme inline` block registers `--color-gallery-*` as Tailwind utility colors (producing classes like `bg-gallery-bg`, `text-gallery-muted`, etc.). These are custom names that no ShadCN component will ever use. ShadCN components use classes like `bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`, `border-border`, etc.

Every component currently written uses the `gallery-*` Tailwind classes (e.g., `bg-gallery-bg`, `text-gallery-foreground`). These will all need to be migrated to ShadCN-standard class names.

**Fix**: Replace the `@theme inline` block to register ShadCN-compatible color utilities. In Tailwind v4 with ShadCN, the theme typically registers:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  /* etc. */
}
```

### 2.4 All component classes use `gallery-*` instead of ShadCN names

Every component file uses the custom `gallery-*` color utilities. These all need migration:

**File**: `apps/web/src/app/page.tsx` (lines 5, 8, 11)
```tsx
text-gallery-foreground    // should be: text-foreground
text-gallery-muted         // should be: text-muted-foreground
text-gallery-muted/50      // should be: text-muted-foreground/50
```

**File**: `apps/web/src/components/Header.tsx` (lines 14, 21, 29)
```tsx
bg-gallery-bg/95           // should be: bg-background/95
text-gallery-foreground    // should be: text-foreground
text-gallery-muted         // should be: text-muted-foreground
```

**File**: `apps/web/src/components/Navigation.tsx` (lines 13, 21)
```tsx
border-gallery-border      // should be: border-border
text-gallery-muted         // should be: text-muted-foreground
text-gallery-foreground    // should be: text-foreground
```

**File**: `apps/web/src/components/Footer.tsx` (lines 12, 17, 20, 29, 37, 48, 55, 63, 73, 78, 83, 88, 97, 98)
```tsx
border-gallery-border      // should be: border-border
bg-gallery-bg              // should be: bg-background
text-gallery-foreground    // should be: text-foreground
text-gallery-muted         // should be: text-muted-foreground
text-gallery-muted/60      // should be: text-muted-foreground/60
```

**File**: `apps/web/src/components/MobileNav.tsx` (lines 54, 84, 99, 126)
```tsx
text-gallery-foreground    // should be: text-foreground
bg-gallery-bg              // should be: bg-background
text-gallery-muted         // should be: text-muted-foreground
border-gallery-border/50   // should be: border-border/50
```

**Total occurrences**: ~40 `gallery-*` class usages across 5 component files that all need renaming.

### 2.5 No `cn()` utility for class merging

**Issue**: No `cn()` utility exists anywhere in the codebase. ShadCN components rely on `cn()` (which combines `clsx` and `tailwind-merge`) for conditional and overridable class names. Without it, component variants and theme overrides cannot be cleanly composed.

**Fix**: ShadCN init will create `src/lib/utils.ts`:

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## 3. Artist Theme Scoping

### 3.1 No scoping mechanism for per-artist theme overrides

**Files affected**: `apps/web/src/app/globals.css`, all component files

**Issue**: The current architecture defines all tokens at the `:root` level only. There is no mechanism for a scoped wrapper element (e.g., `<div data-artist-theme="...">` or `<div class="artist-theme" style="--primary: ...">`) to override token values for a subsection of the page.

For artist profile customization, the design token system needs to support CSS custom property inheritance -- where a wrapper element redefines token values, and all child components automatically pick up the new values.

**Fix**: This works naturally with CSS custom properties *if* the tokens are consumed via `var()` references (which they are) and the token names match what components use. The key requirements:

1. All components must consume tokens by their ShadCN variable names (e.g., `var(--primary)`, not hardcoded hex values)
2. A future `ArtistThemeProvider` wrapper can set inline styles to override specific tokens:

```tsx
// Future pattern -- no code needed now, but architecture must support it
<div style={{
  '--primary': artistTheme.primaryColor,
  '--accent': artistTheme.accentColor,
  '--background': artistTheme.backgroundColor,
} as React.CSSProperties}>
  {/* All children automatically use the artist's palette */}
  <ArtistProfile />
</div>
```

3. The current `gallery-*` custom namespace would block this because ShadCN components would not respond to `--gallery-accent` overrides -- they respond to `--primary` overrides. This makes the ShadCN alignment (Section 2) a prerequisite for artist theme scoping.

### 3.2 Font stacks are hardcoded with no override path

**File**: `apps/web/src/app/globals.css`
**Lines**: 42-43

```css
--font-serif: var(--font-dm-serif-display, Georgia), Georgia, 'Times New Roman', serif;
--font-sans: var(--font-dm-sans, 'Helvetica Neue'), 'Helvetica Neue', Helvetica, Arial, sans-serif;
```

**Issue**: The font tokens are only defined at the `@theme inline` level. While CSS custom properties do inherit, the current architecture ties the font variables directly to specific Google Fonts loaded in `layout.tsx`. An artist theme that wants to use a different heading font would need a mechanism to:

1. Load the additional font (e.g., via `next/font/google` dynamic import or a `<link>` tag)
2. Override `--font-serif` on the scoped wrapper element

**Fix**: No immediate code change needed, but document the override path. The font token architecture already supports scoped overrides via CSS custom property inheritance. The font *loading* strategy for artist fonts will need a separate design (dynamic font loading is a separate concern from the token architecture).

### 3.3 Global element selectors prevent scoped overrides

**File**: `apps/web/src/app/globals.css`
**Lines**: 48-59, 62-76, 79-82

```css
body {
  background: var(--gallery-bg);
  color: var(--gallery-foreground);
  font-family: var(--font-sans);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-serif);
}

a:focus-visible {
  outline: 2px solid var(--gallery-accent);
}

::selection {
  background-color: var(--gallery-accent);
  color: var(--gallery-bg);
}
```

**Issue**: These global element selectors set styles on `body`, all headings, all links, and all text selections. While they consume CSS custom properties (good), they target global elements rather than being scoped to a layout container. An artist theme wrapper that redefines `--primary` would affect the selection color and focus ring inside the artist section, but the heading font rule targets ALL `h1`-`h6` elements globally. This is fine for now (headings should use serif everywhere) but should be noted: if artist themes need different heading fonts, the heading rule will need to be scoped rather than global.

**Fix**: No change needed now, but when artist themes are implemented, consider moving element-level typography defaults into a `.site-typography` class that can be overridden by `.artist-typography` at the wrapper level.

---

## 4. Hardcoded Values

### 4.1 Hardcoded hex color values in `:root`

**File**: `apps/web/src/app/globals.css`
**Lines**: 13-25

```css
--gallery-bg: #FAFAF8;
--gallery-surface: #F2F0ED;
--gallery-foreground: #1A1A1A;
--gallery-muted: #6B6460;
--gallery-border: #E5E0DB;
--gallery-accent: #B8956A;
--gallery-accent-warm: #C4775A;
```

**Issue**: These 7 hex values are the entire color palette and are all tentative placeholders pending the brand guide. They are properly tokenized (consumed via variables, not scattered through components), so swapping them is a single-location change. However, note that ShadCN typically uses HSL or oklch format for better composability with Tailwind's opacity modifier syntax.

**Fix**: When the brand guide arrives, update these 7 values. When aligning with ShadCN, convert to HSL or oklch format. The single-location definition is good -- no fix needed to the tokenization architecture itself.

### 4.2 Hardcoded `bg-black/30` overlay color

**File**: `apps/web/src/components/MobileNav.tsx`
**Line**: 76

```tsx
className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
```

**Issue**: `bg-black/30` is a hardcoded color literal that bypasses the token system entirely. In dark mode, a `bg-black/30` overlay on a dark background would be nearly invisible. This should use a semantic token.

**Fix**: Replace with a token-based overlay color. ShadCN does not define an overlay token by default, but a common pattern is:

```tsx
className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm"
```

Or define a dedicated `--overlay` token if multiple overlay use cases arise.

### 4.3 Hardcoded `shadow-xl` without dark mode consideration

**File**: `apps/web/src/components/MobileNav.tsx`
**Line**: 84

```tsx
className={`fixed top-0 right-0 z-50 h-full w-72 bg-gallery-bg shadow-xl ...`}
```

**Issue**: `shadow-xl` uses Tailwind's default shadow color, which is based on black with opacity. In dark mode, box shadows on dark backgrounds are nearly invisible and a different visual treatment (e.g., elevated background, border glow, or inverted shadow) is typically needed.

**Fix**: No token change needed now, but flag for dark mode implementation. Consider using `shadow-xl dark:shadow-none dark:border` or a custom shadow token when dark mode is added.

### 4.4 Hardcoded spacing and layout values

**File**: `apps/web/src/app/layout.tsx`
**Lines**: 38

```tsx
<div className="mx-auto max-w-7xl px-6 py-8 md:py-12">
```

**File**: `apps/web/src/components/Header.tsx` (line 16), `apps/web/src/components/Footer.tsx` (line 13), `apps/web/src/components/Navigation.tsx` (line 15)

```tsx
// All use: mx-auto max-w-7xl px-6
```

**Issue**: The container pattern `mx-auto max-w-7xl px-6` is repeated in 4 locations. This is not a token issue per se, but it is a repeated design decision that should be centralized. If the max width or horizontal padding changes, it must be updated in every file.

**Fix**: Extract into a reusable container component or a Tailwind utility class via `@layer`:

```css
@layer components {
  .container-gallery {
    @apply mx-auto max-w-7xl px-6;
  }
}
```

Or, better yet, use a `<Container>` component that ShadCN patterns encourage.

### 4.5 Hardcoded font references in layout.tsx

**File**: `apps/web/src/app/layout.tsx`
**Lines**: 7-18

```tsx
const dmSerifDisplay = DM_Serif_Display({
  variable: '--font-dm-serif-display',
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  display: 'swap',
})
```

**Issue**: The specific Google Fonts (DM Serif Display, DM Sans) are tentative placeholders. The architecture correctly uses CSS custom property injection via `next/font`, which is good. However, the variable names (`--font-dm-serif-display`, `--font-dm-sans`) are font-specific rather than role-based. If the brand guide specifies different fonts, both the import and the variable names need updating across `layout.tsx` and `globals.css`.

**Fix**: Consider using role-based variable names like `--font-heading` and `--font-body` as the consumed tokens, with the font-specific variables mapping into them. This decouples the font choice from the consumption site:

```css
/* globals.css */
--font-heading: var(--font-dm-serif-display, Georgia), Georgia, serif;
--font-body: var(--font-dm-sans, 'Helvetica Neue'), 'Helvetica Neue', sans-serif;
```

This way, swapping fonts only requires changing the `next/font` import and updating the `var(--font-dm-...)` references in one place.

---

## 5. General Cleanup

### 5.1 No `components.json` for ShadCN initialization

**Issue**: There is no `components.json` file in the project. This file is ShadCN's configuration that specifies:
- Component directory path
- Utility library path
- Tailwind CSS path
- Base color scheme
- Style (default vs. new-york)
- Whether to use CSS variables

Without it, `npx shadcn add <component>` will not work.

**Fix**: Run `npx shadcn@latest init` to generate the config. Choose settings that align with the project:
- Style: "new-york" (cleaner, more gallery-appropriate)
- Base color: custom (will be overridden by gallery palette)
- CSS variables: yes
- Component directory: `src/components/ui`
- Utility path: `src/lib/utils`

### 5.2 No CSS reset/normalize layer awareness

**File**: `apps/web/src/app/globals.css`

**Issue**: The CSS file starts with `@import "tailwindcss"` (which includes Preflight/normalize), then defines custom properties and element styles. There are no `@layer base`, `@layer components`, or `@layer utilities` declarations. In Tailwind v4, the layering is handled automatically, but when ShadCN is installed, its base styles and component styles will need to coexist with the custom gallery styles. Proper layer ordering prevents specificity conflicts.

**Fix**: When restructuring for ShadCN, use Tailwind v4's layer system:

```css
@import "tailwindcss";

@layer base {
  :root {
    --background: ...;
    --foreground: ...;
  }
  .dark {
    --background: ...;
    --foreground: ...;
  }
  body { ... }
}
```

### 5.3 Link styles are global with no scoping

**File**: `apps/web/src/app/globals.css`
**Lines**: 62-76

```css
a {
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 1px;
}
```

**Issue**: These global link styles affect every `<a>` element, including ShadCN Button components rendered as links, navigation links that should not underline, etc. ShadCN components manage their own hover/focus states, so global link styles can conflict.

**Fix**: Either scope these to a `.prose` or content area class, or remove them and let individual components handle their own link styling (which is the ShadCN pattern). At minimum, add specificity guards:

```css
/* Only apply to links in content areas, not in component UI */
.prose a { ... }
```

### 5.4 The `--gallery-surface` token is defined but never consumed

**File**: `apps/web/src/app/globals.css`
**Line**: 14

```css
--gallery-surface: #F2F0ED;
```

And the corresponding Tailwind registration on line 31:

```css
--color-gallery-surface: var(--gallery-surface);
```

**Issue**: The `gallery-surface` token is defined and registered but never used in any component. A search for `gallery-surface` across all component files returns zero hits in JSX classNames.

**Fix**: Either remove the unused token (simpler), or note it as reserved for Card/Panel backgrounds when those components are built. When mapping to ShadCN, this naturally becomes `--card` or `--muted`.

### 5.5 No `--radius` token for consistent border radius

**Issue**: ShadCN uses a `--radius` CSS custom property to maintain consistent border radii across all components (Button, Card, Dialog, etc.). No such token exists in the current system. The only border radius in the codebase is a hardcoded `border-radius: 2px` on the focus ring (line 75 of `globals.css`).

**Fix**: Add a `--radius` token when initializing ShadCN:

```css
:root {
  --radius: 0.5rem; /* or whatever the brand guide specifies */
}
```

### 5.6 No `--ring` token for focus states

**File**: `apps/web/src/app/globals.css`
**Line**: 73

```css
a:focus-visible {
  outline: 2px solid var(--gallery-accent);
}
```

**Issue**: ShadCN uses a `--ring` CSS custom property for focus ring colors across all interactive components. The current code hardcodes the focus ring to `--gallery-accent`. When ShadCN components are added, they will look for `--ring` and not find it.

**Fix**: Add `--ring` token and use it for all focus states:

```css
:root {
  --ring: var(--primary); /* or a dedicated focus color */
}
```

---

## Summary of Required Changes

### Priority 1: ShadCN Foundation (do first)

| Action | Files |
|--------|-------|
| Install ShadCN (`npx shadcn@latest init`) | `apps/web/` |
| Restructure `globals.css` to use ShadCN variable names | `apps/web/src/app/globals.css` |
| Add `.dark` class block with placeholder dark values | `apps/web/src/app/globals.css` |
| Add `--radius`, `--ring`, and remaining ShadCN tokens | `apps/web/src/app/globals.css` |

### Priority 2: Component Migration (do after ShadCN init)

| Action | Files |
|--------|-------|
| Replace all `gallery-*` class names with ShadCN equivalents | All 5 component files + `page.tsx` |
| Replace `bg-black/30` with token-based overlay | `MobileNav.tsx` |
| Add `cn()` utility to class composition | All component files |
| Extract repeated container pattern | `layout.tsx`, `Header.tsx`, `Footer.tsx`, `Navigation.tsx` |

### Priority 3: Architecture Prep (do alongside or after)

| Action | Files |
|--------|-------|
| Scope global link styles to content areas | `globals.css` |
| Consider role-based font token names | `globals.css`, `layout.tsx` |
| Document artist theme override pattern | New doc or CLAUDE.md |
| Remove or repurpose `--gallery-surface` | `globals.css` |

### Class Name Migration Reference

| Current (`gallery-*`) | ShadCN equivalent |
|----------------------|-------------------|
| `bg-gallery-bg` | `bg-background` |
| `bg-gallery-surface` | `bg-muted` or `bg-card` |
| `text-gallery-foreground` | `text-foreground` |
| `text-gallery-muted` | `text-muted-foreground` |
| `border-gallery-border` | `border-border` |
| `text-gallery-accent` / `bg-gallery-accent` | `text-primary` / `bg-primary` |
| `text-gallery-accent-warm` / `bg-gallery-accent-warm` | `text-accent` / `bg-accent` |

### Files Inventory

| File | Findings |
|------|----------|
| `apps/web/src/app/globals.css` | 10 findings (dark mode, ShadCN alignment, hardcoded values, missing tokens) |
| `apps/web/src/app/layout.tsx` | 3 findings (no dark class support, hardcoded fonts, repeated container) |
| `apps/web/src/app/page.tsx` | 1 finding (gallery-* class names) |
| `apps/web/src/components/Header.tsx` | 2 findings (gallery-* class names, repeated container) |
| `apps/web/src/components/Footer.tsx` | 2 findings (gallery-* class names, repeated container) |
| `apps/web/src/components/Navigation.tsx` | 2 findings (gallery-* class names, repeated container) |
| `apps/web/src/components/MobileNav.tsx` | 3 findings (gallery-* class names, hardcoded bg-black, shadow-xl) |
| `apps/web/src/components/index.ts` | 0 findings (clean barrel export) |
| `apps/web/src/lib/categories.ts` | 0 findings (no design code) |
| `apps/web/package.json` | 1 finding (missing ShadCN dependencies) |
| `apps/web/postcss.config.mjs` | 0 findings (clean) |
| `apps/web/next.config.ts` | 0 findings (clean) |
| `apps/web/tsconfig.json` | 0 findings (clean) |
| `apps/web/components.json` | MISSING (needs creation via ShadCN init) |
