import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ImageGallery } from '../ImageGallery'
import type { ListingImage } from '@surfaced-art/types'

const makeImage = (id: string, sortOrder: number): ListingImage => ({
  id,
  listingId: '11111111-1111-4111-8111-111111111111',
  url: `https://cdn.example.com/${id}.jpg`,
  isProcessPhoto: false,
  sortOrder,
  width: 800,
  height: 600,
  createdAt: new Date('2025-01-01'),
})

const images: ListingImage[] = [
  makeImage('img1', 0),
  makeImage('img2', 1),
  makeImage('img3', 2),
]

describe('ImageGallery', () => {
  it('opens lightbox when primary image is clicked', () => {
    render(<ImageGallery images={images} alt="Test artwork" />)

    expect(screen.queryByTestId('lightbox')).not.toBeInTheDocument()

    // Click the primary image area (the expand button)
    fireEvent.click(screen.getByTestId('image-gallery-expand'))

    expect(screen.getByTestId('lightbox')).toBeInTheDocument()
  })

  it('opens lightbox at the active thumbnail index', () => {
    render(<ImageGallery images={images} alt="Test artwork" />)

    // Click second thumbnail to make it active
    const thumbnails = screen.getAllByRole('tab')
    fireEvent.click(thumbnails[1])

    // Open lightbox
    fireEvent.click(screen.getByTestId('image-gallery-expand'))

    expect(screen.getByTestId('lightbox-counter')).toHaveTextContent('2 of 3')
  })

  it('shows expand icon on primary image', () => {
    render(<ImageGallery images={images} alt="Test artwork" />)

    expect(screen.getByTestId('image-gallery-expand')).toBeInTheDocument()
  })

  it('has cursor-zoom-in on primary image container', () => {
    render(<ImageGallery images={images} alt="Test artwork" />)

    const expandButton = screen.getByTestId('image-gallery-expand')
    expect(expandButton.className).toContain('cursor-zoom-in')
  })
})
