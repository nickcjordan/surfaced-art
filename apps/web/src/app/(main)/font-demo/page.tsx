'use client'

/**
 * Temporary font pairing demo page — compare sans-serif heading font candidates.
 * All fonts loaded via next/font/google for proper rendering.
 * DELETE THIS PAGE before merging to dev.
 */

import { useState } from 'react'
import {
  Josefin_Sans,
  Outfit,
  Raleway,
  Urbanist,
  Sora,
  Comfortaa,
} from 'next/font/google'

const josefinSans = Josefin_Sans({
  variable: '--font-demo-josefin',
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
})

const outfit = Outfit({
  variable: '--font-demo-outfit',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  display: 'swap',
})

const raleway = Raleway({
  variable: '--font-demo-raleway',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  display: 'swap',
})

const urbanist = Urbanist({
  variable: '--font-demo-urbanist',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  display: 'swap',
})

const sora = Sora({
  variable: '--font-demo-sora',
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
})

const comfortaa = Comfortaa({
  variable: '--font-demo-comfortaa',
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
})

const fonts = [
  {
    id: 'josefin',
    name: 'Josefin Sans',
    tag: 'Best Fit',
    className: josefinSans.className,
    desc: 'Tall proportions, low x-height, 1920s geometric heritage. Reads as "gallery invitation." Strongest structural contrast with DM Sans.',
    weights: '300–700',
    style: 'Vintage-Modern Geometric',
    tone: 'Elegant, curated, vintage-modern',
  },
  {
    id: 'outfit',
    name: 'Outfit',
    tag: 'Refined Modern',
    className: outfit.className,
    desc: 'Blends Futura elegance with Kabel influences. Subtle roundness echoes Comfortaa. Full 100–900 weight range for hierarchy.',
    weights: '300–900',
    style: 'Sophisticated Geometric',
    tone: 'Modern, refined, creative-professional',
  },
  {
    id: 'raleway',
    name: 'Raleway',
    tag: 'Editorial',
    className: raleway.className,
    desc: 'Elegant, slightly condensed proportions. Old-style numerals and ligatures signal typographic craft. Full weight range.',
    weights: '300–900',
    style: 'Elegant Geometric',
    tone: 'Editorial, gallery-appropriate, art magazine',
  },
  {
    id: 'urbanist',
    name: 'Urbanist',
    tag: 'Architectural',
    className: urbanist.className,
    desc: 'Modernist-inspired, architectural quality. Bauhaus/De Stijl DNA connects to art movements. Clean, structured construction.',
    weights: '300–900',
    style: 'Modernist Geometric',
    tone: 'Architectural, design-conscious, contemporary museum',
  },
  {
    id: 'sora',
    name: 'Sora',
    tag: 'Bold Modern',
    className: sora.className,
    desc: 'Confident, structured letterforms with geometric base. Sturdy strokes give headings strong presence. Slightly more tech-forward.',
    weights: '300–800',
    style: 'Structured Geometric',
    tone: 'Modern, confident, contemporary platform',
  },
  {
    id: 'comfortaa',
    name: 'Comfortaa',
    tag: 'Wordmark Font',
    className: comfortaa.className,
    desc: 'Your logo/wordmark font used as headings. Rounded geometric sans-serif. Risk: may dilute logo distinctiveness when used everywhere.',
    weights: '300–700',
    style: 'Rounded Geometric',
    tone: 'Friendly, modern, brand-forward',
  },
]

/* ─── Sample content ─── */
const sampleBody = `Each artwork on Surfaced Art has been carefully vetted by our curatorial team. We partner with emerging and established artists who create original, handmade work — from oil paintings to ceramic sculpture. Every piece tells a story.`

const sampleArtistBio = `Elena Cordova is a mixed-media artist based in Santa Fe, New Mexico. Her work explores the intersection of landscape and memory, using layers of pigment, found materials, and hand-stitched textiles.`

/* ─── Components ─── */

function HeadingScale({ fontClass }: { fontClass: string }) {
  return (
    <div className="space-y-4">
      <h1 className={`${fontClass} text-5xl leading-[1.1] tracking-[-0.02em] font-light`}>
        Discover Original Handmade Art
      </h1>
      <h2 className={`${fontClass} text-4xl leading-[1.15] tracking-[-0.01em] font-normal`}>
        Featured Artists This Week
      </h2>
      <h3 className={`${fontClass} text-[28px] leading-[1.2] tracking-[-0.01em] font-medium`}>
        Mixed Media on Canvas
      </h3>
      <h4 className={`${fontClass} text-[22px] leading-[1.25] font-medium`}>
        About the Artist
      </h4>
    </div>
  )
}

