import type { Metadata } from 'next'
import { JsonLd } from '@/components/JsonLd'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { CanvasDotOverlayFullBleed } from '@/components/ui/canvas-texture'
import { SITE_URL } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'About — Surfaced Art',
  description:
    'Surfaced Art is a curated digital gallery for real makers. Every artist is vetted. Every piece is handmade. No AI, no dropshipping, no mass production.',
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
  openGraph: {
    title: 'About — Surfaced Art',
    description:
      'Surfaced Art is a curated digital gallery for real makers. Every artist is vetted. Every piece is handmade. No AI, no dropshipping, no mass production.',
    type: 'website',
    url: `${SITE_URL}/about`,
  },
}

export default function AboutPage() {
  return (
    <div className="relative space-y-12 md:space-y-16">
      <CanvasDotOverlayFullBleed />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: 'About Surfaced Art',
        url: `${SITE_URL}/about`,
        description: metadata.description,
        isPartOf: {
          '@type': 'WebSite',
          name: 'Surfaced Art',
          url: SITE_URL,
        },
      }} />

      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'About' },
      ]} />

      {/* Hero */}
      <section data-testid="about-hero" className="max-w-2xl">
        <h1 className="font-heading text-4xl tracking-tight text-foreground sm:text-5xl">
          About Surfaced Art
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-text">
          A curated digital gallery for real makers. The credibility of a
          gallery, accessible online.
        </p>
      </section>

      {/* What makes us different */}
      <section data-testid="about-gallery" className="max-w-2xl space-y-6">
        <h2 className="font-heading text-2xl text-foreground">
          A gallery, not a marketplace
        </h2>
        <p className="text-base leading-relaxed text-muted-text">
          That distinction is foundational. Artists understand galleries. They
          trust galleries. They know the relationship, the commission structure,
          and the credibility that comes with being represented. Surfaced Art
          exists to give genuine, independent artists a credible online home
          where buyers can trust that every piece is handmade by the artist who
          is selling it.
        </p>
        <p className="text-base leading-relaxed text-muted-text">
          Every artist is vetted. Every piece is handmade. No AI. No dropshipping.
          No mass production.
        </p>
      </section>

      {/* For artists */}
      <section data-testid="about-artists" className="max-w-2xl space-y-6">
        <h2 className="font-heading text-2xl text-foreground">
          For artists
        </h2>
        <p className="text-base leading-relaxed text-muted-text">
          We are a pipeline for emerging and independent artists who don&apos;t
          yet have gallery representation. Applying to Surfaced Art should feel
          like applying to a gallery — an honor, not a formality. Acceptance
          means something. Artists who earned their place have skin in the game
          and contribute to a culture built on authenticity.
        </p>
      </section>

      {/* For buyers */}
      <section data-testid="about-buyers" className="max-w-2xl space-y-6">
        <h2 className="font-heading text-2xl text-foreground">
          For buyers
        </h2>
        <p className="text-base leading-relaxed text-muted-text">
          We are a trust signal for buyers who are tired of being burned by
          mass-produced goods disguised as handmade. When you buy on Surfaced
          Art, you are buying directly from the person who made it. Every
          artist has been reviewed and accepted based on their craft, their
          process, and their commitment to making real work.
        </p>
      </section>
    </div>
  )
}
