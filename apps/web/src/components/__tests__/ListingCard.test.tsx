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

  it('should clamp extreme portrait aspect ratios to max 2:3', () => {
    render(
      <ListingCard
        listing={{
          ...baseListing,
          // Extreme portrait: 200px wide × 1200px tall (1:6 ratio)
          primaryImageWidth: 200,
          primaryImageHeight: 1200,
        }}
        artistName="Abbey Peters"
      />
    )

    const card = screen.getByTestId('listing-card')
    const imageContainer = card.querySelector('[class*="overflow-hidden"]') as HTMLElement
    // Should be clamped to 2/3 (max portrait), not the natural 200/1200
    expect(imageContainer?.style.aspectRatio).toBe('2 / 3')
  })

  it('should not clamp moderate portrait aspect ratios', () => {
    render(
      <ListingCard
        listing={{
          ...baseListing,
          // Normal portrait: 800px wide × 1000px tall (4:5 ratio)
          primaryImageWidth: 800,
          primaryImageHeight: 1000,
        }}
        artistName="Abbey Peters"
      />
    )

    const card = screen.getByTestId('listing-card')
    const imageContainer = card.querySelector('[class*="overflow-hidden"]') as HTMLElement
    expect(imageContainer?.style.aspectRatio).toBe('800 / 1000')
  })

  it('should not clamp landscape aspect ratios', () => {
    render(
      <ListingCard
        listing={{
          ...baseListing,
          // Wide landscape: 1200px × 400px (3:1 ratio)
          primaryImageWidth: 1200,
          primaryImageHeight: 400,
        }}
        artistName="Abbey Peters"
      />
    )

    const card = screen.getByTestId('listing-card')
    const imageContainer = card.querySelector('[class*="overflow-hidden"]') as HTMLElement
    expect(imageContainer?.style.aspectRatio).toBe('1200 / 400')
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
