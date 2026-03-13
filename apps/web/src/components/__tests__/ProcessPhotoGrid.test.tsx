import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProcessPhotoGrid } from '../ProcessPhotoGrid'

const photos = [
  { id: 'p1', url: 'https://cdn.example.com/process1.jpg' },
  { id: 'p2', url: 'https://cdn.example.com/process2.jpg' },
  { id: 'p3', url: 'https://cdn.example.com/process3.jpg' },
]

describe('ProcessPhotoGrid', () => {
  it('renders the correct number of photos', () => {
    render(<ProcessPhotoGrid photos={photos} artistName="Test Artist" />)

    const photoButtons = screen.getAllByTestId('process-photo')
    expect(photoButtons).toHaveLength(3)
  })

  it('opens lightbox when a photo is clicked', () => {
    render(<ProcessPhotoGrid photos={photos} artistName="Test Artist" />)

    expect(screen.queryByTestId('lightbox')).not.toBeInTheDocument()

    fireEvent.click(screen.getAllByTestId('process-photo')[0])

    expect(screen.getByTestId('lightbox')).toBeInTheDocument()
  })

  it('opens lightbox at the correct index', () => {
    render(<ProcessPhotoGrid photos={photos} artistName="Test Artist" />)

    // Click the third photo
    fireEvent.click(screen.getAllByTestId('process-photo')[2])

    expect(screen.getByTestId('lightbox-counter')).toHaveTextContent('3 of 3')
    expect(screen.getByTestId('lightbox-image')).toHaveAttribute('src', photos[2].url)
  })
})
