import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategoryBrowseView, type CategoryListingItem } from '../CategoryBrowseView'
import type { FeaturedArtistItem } from '@surfaced-art/types'

const mockListings: CategoryListingItem[] = [
  {
    id: 'listing-1',
    title: 'Ceramic Vessel',
    medium: 'Stoneware',
    category: 'ceramics',
    price: 12500,
    status: 'available',
    primaryImageUrl: null,
    artistName: 'Abbey Peters',
  },
  {
    id: 'listing-2',
    title: 'Blue Plate',
    medium: 'Porcelain',
    category: 'ceramics',
    price: 8500,
    status: 'available',
    primaryImageUrl: null,
    artistName: 'Abbey Peters',
  },
]

const mockListingsWithSold: CategoryListingItem[] = [
  {
    id: 'listing-1',
    title: 'Ceramic Vessel',
    medium: 'Stoneware',
    category: 'ceramics',
    price: 12500,
    status: 'available',
    primaryImageUrl: null,
    artistName: 'Abbey Peters',
  },
  {
    id: 'listing-3',
    title: 'Sold Vase',
    medium: 'Stoneware',
    category: 'ceramics',
    price: 9500,
    status: 'sold',
    primaryImageUrl: null,
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
    categories: ['ceramics'],
  },
]