function ArtistProfileMock({ fontClass }: { fontClass: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-6 space-y-4">
      {/* Header area */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center text-muted-foreground text-xs">
          photo
        </div>
        <div className="flex-1 space-y-1">
          <h2 className={`${fontClass} text-2xl leading-[1.15] tracking-[-0.01em] font-normal`}>
            Elena Cordova
          </h2>
          <p className="text-sm text-muted-foreground">Santa Fe, New Mexico</p>
          <div className="flex gap-2 mt-1">
            <span className="px-2 py-0.5 rounded-full text-xs bg-surface border border-border text-muted-foreground">Mixed Media</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-surface border border-border text-muted-foreground">Textiles</span>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <h3 className={`${fontClass} text-lg leading-[1.2] font-medium`}>About</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{sampleArtistBio}</p>
      </div>

      {/* Artwork cards */}
      <div className="space-y-2">
        <h3 className={`${fontClass} text-lg leading-[1.2] font-medium`}>Available Work</h3>
        <div className="grid grid-cols-2 gap-3">
          {['Layers of Memory #4', 'Desert Fragments'].map((title) => (
            <div key={title} className="rounded-lg border border-border overflow-hidden">
              <div className="h-24 bg-surface" />
              <div className="p-2.5 space-y-1">
                <h4 className={`${fontClass} text-sm font-medium`}>{title}</h4>
                <p className="text-xs text-muted-foreground">Mixed media on canvas</p>
                <p className="text-sm font-semibold">$1,250</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FontSection({ font }: { font: typeof fonts[0] }) {
  return (
    <section className="space-y-8 rounded-2xl border-2 border-border p-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h2 className={`${font.className} text-3xl font-normal`}>{font.name}</h2>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
            {font.tag}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{font.desc}</p>
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
          <span>Weights: {font.weights}</span>
          <span>Style: {font.style}</span>
          <span>Tone: {font.tone}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Left: Heading scale + body text */}
        <div className="space-y-6">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">Heading Scale (Light → Medium)</p>
            <HeadingScale fontClass={font.className} />
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">Paired with DM Sans Body</p>
            <p className="text-base leading-[1.65] text-foreground">{sampleBody}</p>
          </div>

          {/* Weight samples */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">Weight Samples at 32px</p>
            <div className="space-y-1">
              {[['300', 'Light'], ['400', 'Regular'], ['500', 'Medium'], ['600', 'SemiBold'], ['700', 'Bold']].map(([weight, label]) => (
                <p key={weight} className={`${font.className} text-[32px] leading-[1.3]`} style={{ fontWeight: Number(weight) }}>
                  {label} ({weight}) — Surfaced Art
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Artist profile mockup */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">In Context — Artist Profile</p>
          <ArtistProfileMock fontClass={font.className} />
        </div>
      </div>
    </section>
  )
}

/* ─── Side-by-side comparison ─── */
function ComparisonStrip() {
  const heading = 'Discover Original Handmade Art'
  const subheading = 'Featured Artists This Week'

  return (
    <section className="space-y-6 rounded-2xl border-2 border-border p-8">
      <h2 className="text-2xl font-semibold">Side-by-Side Comparison</h2>
      <p className="text-sm text-muted-foreground">Same headings, all fonts, for quick visual comparison.</p>

      <div className="space-y-10">
        {/* H1 comparison */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">H1 — Page Title (48px, Light)</p>
          <div className="space-y-4">
            {fonts.map((font) => (
              <div key={font.id} className="flex items-baseline gap-4">
                <span className="text-xs text-muted-foreground w-28 shrink-0 text-right">{font.name}</span>
                <h1 className={`${font.className} text-5xl leading-[1.1] tracking-[-0.02em] font-light`}>
                  {heading}
                </h1>
              </div>
            ))}
          </div>
        </div>

        {/* H2 comparison */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">H2 — Section Heading (36px, Regular)</p>
          <div className="space-y-4">
            {fonts.map((font) => (
              <div key={font.id} className="flex items-baseline gap-4">
                <span className="text-xs text-muted-foreground w-28 shrink-0 text-right">{font.name}</span>
                <h2 className={`${font.className} text-4xl leading-[1.15] tracking-[-0.01em] font-normal`}>
                  {subheading}
                </h2>
              </div>
            ))}
          </div>
        </div>

        {/* H3 comparison */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">H3 — Card Title (28px, Medium)</p>
          <div className="space-y-3">
            {fonts.map((font) => (
              <div key={font.id} className="flex items-baseline gap-4">
                <span className="text-xs text-muted-foreground w-28 shrink-0 text-right">{font.name}</span>
                <h3 className={`${font.className} text-[28px] leading-[1.2] tracking-[-0.01em] font-medium`}>
                  Mixed Media on Canvas
                </h3>
              </div>
            ))}
          </div>
        </div>

        {/* Artist name comparison */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">Artist Name (24px, Regular)</p>
          <div className="space-y-3">
            {fonts.map((font) => (
              <div key={font.id} className="flex items-baseline gap-4">
                <span className="text-xs text-muted-foreground w-28 shrink-0 text-right">{font.name}</span>
                <span className={`${font.className} text-2xl leading-[1.2] font-normal`}>
                  Elena Cordova
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Full page comparison (toggle between fonts) ─── */
function FullPageToggle() {
  const [activeIdx, setActiveIdx] = useState(0)
  const font = fonts[activeIdx]

  return (
    <section className="space-y-6 rounded-2xl border-2 border-border p-8">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Full Page Preview — Toggle Font</h2>
        <p className="text-sm text-muted-foreground">Click a font to see how an entire page section feels with DM Sans body text.</p>
      </div>

      {/* Toggle buttons */}
      <div className="flex flex-wrap gap-2">
        {fonts.map((f, i) => (
          <button
            key={f.id}
            onClick={() => setActiveIdx(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              i === activeIdx
                ? 'bg-foreground text-background'
                : 'bg-surface border border-border text-foreground hover:bg-border'
            }`}
          >
            {f.name}
          </button>
        ))}
      </div>

      {/* Preview */}
      <div className="rounded-xl border border-border bg-background p-8 space-y-6">
        {/* Active font label */}
        <div className="text-center">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            Currently viewing: {font.name}
          </span>
        </div>

        {/* Hero section mock */}
        <div className="text-center space-y-4 py-8">
          <h1 className={`${font.className} text-5xl leading-[1.1] tracking-[-0.02em] font-light`}>
            Curated Art, Direct From the Artist
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Surfaced Art connects collectors with vetted emerging and established artists.
            Every piece is original, handmade, and ships directly from the studio.
          </p>
        </div>

        {/* Section heading */}
        <div className="border-t border-border pt-8 space-y-4">
          <h2 className={`${font.className} text-4xl leading-[1.15] tracking-[-0.01em] font-normal`}>
            Featured Artists
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Elena Cordova', location: 'Santa Fe, NM', medium: 'Mixed Media' },
              { name: 'James Okafor', location: 'Brooklyn, NY', medium: 'Oil Painting' },
              { name: 'Tomoko Ishida', location: 'Portland, OR', medium: 'Ceramics' },
            ].map((artist) => (
              <div key={artist.name} className="rounded-lg border border-border overflow-hidden">
                <div className="h-32 bg-surface" />
                <div className="p-4 space-y-1">
                  <h3 className={`${font.className} text-xl leading-[1.2] font-medium`}>
                    {artist.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{artist.location}</p>
                  <p className="text-xs text-muted-foreground">{artist.medium}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Listing section */}
        <div className="border-t border-border pt-8 space-y-4">
          <h2 className={`${font.className} text-4xl leading-[1.15] tracking-[-0.01em] font-normal`}>
            Recent Listings
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: 'Layers of Memory #4', price: '$1,250' },
              { title: 'Coastal Erosion', price: '$880' },
              { title: 'Vessel Series III', price: '$420' },
              { title: 'Desert Fragments', price: '$1,650' },
            ].map((listing) => (
              <div key={listing.title} className="rounded-lg border border-border overflow-hidden">
                <div className="h-28 bg-surface" />
                <div className="p-3 space-y-1">
                  <h4 className={`${font.className} text-sm font-medium leading-snug`}>
                    {listing.title}
                  </h4>
                  <p className="text-sm font-semibold">{listing.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mixed content — heading + body paragraph */}
        <div className="border-t border-border pt-8 space-y-3 max-w-2xl">
          <h2 className={`${font.className} text-4xl leading-[1.15] tracking-[-0.01em] font-normal`}>
            How It Works
          </h2>
          <p className="text-base leading-[1.65] text-foreground">
            Every artist on Surfaced Art goes through a careful vetting process. We look for originality,
            craftsmanship, and a genuine commitment to their practice. When you purchase from our platform,
            you&apos;re buying directly from the artist — no middlemen, no reproductions.
          </p>
          <h3 className={`${font.className} text-[28px] leading-[1.2] tracking-[-0.01em] font-medium pt-4`}>
            For Collectors
          </h3>
          <p className="text-base leading-[1.65] text-foreground">
            Browse curated collections, discover emerging talent, and build a collection that means something.
            Every piece comes with a certificate of authenticity and ships directly from the artist&apos;s studio.
          </p>
        </div>
      </div>
    </section>
  )
}

/* ─── Page ─── */
export default function FontDemoPage() {
  return (
    <div
      className={`max-w-7xl mx-auto py-12 px-6 space-y-16 ${josefinSans.variable} ${outfit.variable} ${raleway.variable} ${urbanist.variable} ${sora.variable} ${comfortaa.variable}`}
    >
      <div>
        <h1 className="text-3xl font-semibold mb-2">Sans-Serif Heading Font Candidates</h1>
        <p className="text-muted-foreground max-w-3xl">
          Comparing sans-serif heading fonts to pair with DM Sans (body) and complement the Comfortaa wordmark.
          Brand direction: modern, rounded, friendly — with a feeling of creativity and artsy-ness.
        </p>
        <p className="text-sm text-muted-foreground italic mt-1">Temporary page — delete before merging.</p>
      </div>

      {/* Side-by-side strip first for quick comparison */}
      <ComparisonStrip />

      {/* Interactive toggle */}
      <FullPageToggle />

      {/* Individual font deep-dives */}
      {fonts.map((font) => (
        <FontSection key={font.id} font={font} />
      ))}
    </div>
  )
}
