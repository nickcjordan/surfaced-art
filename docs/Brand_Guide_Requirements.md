# Surfaced Art -- Brand Guide Requirements

**Purpose**: This document captures every visual and brand decision the front-end implementation depends on. The COO fills in decisions; the CTO uses them to implement the design system.

**How to use this document**: For each item, you will see the current tentative value (what is implemented today as a placeholder), why the decision matters, and a clear question for you to answer. Fill in the "Your Decision" field. If you are unsure, write "keep tentative" and we will revisit.

**Changeability ratings**:
- **Easy** -- A single variable or token swap. Can be changed in minutes at any time.
- **Medium** -- Requires updating multiple components or rethinking a pattern. A few hours of work.
- **Hard** -- Structural decision baked into layout, component architecture, or content strategy. Changing it later means rebuilding sections of the site.

---

## 1. Color Palette

Color is the single most impactful brand decision. Every surface, every piece of text, every button, and every border on the site derives its color from these tokens. The palette must feel like a gallery -- warm, considered, and intentional -- not like a SaaS product or a generic e-commerce site.

### 1.1 Light Mode Colors

These are the primary palette. Light mode is the default experience for all visitors.

#### Background
The main page background color. Every page starts here.

- **Current tentative value**: `#FAFAF8` (warm off-white, like gallery walls)
- **Why it matters**: This is the most visible color on the site. It sets the entire tone. Pure white (#FFFFFF) feels clinical and digital. The warm off-white feels like paper or plaster.
- **Changeability**: Easy

> **Your Decision**: What should the main background color be? Should it stay warm off-white, go pure white, go slightly warmer/creamier, or something else entirely?
>
> Answer: _______________

#### Surface / Card
A slightly darker shade used for cards, panels, and elevated sections that sit on top of the background.

- **Current tentative value**: `#F2F0ED` (warm light gray, like linen)
- **Why it matters**: Creates subtle visual layers without harsh contrast. Used for listing cards, artist profile sections, form containers, etc.
- **Changeability**: Easy

> **Your Decision**: What color should cards and panels be? Should they be a noticeably different shade from the background, or nearly invisible? Should they use a border instead of a color shift to distinguish themselves?
>
> Answer: _______________

#### Foreground / Primary Text
The main text color used for headings, body copy, and all primary content.

- **Current tentative value**: `#1A1A1A` (near-black, softer than pure black)
- **Why it matters**: Pure black (#000000) on a warm background creates harsh contrast that feels digital. Near-black feels more like ink on paper.
- **Changeability**: Easy

> **Your Decision**: What should the primary text color be? Should it stay near-black, go to pure black, or have a warm/brown tint?
>
> Answer: _______________

#### Muted Text
Used for secondary information: dates, captions, metadata, helper text, and anything that should be readable but not compete with primary content.

- **Current tentative value**: `#6B6460` (warm medium gray with brown undertone)
- **Why it matters**: Creates a clear visual hierarchy between primary and secondary text. The warm undertone matches the gallery palette instead of defaulting to a cold gray.
- **Changeability**: Easy

> **Your Decision**: What should secondary/muted text look like? Should it stay as a warm gray, or be cooler/more neutral?
>
> Answer: _______________

#### Borders and Dividers
Used for lines, card borders, input field outlines, section dividers, and table borders.

- **Current tentative value**: `#E5E0DB` (warm light gray, barely visible)
- **Why it matters**: Borders are everywhere. If they are too strong, the site feels boxy and segmented. If too faint, the structure is unclear. The current value is intentionally subtle.
- **Changeability**: Easy

> **Your Decision**: How visible should borders and dividers be? Very subtle (current), clearly visible, or should some sections use space instead of lines?
>
> Answer: _______________

#### Primary Accent
The main brand color used for primary buttons, active links, selected states, focus rings, and key interactive elements. This is the most "branded" color on the site.

- **Current tentative value**: `#B8956A` (muted gold)
- **Why it matters**: This is the color people will associate with Surfaced Art. It appears on CTAs, navigation highlights, and everywhere the user needs to focus. Muted gold was chosen to evoke brass, warmth, and understated luxury -- not to scream "click me" like a SaaS blue.
- **Changeability**: Easy (the value), Medium (if you change the hue family entirely, we need to re-evaluate contrast ratios and dark mode pairings)

> **Your Decision**: What is the primary brand/accent color? Keep the muted gold? Switch to something else? Provide a specific hex code if you have one, or describe the feeling (e.g., "deep forest green," "warm terracotta," "dusty rose").
>
> Answer: _______________

#### Secondary / Warm Accent
A complementary accent color used sparingly for secondary actions, hover states, category pills, and visual variety where using only one accent would feel monotonous.

- **Current tentative value**: `#C4775A` (terracotta)
- **Why it matters**: Having a single accent color makes the site feel flat. The terracotta provides warmth and variety while staying in the same earthy family. Used for things like "Sold" badges, secondary buttons, or hover state variations.
- **Changeability**: Easy

> **Your Decision**: What should the secondary accent color be? Should it complement or contrast the primary accent? Should there even be a secondary accent, or should the site be more monochromatic?
>
> Answer: _______________

#### Error / Destructive
Used for error messages, form validation failures, delete confirmations, and anything that signals a problem or irreversible action.

- **Current tentative value**: None defined yet
- **Why it matters**: Errors need to be immediately visible and unambiguous. Most sites use red. The challenge is picking a red that does not clash with the warm palette.
- **Changeability**: Easy

> **Your Decision**: What color should error states use? A muted/warm red to stay in the palette, or a more standard bright red for maximum clarity? (Provide a hex code or describe the tone.)
>
> Answer: _______________

#### Success
Used for success messages, completion confirmations, and positive feedback (e.g., "Profile saved," "Listing published").

- **Current tentative value**: None defined yet
- **Why it matters**: Needs to read as positive without being garish. Green is the convention but default greens often feel out of place in warm palettes.
- **Changeability**: Easy

> **Your Decision**: What color should success states use? A muted/earthy green? An olive tone? Or a different approach entirely (e.g., using the primary accent for success instead of green)?
>
> Answer: _______________

#### Warning
Used for warnings and caution states (e.g., "This action cannot be undone," "Your listing has been inactive for 30 days").

- **Current tentative value**: None defined yet
- **Why it matters**: Should be noticeable but not alarming. Conventionally amber/yellow, but needs to harmonize with the overall palette.
- **Changeability**: Easy

> **Your Decision**: What color should warning states use? A warm amber? A deep gold (be careful of conflict with primary accent if using muted gold)? Something else?
>
> Answer: _______________

### 1.2 Dark Mode Colors

Dark mode will be offered as a usability option (not the default). These colors must work together as a complete palette, not just "the light mode colors inverted."

#### Dark Background

- **Current tentative value**: Not yet defined
- **Why it matters**: The main canvas in dark mode. Pure black (#000000) feels like a void. Dark charcoal feels more refined.
- **Changeability**: Easy

> **Your Decision**: What should the dark mode background be? Options to consider:
> - Warm dark (dark brown/charcoal, like `#1C1917` or `#1A1814`) -- feels like a dimly lit gallery
> - Cool dark (blue-black, like `#0F172A`) -- feels more techy/modern
> - Neutral dark (pure dark gray, like `#171717`) -- neutral, no temperature bias
>
> Answer: _______________

#### Dark Surface / Card

- **Current tentative value**: Not yet defined
- **Why it matters**: Cards and panels need to be subtly lighter than the background to create layering, the same way they are subtly darker in light mode.
- **Changeability**: Easy

> **Your Decision**: Should dark mode cards be a slightly lighter shade of the background? How much contrast between background and surface?
>
> Answer: _______________

#### Dark Foreground / Primary Text

- **Current tentative value**: Not yet defined
- **Why it matters**: Pure white text on dark backgrounds can feel harsh. Slightly warm off-white is softer on the eyes.
- **Changeability**: Easy

> **Your Decision**: What should the primary text color be in dark mode? Pure white, warm off-white, or a specific shade?
>
> Answer: _______________

#### Dark Muted Text

- **Current tentative value**: Not yet defined
- **Changeability**: Easy

> **Your Decision**: What should secondary text look like in dark mode? A warm medium gray? Cool gray?
>
> Answer: _______________

#### Dark Borders

- **Current tentative value**: Not yet defined
- **Changeability**: Easy

> **Your Decision**: How should borders appear in dark mode? Should they be lighter lines on dark backgrounds, or should you prefer using subtle background shifts instead of borders?
>
> Answer: _______________

#### Dark Mode Accents (Primary and Secondary)

- **Current tentative value**: Not yet defined
- **Why it matters**: Accent colors often need to shift slightly in dark mode for contrast and readability. A muted gold on a dark background may need to be slightly brighter or more saturated to remain visible.
- **Changeability**: Easy

> **Your Decision**: Should the primary and secondary accent colors stay the same in dark mode, or shift? If they shift, in what direction -- brighter, more saturated, or a different tone?
>
> Answer: _______________

### 1.3 Palette Feeling

Beyond specific hex values, these questions capture the intent behind the palette.

> **Your Decision**: Pick 3-5 words that describe how the color palette should feel:
> (Examples: warm, earthy, minimal, luxurious, muted, natural, restrained, rich, organic, soft, refined)
>
> Answer: _______________

> **Your Decision**: Should the palette explicitly avoid any color families?
> (Current philosophy: "No blue. No default Tailwind." Are there other colors that feel wrong for this brand -- neon, purple, pink, etc.?)
>
> Answer: _______________

> **Your Decision**: How saturated should the overall palette be? Options:
> - Very muted / desaturated (almost monochromatic, like Aesop)
> - Moderately muted (warm but identifiable hues, current approach)
> - Rich and saturated (bold, confident colors)
>
> Answer: _______________

---

## 2. Typography

Typography is where "gallery" versus "marketplace" is won or lost. The right type choices make the site feel like a curated experience. The wrong ones make it feel like Shopify.

### 2.1 Heading Font Family

Used for all headings (h1 through h6), the site name, and display text.

- **Current tentative value**: DM Serif Display (a free Google Font, classic serif with ink-trap details)
- **Why it matters**: The heading font carries the brand voice. Serif conveys tradition, craftsmanship, and editorial quality. Sans-serif headings would feel more modern/tech. Display fonts add personality but can feel gimmicky.
- **Changeability**: Easy (the specific font), Medium (if switching from serif to sans-serif or vice versa, because it changes the entire feel)

> **Your Decision**: What should the heading font be? Provide one of:
> - A specific font name (e.g., "Playfair Display," "Cormorant Garamond," "EB Garamond")
> - A Google Fonts link or specimen page
> - A purchased/licensed font file (OTF/WOFF2)
> - Or a description of the feeling: "elegant serif," "modern geometric sans," "hand-drawn," etc.
>
> Answer: _______________

### 2.2 Body Font Family

Used for all paragraph text, descriptions, metadata, navigation, buttons, and form labels.

- **Current tentative value**: DM Sans (a clean geometric sans-serif, pairs well with DM Serif Display)
- **Why it matters**: Body text is 90% of what people read. It must be highly legible at small sizes, feel neutral enough to not compete with artwork, and match the brand tone.
- **Changeability**: Easy

> **Your Decision**: What should the body font be? Same options as above. Note: serif body + serif headings can feel heavy. Sans body + serif headings is a classic editorial pairing.
>
> Answer: _______________

### 2.3 Font Scale / Hierarchy

The specific sizes used for each heading level, body text, and small text. These define how information is visually prioritized on every page.

- **Current tentative value**: Not formally defined. Using Tailwind defaults currently.
- **Why it matters**: Gallery aesthetics tend to use larger, more dramatic heading sizes with generous spacing. SaaS aesthetics tend to use smaller, more compact type. The scale also affects how much content fits on screen before scrolling.
- **Changeability**: Easy (individual sizes), Medium (if the overall scale philosophy changes significantly)

> **Your Decision**: For each level, what size and weight feels right? You do not need exact pixel values -- describe the feeling.
>
> | Level | Used for | Describe the feeling |
> |-------|----------|---------------------|
> | H1 | Page titles, hero text | _____________ |
> | H2 | Section headings | _____________ |
> | H3 | Subsection headings, card titles | _____________ |
> | H4 | Minor headings | _____________ |
> | Body (large) | Artist statements, featured text | _____________ |
> | Body (default) | Descriptions, paragraphs | _____________ |
> | Body (small) | Metadata, captions, prices | _____________ |
> | Caption / Fine print | Copyright, disclaimers | _____________ |
>
> Overall question: Should the type feel large and dramatic (editorial/magazine), moderate and balanced, or compact and dense?
>
> Answer: _______________

### 2.4 Font Weights

Which font weights are used and where. Too many weights create visual noise. Too few make the hierarchy unclear.

- **Current tentative value**: Heading font at weight 400 (DM Serif Display only comes in 400). Body font uses the full range available from DM Sans.
- **Why it matters**: Weight contrast (light body + bold heading) creates hierarchy. Consistent weight usage makes the site feel cohesive.
- **Changeability**: Easy

> **Your Decision**: What weights should be used?
> - Headings: light (300), regular (400), medium (500), semibold (600), or bold (700)?
> - Body text: regular (400), medium (500), or a mix?
> - Emphasis (bold text in paragraphs): semibold (600) or bold (700)?
> - Navigation/buttons: regular (400), medium (500), or semibold (600)?
>
> Answer: _______________

### 2.5 Letter Spacing

The space between individual characters. Affects readability and brand feel.

- **Current tentative value**: Not explicitly defined (using font defaults)
- **Why it matters**: Tight letter spacing feels editorial and premium. Loose letter spacing feels airy and modern. All-caps text almost always needs increased letter spacing to be readable.
- **Changeability**: Easy

> **Your Decision**: Any specific letter spacing preferences?
> - Headings: tighter than default, default, or wider?
> - All-caps text (if used anywhere): how much extra spacing?
> - Body text: usually best left at default. Any preference?
>
> Answer: _______________

### 2.6 Line Height

The vertical space between lines of text. Affects readability and density.

- **Current tentative value**: Not explicitly defined (using browser/Tailwind defaults)
- **Why it matters**: Tight line height feels dense and editorial. Generous line height feels open and airy. Body text needs more breathing room than headings.
- **Changeability**: Easy

> **Your Decision**: Should line heights feel:
> - Tight and editorial (headings close together, compact paragraphs)
> - Open and spacious (generous breathing room, gallery-like)
> - Standard/balanced (conventional web typography)
>
> Answer: _______________

---

## 3. Logo and Wordmark

The logo appears in the header, footer, favicon, social share images, and anywhere the brand is represented visually.

### 3.1 Logo Files

- **Current tentative value**: No logo exists. The site currently renders "Surfaced Art" in the heading font as plain text.
- **Why it matters**: A text-only wordmark is clean and gallery-appropriate but may lack distinctiveness. An icon/symbol provides recognition at small sizes (favicon, social media).
- **Changeability**: Easy (swapping a logo file), Hard (if the logo requires structural layout changes in the header)

> **Your Decision**: Please provide the following (or indicate that text-only is the plan):
>
> - Logo SVG file (preferred format): _______________
> - Does the logo include text, an icon/symbol, or both? _______________
> - If both: is there a text-only version and an icon-only version for different contexts? _______________

### 3.2 Wordmark Treatment

How the brand name appears in the site header and other text-based contexts.

- **Current tentative value**: "Surfaced Art" rendered in the heading serif font, regular weight
- **Why it matters**: Capitalization, spacing, and styling of the brand name affect recognition. "SURFACED ART" reads differently than "Surfaced Art" or "surfaced art."
- **Changeability**: Easy

> **Your Decision**: How should the brand name be written?
> - "Surfaced Art" (title case)
> - "SURFACED ART" (all caps)
> - "surfaced art" (lowercase)
> - Something else (e.g., "SURFACED art")
>
> Answer: _______________

> **Your Decision**: Should the wordmark use the heading font, body font, or a completely different font?
>
> Answer: _______________

> **Your Decision**: Any special typographic treatment? (e.g., extra letter spacing, a specific weight, a decorative element between words)
>
> Answer: _______________

### 3.3 Minimum Size and Clear Space

- **Current tentative value**: Not defined
- **Why it matters**: If the logo is too small, it becomes illegible. Clear space ensures nothing crowds the logo.
- **Changeability**: Easy

> **Your Decision**: If you have a designed logo, what are the minimum size and clear space rules? (If text-only, this can be skipped.)
>
> Answer: _______________

### 3.4 Logo in Dark Mode

- **Current tentative value**: Not defined
- **Why it matters**: If the logo is dark colored, it will be invisible on a dark background. Dark mode typically needs a light or inverted logo variant.
- **Changeability**: Easy

> **Your Decision**: How should the logo appear on dark backgrounds?
> - Inverted (white/light version)
> - Same logo but with a different color
> - Stays the same (if the logo works on both)
>
> Provide a dark-mode logo file if applicable: _______________

### 3.5 Favicon

- **Current tentative value**: Default Next.js favicon
- **Why it matters**: The favicon appears in browser tabs, bookmarks, and mobile home screens. It is one of the most-seen brand touchpoints.
- **Changeability**: Easy

> **Your Decision**: What should the favicon be?
> - A letter/monogram (e.g., "S" or "SA")
> - An icon from the logo
> - Something else
>
> Provide file if available (16x16, 32x32, and 180x180 sizes preferred): _______________

---

## 4. Imagery and Art Presentation

These decisions directly affect how artwork is displayed. For a platform that exists to showcase handmade art, getting this right is critical.

### 4.1 Image Corner Radius

Whether artwork images have rounded corners or sharp corners.

- **Current tentative value**: Not defined (defaulting to no radius, sharp corners)
- **Why it matters**: Sharp corners feel like framed gallery prints. Rounded corners feel more modern and app-like. This applies to every image on the site -- listing cards, profile photos, cover images, and gallery views.
- **Changeability**: Easy

> **Your Decision**: Should artwork images have:
> - Sharp corners (0 radius) -- gallery / print aesthetic
> - Very slight rounding (2-4px) -- softened but still structured
> - Moderate rounding (8-12px) -- modern app feel
> - Large rounding (16px+) -- very soft, Pinterest-like
>
> Answer: _______________

### 4.2 Listing Grid Aspect Ratio

How artwork images are cropped in grid/card views (the browse page, the "available work" section on artist profiles).

- **Current tentative value**: Not defined
- **Why it matters**: This is one of the hardest decisions to change later because it affects grid layout, card components, image processing, and how artists photograph their work. Square crops are neat but cut off rectangular pieces. Natural aspect ratios look authentic but create uneven grids. This decision ripples through every page with a listing grid.
- **Changeability**: Hard (changing aspect ratio strategy means rethinking the grid layout and potentially re-processing images)

> **Your Decision**: How should listing images appear in grid views?
> - **Square crop (1:1)** -- Clean, uniform grid. Works like Instagram. Some artwork gets cropped.
> - **Portrait crop (3:4 or 4:5)** -- Favors vertical artwork (common in paintings, prints). Still uniform grid.
> - **Natural aspect ratio (no crop)** -- Each image keeps its original proportions. Grid becomes a masonry/Pinterest layout. Authentic but less tidy.
> - **Mixed approach** -- e.g., square in card grids, natural on detail pages
>
> Answer: _______________

### 4.3 Image Border / Shadow Treatment

Whether artwork images have borders, shadows, or are presented flat.

- **Current tentative value**: Not defined
- **Why it matters**: Borders can make images feel framed. Shadows create depth. No treatment (flat) feels clean and lets the art speak. The choice affects how premium the site feels.
- **Changeability**: Easy

> **Your Decision**: How should artwork images be presented?
> - No border, no shadow (flat, clean, art speaks for itself)
> - Subtle shadow (slight depth, image floats above the surface)
> - Thin border (framed feeling, like a mat around a print)
> - Border + shadow combination
>
> Answer: _______________

### 4.4 Hover Behavior on Images

What happens when a user hovers over a listing image in a grid.

- **Current tentative value**: Not defined
- **Why it matters**: Hover states communicate interactivity and add polish. But they should not distract from the artwork itself.
- **Changeability**: Easy

> **Your Decision**: What should happen on hover?
> - Slight scale up (image grows ~2-3%, feels alive)
> - Opacity shift (image brightens or dims slightly)
> - Shadow appears or deepens
> - Overlay with info (title, price slide up over the image)
> - No hover effect (static, let the art be still)
> - Some combination of the above
>
> Answer: _______________

### 4.5 "Sold" Overlay Style

How sold/unavailable pieces are visually marked in grids and on the listing detail page. Sold pieces still appear on artist profiles as archive/body of work.

- **Current tentative value**: Not defined
- **Why it matters**: Sold pieces build credibility (proof of sales) but must clearly communicate they are not available. The treatment should not make the artwork ugly or hard to see.
- **Changeability**: Easy (the visual treatment), Medium (if the strategy for showing/hiding sold work changes)

> **Your Decision**: How should sold artwork be marked?
> - Semi-transparent overlay with "SOLD" text
> - Small "Sold" badge/pill in a corner
> - Red dot (gallery convention for sold work)
> - Grayscale/desaturated image
> - Subtle opacity reduction with a badge
> - Something else?
>
> Answer: _______________

### 4.6 Profile Photo Shape

The shape of the artist's profile photo as seen on their profile page and on listing detail pages.

- **Current tentative value**: Not defined
- **Why it matters**: Circles are the social media convention (Instagram, Twitter). Rounded squares feel more unique. Sharp squares feel editorial/magazine. The shape affects how the photo integrates with surrounding layout.
- **Changeability**: Easy

> **Your Decision**: What shape should artist profile photos be?
> - Circle
> - Rounded square (with what radius?)
> - Sharp square
> - Something else
>
> Answer: _______________

### 4.7 Cover Image Aspect Ratio and Treatment

The large banner/cover image at the top of an artist's profile page.

- **Current tentative value**: Not defined
- **Why it matters**: The cover image is the first thing visitors see on an artist's profile. Its aspect ratio determines how much vertical space it takes up and how cinematic it feels. Too tall and the artist's content is pushed below the fold. Too short and it feels like a banner ad.
- **Changeability**: Medium (affects layout structure and image upload guidance for artists)

> **Your Decision**: What aspect ratio should the cover image be?
> - Cinematic / wide (3:1 or wider) -- dramatic, does not push content down
> - Standard banner (2:1 or 16:9) -- balanced
> - Tall (4:3) -- gives the image more presence, pushes content lower
>
> Answer: _______________

> **Your Decision**: Should the cover image have any overlay treatment?
> - Slight gradient at the bottom (so text/profile photo overlapping the bottom edge is readable)
> - No overlay (clean, rely on image quality)
> - Full-width dark gradient
>
> Answer: _______________

---

## 5. Component Style Direction

These decisions apply to UI components that are reused across the entire site: buttons, cards, inputs, badges, navigation elements, modals, and loading states.

### 5.1 Button Style

Buttons are the primary interactive elements -- "Add to Cart," "Contact Artist," "Join Waitlist," etc.

- **Current tentative value**: Not defined
- **Why it matters**: Button shape and style are one of the most recognizable brand elements. They appear on every page and in every interaction.
- **Changeability**: Easy (individual properties), Medium (if the overall style philosophy changes after many components are built)

> **Your Decision**: Describe the ideal button:
>
> Corner radius:
> - Sharp (0) -- editorial, architectural
> - Slightly rounded (4-6px) -- softened but structured
> - Rounded (8-12px) -- modern, friendly
> - Fully rounded / pill (999px) -- playful, app-like
>
> Answer: _______________
>
> Primary button fill:
> - Solid fill with primary accent color
> - Outlined (border only, transparent fill)
> - Solid fill with a different color (specify)
>
> Answer: _______________
>
> Secondary button:
> - Outlined version of the primary
> - Ghost (no border, no fill, text only)
> - Muted fill (surface color background)
>
> Answer: _______________
>
> Text style on buttons:
> - ALL CAPS with letter spacing
> - Title Case
> - Sentence case
> - lowercase
>
> Answer: _______________
>
> Hover behavior:
> - Darken/lighten the fill
> - Add or deepen shadow
> - Subtle scale
> - Underline the text
>
> Answer: _______________

### 5.2 Card Style

Cards are the container for listing items in grids, artist cards on the homepage, and other grouped content.

- **Current tentative value**: Not defined
- **Why it matters**: Cards appear dozens of times per page on browse and artist profile pages. Their style sets the rhythm of the site.
- **Changeability**: Easy (borders/shadows), Medium (if the card structure or layout changes)

> **Your Decision**: Describe the ideal card:
> - Border: visible border, no border, or border on hover only?
> - Shadow: no shadow, subtle shadow, or shadow on hover?
> - Background: same as page background (transparent) or elevated (surface color)?
> - Corner radius: sharp, slight, moderate, or rounded?
> - Hover: what changes on hover? (lift, shadow, border color, scale?)
>
> Answer: _______________

### 5.3 Input / Form Field Style

Text inputs, textareas, dropdowns, and other form elements. Used in waitlist signup, future artist onboarding, and search.

- **Current tentative value**: Not defined
- **Why it matters**: Forms are where users interact directly with the platform. The style should feel considered, not like default browser inputs.
- **Changeability**: Easy

> **Your Decision**: Describe the ideal form field:
> - Border: full border (boxed), bottom-border only (underline style), or no border (filled)?
> - Corner radius: matching the button radius, or different?
> - Background: transparent, or subtle fill?
> - Focus state: what happens when a field is active? (accent-colored border, glow, underline, etc.)
>
> Answer: _______________

### 5.4 Badge / Pill Style

Used for category labels (e.g., "Ceramics," "Painting"), status indicators ("Sold," "Documented Work"), and tags.

- **Current tentative value**: Not defined
- **Why it matters**: Badges appear frequently alongside artwork and artist information. They must be readable but not overshadow the content they label.
- **Changeability**: Easy

> **Your Decision**: Describe the ideal badge/pill:
> - Shape: fully rounded pill, slightly rounded rectangle, or sharp rectangle?
> - Fill: solid color, outlined, or subtle/muted fill?
> - Size: small and understated or visible and prominent?
> - Color: should different categories have different colors, or all use the same neutral style?
>
> Answer: _______________

### 5.5 Navigation Style

How the main site navigation (categories, links) communicates the active/current page and hover states.

- **Current tentative value**: Text-based navigation. Hover shows underline. No active state styling defined.
- **Why it matters**: Navigation is on every page. The active state tells the user where they are. The hover state tells them what is clickable.
- **Changeability**: Easy

> **Your Decision**: How should navigation indicate state?
>
> Active page:
> - Underline (what thickness and color?)
> - Bold text
> - Background highlight
> - Accent color text
> - Some combination
>
> Answer: _______________
>
> Hover state:
> - Underline appears
> - Text color changes
> - Background appears
> - Opacity change
>
> Answer: _______________

### 5.6 Modal / Dialog Style

Overlays that appear for confirmations, image lightboxes, and focused interactions.

- **Current tentative value**: Not defined
- **Why it matters**: Modals interrupt the user flow. They should feel native to the brand, not like a system dialog.
- **Changeability**: Easy

> **Your Decision**: Describe the ideal modal:
> - Backdrop: how dark? Blurred or clear?
> - Corner radius: matching cards, or different?
> - Animation: how should it appear? (fade, slide up, scale in?)
>
> Answer: _______________

### 5.7 Loading / Skeleton State Style

What users see while content is loading. Skeleton screens show the shape of content before data arrives.

- **Current tentative value**: Not defined
- **Why it matters**: Loading states are seen frequently. A well-designed skeleton feels intentional. A poorly designed one feels broken.
- **Changeability**: Easy

> **Your Decision**: What should loading states look like?
> - Skeleton blocks (gray shapes matching content layout, with pulse animation)
> - Simple spinner
> - Branded loading animation
> - Shimmer effect (gradient sweep across skeleton shapes)
> - Fade-in (content just appears when ready, no skeleton)
>
> Answer: _______________

---

## 6. Spacing and Layout

These decisions determine how dense or airy the site feels and how content is arranged.

### 6.1 Overall Density

- **Current tentative value**: Leaning toward airy/spacious (gallery aesthetic)
- **Why it matters**: Galleries are spacious -- white space lets artwork breathe. Marketplaces are dense -- more products visible per scroll. This platform should feel more like a gallery.
- **Changeability**: Medium (spacing is applied throughout every component and page)

> **Your Decision**: How should the site feel overall?
> - Very spacious (lots of white space, artwork breathes, fewer items per scroll -- like a gallery wall)
> - Moderately spacious (balanced, content is accessible but not crowded)
> - Compact (maximize content visibility per screen, efficient browsing)
>
> Answer: _______________

### 6.2 Grid Gap Sizes

The space between cards in listing grids and content grids.

- **Current tentative value**: Not formally defined
- **Why it matters**: Tight gaps make items feel connected. Wide gaps make each piece feel individual and important (like artwork on a gallery wall with breathing room).
- **Changeability**: Easy

> **Your Decision**: How much space between grid items?
> - Tight (8-12px) -- items feel like a collection
> - Moderate (16-20px) -- balanced
> - Wide (24-32px) -- each piece stands alone
> - Very wide (40px+) -- true gallery spacing
>
> Answer: _______________

### 6.3 Section Spacing

The vertical space between major page sections (e.g., between the hero and the "Featured Artists" section on the homepage, or between the "Available Work" and "Archive" sections on an artist profile).

- **Current tentative value**: Not formally defined
- **Why it matters**: Generous section spacing creates a sense of editorial pacing. Tight spacing feels like a continuous feed.
- **Changeability**: Easy

> **Your Decision**: How much vertical space between page sections?
> - Moderate (48-64px)
> - Generous (80-96px)
> - Very generous (120px+) -- strong editorial pacing, like page breaks
>
> Answer: _______________

### 6.4 Content Max Width

The maximum width of the main content area on large screens.

- **Current tentative value**: `max-w-7xl` (1280px)
- **Why it matters**: Narrow max width focuses attention and feels editorial (like a magazine column). Wide max width fills the screen and shows more content.
- **Changeability**: Easy (the value), Medium (if it changes from narrow to full-width or vice versa, layouts need adjustment)

> **Your Decision**: How wide should the main content area be?
> - Narrow (~960px) -- very focused, editorial
> - Standard (~1280px, current) -- balanced
> - Wide (~1440px) -- fills more of the screen
> - Full-width for some sections (hero, cover images) with narrower content areas?
>
> Answer: _______________

### 6.5 Padding Philosophy

How much horizontal padding the site has from the edges of the viewport, especially on mobile.

- **Current tentative value**: `px-6` (24px) on mobile and desktop
- **Why it matters**: More padding feels more premium (content does not touch the edges). Less padding maximizes visible content, especially on mobile.
- **Changeability**: Easy

> **Your Decision**: How much horizontal padding?
> - Mobile: tight (16px), moderate (24px, current), generous (32px)?
> - Desktop: moderate (24px, current), generous (32-48px), or handled by max-width alone?
>
> Answer: _______________

---

## 7. Motion and Interaction

Motion adds polish and communicates state changes. Too much feels distracting. Too little feels static.

### 7.1 Hover Transition Speed and Easing

The speed and feel of hover effects on buttons, cards, images, and links.

- **Current tentative value**: Not defined
- **Why it matters**: Fast transitions feel snappy and responsive. Slow transitions feel smooth and luxurious. The easing curve (how the transition accelerates/decelerates) affects the feel.
- **Changeability**: Easy

> **Your Decision**: How should hover transitions feel?
> - Quick and snappy (~150ms, ease-out)
> - Smooth and measured (~250-300ms, ease-in-out)
> - Slow and luxurious (~400ms+, ease)
> - No preference / default
>
> Answer: _______________

### 7.2 Page Transition Approach

What happens when navigating between pages (e.g., from homepage to an artist profile).

- **Current tentative value**: No page transitions (standard browser navigation via Next.js)
- **Why it matters**: Page transitions add a sense of flow and make the site feel like an app rather than a website. But they add complexity and can feel slow if not implemented well.
- **Changeability**: Medium (adding transitions later is possible but requires a layout wrapper component)

> **Your Decision**: Should page transitions exist?
> - No transitions (standard page loads, clean and fast)
> - Subtle fade between pages
> - Slide transitions
> - Crossfade with loading state
>
> Answer: _______________

### 7.3 Loading Animation Style

How loading indicators appear while data is being fetched or actions are processing.

- **Current tentative value**: Not defined
- **Why it matters**: Should match the brand. A generic spinner feels placeholder. A branded loader feels polished.
- **Changeability**: Easy

> **Your Decision**: What style for loading indicators?
> - Simple circular spinner (in accent color)
> - Pulsing dots
> - Branded animation (describe or provide)
> - Progress bar
> - Prefer skeleton screens over spinners where possible
>
> Answer: _______________

### 7.4 Scroll Behavior

How the site handles scrolling -- smooth scrolling for anchor links, parallax effects, etc.

- **Current tentative value**: Default browser scrolling
- **Why it matters**: Smooth scrolling for anchor links feels polished. Parallax effects on hero sections can feel dramatic but also gimmicky. Keep it simple for a gallery.
- **Changeability**: Easy

> **Your Decision**: Any scroll behavior preferences?
> - Default browser scrolling (clean, no tricks)
> - Smooth scroll for anchor/internal links
> - Parallax on hero images
> - Fade-in/reveal animations as content scrolls into view
>
> Answer: _______________

---

## 8. Tone of Voice (Visual)

These are not about copywriting -- they are about the visual language and mood of the site.

### 8.1 Overall Visual Mood

- **Current tentative value**: Warm, elevated, editorial, gallery-quality

> **Your Decision**: Pick 3-5 adjectives that describe the visual mood of the site:
> (Examples: warm, cool, minimal, maximal, editorial, organic, refined, raw, luxurious, approachable, austere, playful, serious, handmade, architectural, soft, bold)
>
> Answer: _______________

### 8.2 Reference Brands / Websites to Emulate

Specific sites or brands whose visual style captures some aspect of what Surfaced Art should feel like.

- **Current tentative value**: Aesop (warm minimalism), Soho House (curated luxury), high-end gallery websites
- **Why it matters**: Reference sites give the CTO concrete examples to study and match. A single screenshot is worth a thousand words of description.
- **Changeability**: N/A (reference only)

> **Your Decision**: List 3-5 websites or brands whose visual style should influence Surfaced Art. For each, say what specifically you like about their design:
>
> 1. _____________ -- what you like: _____________
> 2. _____________ -- what you like: _____________
> 3. _____________ -- what you like: _____________
> 4. _____________ -- what you like: _____________
> 5. _____________ -- what you like: _____________

### 8.3 Reference Brands / Websites to AVOID

Sites or brands whose visual style is the opposite of what Surfaced Art should be.

- **Current tentative value**: Etsy (cluttered marketplace), generic SaaS (blue/white/boxy), default Shopify themes
- **Why it matters**: Anti-references are just as useful as positive references. They prevent the CTO from making unconscious choices that pull the design in the wrong direction.
- **Changeability**: N/A (reference only)

> **Your Decision**: List 3-5 websites or brands whose visual style Surfaced Art should NOT look like. For each, say what specifically to avoid:
>
> 1. _____________ -- what to avoid: _____________
> 2. _____________ -- what to avoid: _____________
> 3. _____________ -- what to avoid: _____________
> 4. _____________ -- what to avoid: _____________
> 5. _____________ -- what to avoid: _____________

### 8.4 What "Gallery Quality" Means Visually

This is the core brand promise. Every design decision should be tested against this definition.

> **Your Decision**: In your own words, what does "gallery quality" mean for this site? What makes the difference between a website that feels like walking into a gallery and one that feels like browsing a marketplace?
>
> Answer: _______________

---

## 9. Artist Profile Customization (Future)

In the future, artists may be able to customize certain aspects of their profile page. These decisions determine what they can change and what stays locked to the platform brand.

### 9.1 Customizable Aspects

> **Your Decision**: Which of the following should artists be able to customize on their profile page? For each, indicate Yes, No, or Maybe:
>
> | Aspect | Allow customization? | Notes |
> |--------|---------------------|-------|
> | Accent color (e.g., their "brand color") | ___ | |
> | Background color | ___ | |
> | Heading font | ___ | |
> | Body font | ___ | |
> | Profile layout/arrangement | ___ | |
> | Card style for their listings | ___ | |
> | Cover image (already planned) | ___ | |
> | Custom CSS or theming | ___ | |

### 9.2 Locked Aspects

> **Your Decision**: Which aspects should always remain consistent with the platform brand, regardless of artist preferences?
> (e.g., navigation, footer, overall page structure, typography scale, etc.)
>
> Answer: _______________

### 9.3 Customization Philosophy

> **Your Decision**: How much creative freedom should artists have?
> - Minimal (choose an accent color only; everything else is the platform brand)
> - Moderate (choose accent color + a background tone + cover image)
> - Extensive (full color palette customization, font choices)
> - Open (artists can make their profile look however they want)
>
> Which approach best balances artist expression with platform brand consistency?
>
> Answer: _______________

---

## 10. Dark Mode Philosophy

Dark mode is planned as a usability option (user toggleable). These decisions shape how it will feel.

### 10.1 Inversion vs. Distinct Palette

- **Current tentative value**: Not yet defined (dark mode is deferred but architecturally planned for)
- **Why it matters**: A simple inversion (swap light and dark) often looks bad because colors that work on light backgrounds look wrong on dark ones. A distinct palette designed for dark mode looks better but requires more design work.
- **Changeability**: Easy (the colors themselves), Medium (the structural approach if it was built as simple inversion and needs to be redesigned)

> **Your Decision**: Should dark mode be:
> - A simple inversion (light becomes dark, dark becomes light, accents stay the same)
> - A designed palette (hand-picked dark-mode-specific colors for every token)
> - A warm-shifted palette (same hues but shifted to work on dark backgrounds)
>
> Answer: _______________

### 10.2 Dark Mode Temperature

> **Your Decision**: Should dark mode feel:
> - Warm dark (dark browns, charcoals, like a dimly lit gallery or a leather-bound book)
> - Cool dark (blue-blacks, cool grays, like a modern app)
> - Neutral dark (pure dark grays, no temperature bias)
>
> Answer: _______________

### 10.3 Accent Colors in Dark Mode

> **Your Decision**: Should accent colors (primary gold, secondary terracotta) change between light and dark mode?
> - Stay the same (brand consistency)
> - Shift slightly (brighter/more saturated for contrast on dark backgrounds)
> - Different colors entirely (a separate dark-mode palette)
>
> Answer: _______________

### 10.4 Dark Mode Priority

> **Your Decision**: How important is dark mode relative to other work?
> - High priority (design it now, implement alongside light mode)
> - Medium priority (define the direction now, implement in a later phase)
> - Low priority (just make sure it is architecturally possible, design it when we get there)
>
> Answer: _______________

---

## Summary Checklist

Before the brand guide is considered complete, every item below should have a decision (even if the decision is "keep the tentative value"):

### Color Palette
- [ ] Light mode: background, surface, foreground, muted, border, primary accent, secondary accent, error, success, warning
- [ ] Dark mode: background, surface, foreground, muted, border, accent behavior
- [ ] Palette feeling (adjectives, saturation, avoided colors)

### Typography
- [ ] Heading font family
- [ ] Body font family
- [ ] Font scale / hierarchy (or directional guidance)
- [ ] Font weights
- [ ] Letter spacing preferences
- [ ] Line height preferences

### Logo and Wordmark
- [ ] Logo file(s) or confirmation that text-only is the plan
- [ ] Wordmark treatment (capitalization, font, spacing)
- [ ] Dark mode logo variant
- [ ] Favicon

### Imagery and Art Presentation
- [ ] Image corner radius
- [ ] Listing grid aspect ratio
- [ ] Image border/shadow treatment
- [ ] Hover behavior on images
- [ ] "Sold" overlay style
- [ ] Profile photo shape
- [ ] Cover image aspect ratio and overlay treatment

### Component Style
- [ ] Button style (radius, fill, text case, hover)
- [ ] Card style (border, shadow, background, hover)
- [ ] Input/form field style
- [ ] Badge/pill style
- [ ] Navigation active and hover states
- [ ] Modal/dialog style
- [ ] Loading/skeleton state style

### Spacing and Layout
- [ ] Overall density
- [ ] Grid gap sizes
- [ ] Section spacing
- [ ] Content max width
- [ ] Padding philosophy

### Motion and Interaction
- [ ] Hover transition speed and easing
- [ ] Page transition approach
- [ ] Loading animation style
- [ ] Scroll behavior

### Tone of Voice (Visual)
- [ ] Visual mood adjectives
- [ ] Reference brands to emulate
- [ ] Reference brands to avoid
- [ ] Definition of "gallery quality"

### Artist Profile Customization
- [ ] Which aspects are customizable
- [ ] Which aspects are locked
- [ ] Customization philosophy

### Dark Mode
- [ ] Inversion vs. distinct palette
- [ ] Temperature (warm vs. cool vs. neutral)
- [ ] Accent color behavior across modes
- [ ] Priority level

---

*This document was prepared by the CTO for COO review. Once all decisions are filled in, the CTO will implement them as the definitive design system for Surfaced Art.*
