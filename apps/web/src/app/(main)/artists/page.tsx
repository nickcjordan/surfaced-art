import type { Metadata } from 'next'
import { getFeaturedArtists, ApiError } from '@/lib/api'
import { ArtistCard } from '@/components/ArtistCard'
import { JsonLd } from '@/components/JsonLd'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { SITE_URL } from '@/lib/site-config'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Artists — Surfaced Art',
  description:
    'Browse all vetted artists on Surfaced Art. Discover ceramics, drawing & painting, printmaking & photography, and mixed media & 3D.',
  alternates: {
    canonical: `${SITE_URL}/artists`,
  },
  openGraph: {
    title: 'Artists — Surfaced Art',
    description:
      'Browse all vetted artists on Surfaced Art. Discover ceramics, drawing & painting, printmaking & photography, and mixed media & 3D.',
    type: 'website',
    url: `${SITE_URL}/artists`,
  },
}

async function fetchArtists() {
  try {
    return await getFeaturedArtists({ limit: 50 })
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`API error fetching artists: ${error.status} ${error.message}`)
    } else {
      console.error('Unexpected error fetching artists:', error)
    }
    return []
  }
}

export default async function ArtistsPage() {
  const artists = await fetchArtists()

  return (
    <div className="space-y-12 md:space-y-16">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Artists — Surfaced Art',
        url: `${SITE_URL}/artists`,
        description: metadata.description,
        isPartOf: {
          '@type': 'WebSite',
          name: 'Surfaced Art',
          url: SITE_URL,
        },
      }} />

      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Artists' },
      ]} />

      {/* Header */}
      <section>
        <h1 className="font-serif text-4xl tracking-tight text-foreground sm:text-5xl">
          Our Artists
        </h1>
        <p className="mt-4 max-w-lg text-lg leading-relaxed text-muted-text">
          Every artist on Surfaced Art has been vetted for authenticity and
          craft. Browse their profiles to discover original, handmade work.
        </p>
      </section>

      {/* Artist grid */}
      {artists.length > 0 ? (
        <section data-testid="artists-grid">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {artists.map((artist) => (
              <ArtistCard
                key={artist.slug}
                artist={artist}
                data-testid="artist-card"
              />
            ))}
          </div>
        </section>
      ) : (
        <section className="py-12 text-center">
          <p className="text-muted-text">
            No artists to show right now. Please check back soon.
          </p>
        </section>
      )}
    </div>
  )
}
