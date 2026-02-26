import type { Metadata } from 'next'
import Link from 'next/link'
import { getCategories, getListings, getFeaturedArtists, ApiError } from '@/lib/api'
import { ArtistCard } from '@/components/ArtistCard'
import { ListingCard } from '@/components/ListingCard'
import { CategoryGrid } from '@/components/CategoryGrid'
import { WaitlistForm } from '@/components/WaitlistForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Surfaced Art — A Curated Digital Gallery for Real Makers',
  description:
    'Discover handmade art from vetted artists. Ceramics, painting, print, jewelry, illustration, photography, woodworking, fibers, and mixed media.',
  openGraph: {
    title: 'Surfaced Art — A Curated Digital Gallery for Real Makers',
    description:
      'Discover handmade art from vetted artists. Ceramics, painting, print, jewelry, illustration, photography, woodworking, fibers, and mixed media.',
    type: 'website',
    url: 'https://surfaced.art',
    images: [
      {
        url: 'https://surfaced.art/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Surfaced Art — A Curated Digital Gallery for Real Makers',
      },
    ],
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
      {/* Hero */}
      <section data-testid="hero" className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <h1 className="font-serif text-4xl tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          A curated digital gallery
          <br />
          for real makers
        </h1>
        <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-text">
          Every artist is vetted. Every piece is handmade. From ceramics to
          woodworking — discover work that matters.
        </p>
      </section>

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
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
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
                }}
                artistName={listing.artist.displayName}
              />
            ))}
          </div>
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
        className="rounded-md border border-border bg-surface px-6 py-12 text-center"
      >
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
      </section>
    </div>
  )
}
