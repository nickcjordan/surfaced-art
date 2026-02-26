'use client'

import { useState } from 'react'
import type { CategoryType, FeaturedArtistItem, ListingStatusType } from '@surfaced-art/types'
import { ViewToggle } from '@/components/ViewToggle'
import { CardGrid } from '@/components/CardGrid'
import { EmptyState } from '@/components/EmptyState'
import { ListingCard } from '@/components/ListingCard'
import { ArtistCard } from '@/components/ArtistCard'

type BrowseView = 'pieces' | 'artists'

const viewOptions: { value: BrowseView; label: string }[] = [
  { value: 'pieces', label: 'Pieces' },
  { value: 'artists', label: 'Artists' },
]

/** Serializable listing shape for the server/client boundary (no Date objects). */
export type CategoryListingItem = {
  id: string
  title: string
  medium: string
  category: CategoryType
  price: number
  status: ListingStatusType
  primaryImageUrl: string | null
  artistName: string
}

type CategoryBrowseViewProps = {
  categoryLabel: string
  listings: CategoryListingItem[]
  artists: FeaturedArtistItem[]
  totalListingCount: number
  totalArtistCount: number
}

export function CategoryBrowseView({
  categoryLabel,
  listings,
  artists,
  totalListingCount,
  totalArtistCount,
}: CategoryBrowseViewProps) {
  const [view, setView] = useState<BrowseView>('pieces')

  const count = view === 'pieces' ? totalListingCount : totalArtistCount
  const countLabel = view === 'pieces'
    ? `${count} ${count === 1 ? 'piece' : 'pieces'} available`
    : `${count} ${count === 1 ? 'artist' : 'artists'}`

  return (
    <>
      {/* Category Header */}
      <section data-testid="category-header">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl text-foreground sm:text-4xl">
              {categoryLabel}
            </h1>
            <p className="mt-2 text-sm text-muted-text">{countLabel}</p>
          </div>
          <ViewToggle options={viewOptions} value={view} onChange={setView} />
        </div>
      </section>

      {/* Pieces View */}
      {view === 'pieces' && (
        <section data-testid="category-content">
          {listings.length > 0 ? (
            <CardGrid variant="listings">
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
                    primaryImageUrl: listing.primaryImageUrl,
                  }}
                  artistName={listing.artistName}
                />
              ))}
            </CardGrid>
          ) : (
            <EmptyState
              title="No pieces in this category yet"
              description="Check back soon — new work is added regularly."
              action={{ label: '← Back to gallery', href: '/' }}
            />
          )}
        </section>
      )}

      {/* Artists View */}
      {view === 'artists' && (
        <section data-testid="category-artists-content">
          {artists.length > 0 ? (
            <CardGrid variant="artists">
              {artists.map((artist) => (
                <ArtistCard
                  key={artist.slug}
                  artist={artist}
                  data-testid="artist-card"
                />
              ))}
            </CardGrid>
          ) : (
            <EmptyState
              title="No artists in this category yet"
              description="Check back soon — new artists are added regularly."
              action={{ label: '← Back to gallery', href: '/' }}
            />
          )}
        </section>
      )}
    </>
  )
}
