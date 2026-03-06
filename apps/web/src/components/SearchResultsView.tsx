'use client'

import { useId, useState } from 'react'
import type { FeaturedArtistItem } from '@surfaced-art/types'
import { ViewToggle, getTabId, getPanelId } from '@/components/ViewToggle'
import { CardGrid } from '@/components/CardGrid'
import { MasonryGrid } from '@/components/MasonryGrid'
import { EmptyState } from '@/components/EmptyState'
import { ListingCard } from '@/components/ListingCard'
import { ArtistCard } from '@/components/ArtistCard'
import type { CategoryListingItem } from '@/components/CategoryBrowseView'

type SearchView = 'pieces' | 'artists'

const viewOptions: { value: SearchView; label: string }[] = [
  { value: 'pieces', label: 'Pieces' },
  { value: 'artists', label: 'Artists' },
]

type SearchResultsViewProps = {
  query: string
  listings: CategoryListingItem[]
  artists: FeaturedArtistItem[]
  totalListingCount: number
  totalArtistCount: number
  hasError?: boolean
}

export function SearchResultsView({
  query,
  listings,
  artists,
  totalListingCount,
  totalArtistCount,
  hasError = false,
}: SearchResultsViewProps) {
  const [view, setView] = useState<SearchView>('pieces')

  const toggleId = `search-browse${useId()}`
  const count = view === 'pieces' ? totalListingCount : totalArtistCount
  const countLabel = view === 'pieces'
    ? `${count} ${count === 1 ? 'piece' : 'pieces'} found`
    : `${count} ${count === 1 ? 'artist' : 'artists'} found`

  return (
    <>
      {/* Search Header */}
      <section data-testid="search-header">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl text-foreground sm:text-4xl">
              Results for &ldquo;{query}&rdquo;
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
          data-testid="search-results-listings"
        >
          {hasError ? (
            <EmptyState
              title="Unable to load results"
              description="Something went wrong with your search. Please try again later."
              action={{ label: '← Back to gallery', href: '/' }}
            />
          ) : listings.length > 0 ? (
            <MasonryGrid>
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
                    primaryImageWidth: listing.primaryImageWidth,
                    primaryImageHeight: listing.primaryImageHeight,
                  }}
                  artistName={listing.artistName}
                />
              ))}
            </MasonryGrid>
          ) : (
            <EmptyState
              title="No pieces found"
              description={`No pieces match "${query}". Try different keywords.`}
              action={{ label: '← Browse categories', href: '/' }}
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
          data-testid="search-results-artists"
        >
          {hasError ? (
            <EmptyState
              title="Unable to load results"
              description="Something went wrong with your search. Please try again later."
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
              title="No artists found"
              description={`No artists match "${query}". Try different keywords.`}
              action={{ label: '← Browse categories', href: '/' }}
            />
          )}
        </section>
      )}
    </>
  )
}
