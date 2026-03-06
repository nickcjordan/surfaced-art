import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/JsonLd'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Button } from '@/components/ui/button'
import { SITE_URL } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'For Artists — Surfaced Art',
  description:
    'Join a curated gallery for real makers. Vetted artists, dedicated profiles, transparent commission, and a platform that handles the rest.',
  alternates: { canonical: `${SITE_URL}/for-artists` },
  openGraph: {
    title: 'For Artists — Surfaced Art',
    description:
      'Join a curated gallery for real makers. Vetted artists, dedicated profiles, transparent commission, and a platform that handles the rest.',
    url: `${SITE_URL}/for-artists`,
  },
}

export default function ForArtistsPage() {
  return (
    <div className="space-y-12 md:space-y-16">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'For Artists — Surfaced Art',
          url: `${SITE_URL}/for-artists`,
          description: metadata.description,
          isPartOf: {
            '@type': 'WebSite',
            name: 'Surfaced Art',
            url: SITE_URL,
          },
        }}
      />

      <Breadcrumbs
        items={[{ label: 'Home', href: '/' }, { label: 'For Artists' }]}
      />

      {/* Hero */}
      <section data-testid="for-artists-hero" className="max-w-2xl">
        <h1 className="text-4xl tracking-tight text-foreground sm:text-5xl">
          Why Surfaced Art?
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-text">
          We built Surfaced Art for artists who make real work with their hands.
          A gallery that gives your craft the credibility it deserves — online.
        </p>
      </section>

      {/* Curated, not open marketplace */}
      <section data-testid="for-artists-curated" className="max-w-2xl space-y-4">
        <h2 className="font-serif text-2xl text-foreground">
          Curated, not open marketplace
        </h2>
        <p className="text-base leading-relaxed text-muted-text">
          Every artist on Surfaced Art is reviewed and accepted by our curatorial
          team. That means your work stands out — it doesn&apos;t compete with
          mass-produced goods or AI-generated imagery. Being here means
          something.
        </p>
      </section>

      {/* We handle the platform */}
      <section data-testid="for-artists-platform" className="max-w-2xl space-y-4">
        <h2 className="font-serif text-2xl text-foreground">
          We handle the platform
        </h2>
        <p className="text-base leading-relaxed text-muted-text">
          Your storefront, payments, and shipping labels — all taken care of.
          You upload your work, set your prices, and we handle the rest. No
          website to maintain, no payment processor to configure, no tech to
          wrestle with.
        </p>
      </section>

      {/* Transparent commission */}
      <section data-testid="for-artists-commission" className="max-w-2xl space-y-4">
        <h2 className="font-serif text-2xl text-foreground">
          Transparent commission
        </h2>
        <p className="text-base leading-relaxed text-muted-text">
          We take a 30% commission on each sale — that&apos;s it. No listing
          fees, no subscription costs, no hidden charges. You get paid directly
          when your work sells. The commission covers the platform, payment
          processing, and customer support.
        </p>
      </section>

      {/* Your brand, your gallery */}
      <section data-testid="for-artists-design" className="max-w-2xl space-y-4">
        <h2 className="font-serif text-2xl text-foreground">
          Your brand, your gallery
        </h2>
        <p className="text-base leading-relaxed text-muted-text">
          Every artist gets a dedicated profile page with space for your bio,
          your process, your CV, and your portfolio. It&apos;s your gallery
          within the gallery — a place to tell your story alongside your work.
        </p>
      </section>

      {/* CTA */}
      <section
        data-testid="for-artists-cta"
        className="rounded-md border border-border bg-surface px-6 py-12 text-center"
      >
        <h2 className="font-serif text-2xl text-foreground">
          Ready to show your work?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-text">
          Apply to join Surfaced Art. Our curatorial team reviews every
          application personally.
        </p>
        <div className="mt-6">
          <Button asChild size="lg">
            <Link href="/apply">Join the Gallery</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
