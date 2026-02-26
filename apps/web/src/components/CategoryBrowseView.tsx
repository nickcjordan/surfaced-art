'use client'

import { useState } from 'react'
import type { CategoryType, FeaturedArtistItem, ListingStatusType } from '@surfaced-art/types'
import { ViewToggle, getTabId, getPanelId } from '@/components/ViewToggle'
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
  /** When true, shows an error state instead of the normal empty state. */
  hasError?: boolean
}

export function CategoryBrowseView({
  categoryLabel,
  listings,
  artists,
  totalListingCount,
  totalArtistCount,
  hasError = false,
}: CategoryBrowseViewProps) {
  const [view, setView] = useState<BrowseView>('pieces')

  const toggleId = 'category-browse'
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
          <ViewToggle id={toggleId} options={viewOptions} value={view} onChange={setView} />
        </div>
      </section>

      {/* Pieces View */}
      {view === 'pieces' && (
        <section
          role="tabpanel"
          id={getPanelId(toggleId, 'pieces')}
          aria-labelledby={getTabId(toggleId, 'pieces')}
          data-testid="category-content"
        >
          {hasError ? (
            <EmptyState
              title="Unable to load pieces"
              description="Something went wrong loading this category. Please try again later."
              action={{ label: '← Back to gallery', href: '/' }}
            />
          ) : listings.length > 0 ? (
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
        <section
          role="tabpanel"
          id={getPanelId(toggleId, 'artists')}
          aria-labelledby={getTabId(toggleId, 'artists')}
          data-testid="category-artists-content"
        >
          {hasError ? (
            <EmptyState
              title="Unable to load artists"
              description="Something went wrong loading this category. Please try again later."
              action={{ label: '← Back to gallery', href: '/' }}
            />
          ) : artists.length > 0 ? (
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
