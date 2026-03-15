import { getArtistProfile } from '@/lib/api'
import { ListingCard } from '@/components/ListingCard'
import { MasonryGrid } from '@/components/MasonryGrid'
import { estimateCardHeight } from '@/lib/masonry-utils'

type Props = {
  params: Promise<{ slug: string }>
}

export default async function PortfolioWorkPage({ params }: Props) {
  const { slug } = await params
  const artist = await getArtistProfile(slug)

  const availableListings = artist.listings.filter(
    (l) => l.status === 'available'
  )
  const soldListings = artist.listings.filter((l) => l.status === 'sold')

  const toListingCardProp = (listing: (typeof artist.listings)[number]) => ({
    id: listing.id,
    title: listing.title,
    medium: listing.medium,
    category: listing.category,
    price: listing.price,
    status: listing.status,
    primaryImageUrl: listing.images[0]?.url ?? null,
    primaryImageWidth: listing.images[0]?.width ?? null,
    primaryImageHeight: listing.images[0]?.height ?? null,
  })

  return (
    <>
      {/* Available Work */}
      {availableListings.length > 0 && (
        <section data-testid="available-work">
          <MasonryGrid
            columns={[2, 2, 3, 3]}
            itemHeights={availableListings.map((l) =>
              estimateCardHeight(l.images[0]?.width, l.images[0]?.height)
            )}
          >
            {availableListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={toListingCardProp(listing)}
                artistName={artist.displayName}
                variant="portfolio"
              />
            ))}
          </MasonryGrid>
        </section>
      )}

      {availableListings.length === 0 && (
        <p className="py-12 text-center text-muted-text">
          No work available at this time.
        </p>
      )}

      {/* Archive — sold work */}
      {soldListings.length > 0 && (
        <section data-testid="archive-section" className="mt-16">
          <h2 className="mb-6 font-heading text-2xl text-muted-text">Archive</h2>
          <MasonryGrid
            columns={[2, 2, 3, 3]}
            className="opacity-60 grayscale-[20%]"
            itemHeights={soldListings.map((l) =>
              estimateCardHeight(l.images[0]?.width, l.images[0]?.height)
            )}
          >
            {soldListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={toListingCardProp(listing)}
                artistName={artist.displayName}
                variant="portfolio"
              />
            ))}
          </MasonryGrid>
        </section>
      )}
    </>
  )
}
