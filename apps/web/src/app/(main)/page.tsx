import type { Metadata } from 'next'
import Link from 'next/link'
import { getCategories, getListings, getFeaturedArtists, ApiError } from '@/lib/api'
import { SplitHero } from '@/components/SplitHero'
import { ArtistCard } from '@/components/ArtistCard'
import { ListingCard } from '@/components/ListingCard'
import { MasonryGrid } from '@/components/MasonryGrid'
import { CategoryGrid } from '@/components/CategoryGrid'
import { WaitlistForm } from '@/components/WaitlistForm'
import { JsonLd } from '@/components/JsonLd'
import { CanvasDotOverlay } from '@/components/ui/canvas-texture'
import { SITE_URL } from '@/lib/site-config'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Surfaced Art — A Curated Digital Gallery for Real Makers',
  description:
    'Discover handmade art from vetted artists. Ceramics, drawing & painting, printmaking & photography, and mixed media & 3D.',
  openGraph: {
    title: 'Surfaced Art — A Curated Digital Gallery for Real Makers',
    description:
      'Discover handmade art from vetted artists. Ceramics, drawing & painting, printmaking & photography, and mixed media & 3D.',
    type: 'website',
    url: SITE_URL,
  },
}

async function fetchHomeData() {
  try {
    const [categories, listingsResponse, featuredArtists] = await Promise.all([
      getCategories(),
      getListings({ status: 'available', limit: 6 }),
      getFeaturedArtists({ limit: 4 }),
    ])
    return { categories, listings: listingsResponse.data, artists: featuredArtists }
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`API error fetching home data: ${error.status} ${error.message}`)
    } else {
      console.error('Unexpected error fetching home data:', error)
    }
    return { categories: [], listings: [], artists: [] }
  }
}

export default async function Home() {
  const { categories, listings, artists } = await fetchHomeData()

  return (
    <div className="space-y-16 md:space-y-24">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Surfaced Art',
        url: SITE_URL,
        description: 'Discover handmade art from vetted artists. Ceramics, drawing & painting, printmaking & photography, and mixed media & 3D.',
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Surfaced Art',
        url: SITE_URL,
        logo: `${SITE_URL}/opengraph-image`,
      }} />

      {/* Hero */}
      <SplitHero />

      {/* Featured Artists */}
      {artists.length > 0 && (
        <section data-testid="featured-artists">
          <div className="mb-8 flex items-baseline justify-between">
            <h2 className="font-serif text-2xl text-foreground">Featured Artists</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {artists.map((artist) => (
              <ArtistCard
                key={artist.slug}
                artist={artist}
                data-testid="artist-card"
              />
            ))}
          </div>
        </section>
      )}

      {/* Featured Listings */}
      {listings.length > 0 && (
        <section data-testid="featured-listings">
          <div className="mb-8 flex items-baseline justify-between">
            <h2 className="font-serif text-2xl text-foreground">Recent Work</h2>
            <Link
              href="/category/ceramics"
              className="text-sm text-muted-text transition-colors hover:text-foreground"
            >
              Browse all
            </Link>
          </div>
          <MasonryGrid columns={[2, 2, 3, 3]}>
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={{
                  id: listing.id,
                  title: listing.title,
                  medium: listing.medium,
                  category: listing.category,
                  price: listing.price,
                  status: listing.status,
                  primaryImageUrl: listing.primaryImage?.url ?? null,
                  primaryImageWidth: listing.primaryImage?.width ?? null,
                  primaryImageHeight: listing.primaryImage?.height ?? null,
                }}
                artistName={listing.artist.displayName}
              />
            ))}
          </MasonryGrid>
        </section>
      )}

      {/* Category Grid */}
      <section data-testid="category-grid-section">
        <h2 className="mb-8 font-serif text-2xl text-foreground text-center">
          Browse by Category
        </h2>
        <CategoryGrid counts={categories} />
      </section>

      {/* Waitlist */}
      <section
        data-testid="waitlist"
        className="relative overflow-hidden rounded-md border border-border bg-surface px-6 py-12 text-center"
      >
        <CanvasDotOverlay />
        <div className="relative">
          <h2 className="font-serif text-2xl text-foreground">
            Be the first to know
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-text">
            This gallery opens to buyers soon. Leave your email to get early
            access.
          </p>
          <div className="mx-auto mt-6 max-w-md">
            <WaitlistForm />
          </div>
        </div>
      </section>
    </div>
  )
}
