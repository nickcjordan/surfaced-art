import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchResultsView } from '../SearchResultsView'
import type { FeaturedArtistItem } from '@surfaced-art/types'
import type { CategoryListingItem } from '../CategoryBrowseView'

const mockListings: CategoryListingItem[] = [
  {
    id: 'listing-1',
    title: 'Blue Ceramic Vase',
    medium: 'Stoneware',
    category: 'ceramics',
    price: 12500,
    status: 'available',
    primaryImageUrl: null,
    primaryImageWidth: null,
    primaryImageHeight: null,
    artistName: 'Abbey Peters',
  },
]

const mockArtists: FeaturedArtistItem[] = [
  {
    slug: 'abbey-peters',
    displayName: 'Abbey Peters',
    location: 'Portland, OR',
    profileImageUrl: null,
    coverImageUrl: null,
    artworkImageUrls: [],
    categories: ['ceramics'],
  },
]

describe('SearchResultsView', () => {
  it('should render search heading with query', () => {
    render(
      <SearchResultsView
        query="ceramic"
        listings={mockListings}
        artists={mockArtists}
        totalListingCount={1}
        totalArtistCount={1}
      />,
    )

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Results for \u201Cceramic\u201D',
    )
  })

  it('should render listing cards in pieces view', () => {
    render(
      <SearchResultsView
        query="ceramic"
        listings={mockListings}
        artists={mockArtists}
        totalListingCount={1}
        totalArtistCount={1}
      />,
    )

    expect(screen.getByTestId('search-results-listings')).toBeInTheDocument()
    // ListingCard renders the title in multiple places (card info + hover overlay)
    expect(screen.getAllByText('Blue Ceramic Vase').length).toBeGreaterThanOrEqual(1)
  })

  it('should show piece count label', () => {
    render(
      <SearchResultsView
        query="ceramic"
        listings={mockListings}
        artists={mockArtists}
        totalListingCount={5}
        totalArtistCount={1}
      />,
    )

    expect(screen.getByText('5 pieces found')).toBeInTheDocument()
  })

  it('should switch to artists tab', async () => {
    const user = userEvent.setup()
    render(
      <SearchResultsView
        query="ceramic"
        listings={mockListings}
        artists={mockArtists}
        totalListingCount={1}
        totalArtistCount={1}
      />,
    )

    await user.click(screen.getByRole('tab', { name: 'Artists' }))

    expect(screen.getByTestId('search-results-artists')).toBeInTheDocument()
    // ArtistCard renders the name
    expect(screen.getAllByText('Abbey Peters').length).toBeGreaterThanOrEqual(1)
  })

  it('should show empty state when no listings found', () => {
    render(
      <SearchResultsView
        query="xyznonexistent"
        listings={[]}
        artists={[]}
        totalListingCount={0}
        totalArtistCount={0}
      />,
    )

    expect(screen.getByText('No pieces found')).toBeInTheDocument()
  })

  it('should show error state when hasError is true', () => {
    render(
      <SearchResultsView
        query="ceramic"
        listings={[]}
        artists={[]}
        totalListingCount={0}
        totalArtistCount={0}
        hasError
      />,
    )

    expect(screen.getByText('Unable to load results')).toBeInTheDocument()
  })

  it('should render data-testid for search-header', () => {
    render(
      <SearchResultsView
        query="test"
        listings={[]}
        artists={[]}
        totalListingCount={0}
        totalArtistCount={0}
      />,
    )

    expect(screen.getByTestId('search-header')).toBeInTheDocument()
  })
})
