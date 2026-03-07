import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ListingCard } from '../ListingCard'

const baseListing = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Ceramic Vase',
  medium: 'Stoneware',
  category: 'ceramics' as const,
  price: 12500,
  status: 'available' as const,
  primaryImageUrl: 'https://cdn.example.com/vase.jpg',
}

describe('ListingCard', () => {
  it('should render listing title and artist name', () => {
    render(
      <ListingCard
        listing={baseListing}
        artistName="Abbey Peters"
      />
    )

    expect(screen.getAllByText('Ceramic Vase').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Abbey Peters').length).toBeGreaterThanOrEqual(1)
  })

  it('should render formatted price', () => {
    render(
      <ListingCard
        listing={baseListing}
        artistName="Abbey Peters"
      />
    )

    expect(screen.getAllByText('$125.00').length).toBeGreaterThanOrEqual(1)
  })

  it('should show sold indicator when status is sold', () => {
    render(
      <ListingCard
        listing={{ ...baseListing, status: 'sold' }}
        artistName="Abbey Peters"
      />
    )

    expect(screen.getByText('Sold')).toBeInTheDocument()
  })

  it('should use aspect-square when no dimensions provided', () => {
    render(
      <ListingCard
        listing={baseListing}
        artistName="Abbey Peters"
      />
    )

    const card = screen.getByTestId('listing-card')
    const imageContainer = card.querySelector('[class*="aspect-square"]')
    expect(imageContainer).toBeTruthy()
  })

  it('should use natural aspect ratio when dimensions are provided', () => {
    render(
      <ListingCard
        listing={{
          ...baseListing,
          primaryImageWidth: 800,
          primaryImageHeight: 600,
        }}
        artistName="Abbey Peters"
      />
    )

    const card = screen.getByTestId('listing-card')
    // Should NOT have aspect-square class
    const squareContainer = card.querySelector('[class*="aspect-square"]')
    expect(squareContainer).toBeNull()
  })

  it('should fall back to square when dimensions are null', () => {
    render(
      <ListingCard
        listing={{
          ...baseListing,
          primaryImageWidth: null,
          primaryImageHeight: null,
        }}
        artistName="Abbey Peters"
      />
    )

    const card = screen.getByTestId('listing-card')
    const imageContainer = card.querySelector('[class*="aspect-square"]')
    expect(imageContainer).toBeTruthy()
  })

  it('should show no image placeholder when primaryImageUrl is null', () => {
    render(
      <ListingCard
        listing={{ ...baseListing, primaryImageUrl: null }}
        artistName="Abbey Peters"
      />
    )

    expect(screen.getByText('No image')).toBeInTheDocument()
  })

  it('should link to listing detail page', () => {
    render(
      <ListingCard
        listing={baseListing}
        artistName="Abbey Peters"
      />
    )

    const link = screen.getByTestId('listing-card')
    expect(link).toHaveAttribute('href', `/listing/${baseListing.id}`)
  })

  it('should apply data-testid', () => {
    render(
      <ListingCard
        listing={baseListing}
        artistName="Abbey Peters"
      />
    )

    expect(screen.getByTestId('listing-card')).toBeInTheDocument()
  })
})