describe('CategoryBrowseView', () => {
  it('should default to Pieces view', () => {
    render(
      <CategoryBrowseView
        categoryLabel="Ceramics"
        listings={mockListings}
        artists={mockArtists}
        totalListingCount={2}
        totalArtistCount={1}
      />
    )

    expect(screen.getByTestId('category-content')).toBeInTheDocument()
    expect(screen.queryByTestId('category-artists-content')).not.toBeInTheDocument()
  })

  it('should show correct piece count', () => {
    render(
      <CategoryBrowseView
        categoryLabel="Ceramics"
        listings={mockListings}
        artists={mockArtists}
        totalListingCount={5}
        totalArtistCount={1}
      />
    )

    expect(screen.getByText('5 pieces available')).toBeInTheDocument()
  })

  it('should show singular piece count', () => {
    render(
      <CategoryBrowseView
        categoryLabel="Ceramics"
        listings={mockListings.slice(0, 1)}
        artists={mockArtists}
        totalListingCount={1}
        totalArtistCount={1}
      />
    )

    expect(screen.getByText('1 piece available')).toBeInTheDocument()
  })

  it('should switch to Artists view and show artist count', async () => {
    render(
      <CategoryBrowseView
        categoryLabel="Ceramics"
        listings={mockListings}
        artists={mockArtists}
        totalListingCount={2}
        totalArtistCount={3}
      />
    )

    await userEvent.click(screen.getByRole('tab', { name: 'Artists' }))

    expect(screen.queryByTestId('category-content')).not.toBeInTheDocument()
    expect(screen.getByTestId('category-artists-content')).toBeInTheDocument()
    expect(screen.getByText('3 artists')).toBeInTheDocument()
  })

  it('should show singular artist count', async () => {
    render(
      <CategoryBrowseView
        categoryLabel="Ceramics"
        listings={mockListings}
        artists={mockArtists}
        totalListingCount={2}
        totalArtistCount={1}
      />
    )

    await userEvent.click(screen.getByRole('tab', { name: 'Artists' }))
    expect(screen.getByText('1 artist')).toBeInTheDocument()
  })

  it('should render the category label as heading', () => {
    render(
      <CategoryBrowseView
        categoryLabel="Ceramics"
        listings={mockListings}
        artists={mockArtists}
        totalListingCount={2}
        totalArtistCount={1}
      />
    )

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Ceramics')
  })

  it('should show empty state when no listings exist', () => {
    render(
      <CategoryBrowseView
        categoryLabel="Ceramics"
        listings={[]}
        artists={mockArtists}
        totalListingCount={0}
        totalArtistCount={1}
      />
    )

    expect(screen.getByText('No pieces in this category yet')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '← Back to gallery' })).toBeInTheDocument()
  })

  it('should show empty state when no artists exist', async () => {
    render(
      <CategoryBrowseView
        categoryLabel="Ceramics"
        listings={mockListings}
        artists={[]}
        totalListingCount={2}
        totalArtistCount={0}
      />
    )

    await userEvent.click(screen.getByRole('tab', { name: 'Artists' }))

    expect(screen.getByText('No artists in this category yet')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '← Back to gallery' })).toBeInTheDocument()
  })

  it('should render the view toggle', () => {
    render(
      <CategoryBrowseView
        categoryLabel="Ceramics"
        listings={mockListings}
        artists={mockArtists}
        totalListingCount={2}
        totalArtistCount={1}
      />
    )

    expect(screen.getByTestId('view-toggle')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Pieces' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Artists' })).toBeInTheDocument()
  })

  it('should accept both available and sold statuses in listings', () => {
    render(
      <CategoryBrowseView
        categoryLabel="Ceramics"
        listings={mockListingsWithSold}
        artists={mockArtists}
        totalListingCount={2}
        totalArtistCount={1}
      />
    )

    // Each listing title appears twice per card (hover overlay + card info)
    expect(screen.getAllByText('Ceramic Vessel').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Sold Vase').length).toBeGreaterThanOrEqual(1)
  })

  it('should render active content with role="tabpanel"', () => {
    render(
      <CategoryBrowseView
        categoryLabel="Ceramics"
        listings={mockListings}
        artists={mockArtists}
        totalListingCount={2}
        totalArtistCount={1}
      />
    )

    const panel = screen.getByRole('tabpanel')
    expect(panel).toBeInTheDocument()
    expect(panel).toHaveAttribute('aria-labelledby')
  })

  it('should wire tab aria-controls to tabpanel id', () => {
    render(
      <CategoryBrowseView
        categoryLabel="Ceramics"
        listings={mockListings}
        artists={mockArtists}
        totalListingCount={2}
        totalArtistCount={1}
      />
    )

    const piecesTab = screen.getByRole('tab', { name: 'Pieces' })
    const panel = screen.getByRole('tabpanel')
    expect(piecesTab.getAttribute('aria-controls')).toBe(panel.getAttribute('id'))
    expect(panel.getAttribute('aria-labelledby')).toBe(piecesTab.getAttribute('id'))
  })

  it('should wire artists tabpanel correctly when switching', async () => {
    render(
      <CategoryBrowseView
        categoryLabel="Ceramics"
        listings={mockListings}
        artists={mockArtists}
        totalListingCount={2}
        totalArtistCount={1}
      />
    )

    await userEvent.click(screen.getByRole('tab', { name: 'Artists' }))

    const artistsTab = screen.getByRole('tab', { name: 'Artists' })
    const panel = screen.getByRole('tabpanel')
    expect(artistsTab.getAttribute('aria-controls')).toBe(panel.getAttribute('id'))
    expect(panel.getAttribute('aria-labelledby')).toBe(artistsTab.getAttribute('id'))
  })

  it('should show error state instead of empty state when hasError is true', () => {
    render(
      <CategoryBrowseView
        categoryLabel="Ceramics"
        listings={[]}
        artists={[]}
        totalListingCount={0}
        totalArtistCount={0}
        hasError
      />
    )

    expect(screen.getByText(/unable to load/i)).toBeInTheDocument()
    expect(screen.queryByText('No pieces in this category yet')).not.toBeInTheDocument()
  })

  it('should show error state on artists tab when hasError is true', async () => {
    render(
      <CategoryBrowseView
        categoryLabel="Ceramics"
        listings={[]}
        artists={[]}
        totalListingCount={0}
        totalArtistCount={0}
        hasError
      />
    )

    await userEvent.click(screen.getByRole('tab', { name: 'Artists' }))

    expect(screen.getByText(/unable to load/i)).toBeInTheDocument()
    expect(screen.queryByText('No artists in this category yet')).not.toBeInTheDocument()
  })

  it('should preserve category-header data-testid', () => {
    render(
      <CategoryBrowseView
        categoryLabel="Ceramics"
        listings={mockListings}
        artists={mockArtists}
        totalListingCount={2}
        totalArtistCount={1}
      />
    )

    expect(screen.getByTestId('category-header')).toBeInTheDocument()
  })
})
