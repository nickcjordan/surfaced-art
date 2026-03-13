import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Lightbox } from '../Lightbox'

const images = [
  { src: 'https://cdn.example.com/img1.jpg', alt: 'Image one' },
  { src: 'https://cdn.example.com/img2.jpg', alt: 'Image two' },
  { src: 'https://cdn.example.com/img3.jpg', alt: 'Image three' },
]

describe('Lightbox', () => {
  it('renders nothing when closed', () => {
    render(
      <Lightbox images={images} open={false} onOpenChange={vi.fn()} />
    )

    expect(screen.queryByTestId('lightbox')).not.toBeInTheDocument()
  })

  it('renders image with correct src and alt when open', () => {
    render(
      <Lightbox images={images} open={true} onOpenChange={vi.fn()} />
    )

    const img = screen.getByTestId('lightbox-image')
    expect(img).toHaveAttribute('src', images[0].src)
    expect(img).toHaveAttribute('alt', images[0].alt)
  })

  it('shows counter for multiple images', () => {
    render(
      <Lightbox images={images} open={true} onOpenChange={vi.fn()} />
    )

    expect(screen.getByTestId('lightbox-counter')).toHaveTextContent('1 of 3')
  })

  it('hides counter for single image', () => {
    render(
      <Lightbox images={[images[0]]} open={true} onOpenChange={vi.fn()} />
    )

    expect(screen.queryByTestId('lightbox-counter')).not.toBeInTheDocument()
  })

  it('hides prev/next buttons for single image', () => {
    render(
      <Lightbox images={[images[0]]} open={true} onOpenChange={vi.fn()} />
    )

    expect(screen.queryByTestId('lightbox-prev')).not.toBeInTheDocument()
    expect(screen.queryByTestId('lightbox-next')).not.toBeInTheDocument()
  })

  it('shows prev/next buttons for multiple images', () => {
    render(
      <Lightbox images={images} open={true} onOpenChange={vi.fn()} />
    )

    expect(screen.getByTestId('lightbox-prev')).toBeInTheDocument()
    expect(screen.getByTestId('lightbox-next')).toBeInTheDocument()
  })

  it('advances image when next button is clicked', () => {
    render(
      <Lightbox images={images} open={true} onOpenChange={vi.fn()} />
    )

    fireEvent.click(screen.getByTestId('lightbox-next'))

    expect(screen.getByTestId('lightbox-counter')).toHaveTextContent('2 of 3')
    expect(screen.getByTestId('lightbox-image')).toHaveAttribute('src', images[1].src)
  })

  it('goes to previous image when prev button is clicked', () => {
    render(
      <Lightbox images={images} open={true} initialIndex={1} onOpenChange={vi.fn()} />
    )

    fireEvent.click(screen.getByTestId('lightbox-prev'))

    expect(screen.getByTestId('lightbox-counter')).toHaveTextContent('1 of 3')
    expect(screen.getByTestId('lightbox-image')).toHaveAttribute('src', images[0].src)
  })

  it('wraps from last to first image', () => {
    render(
      <Lightbox images={images} open={true} initialIndex={2} onOpenChange={vi.fn()} />
    )

    fireEvent.click(screen.getByTestId('lightbox-next'))

    expect(screen.getByTestId('lightbox-counter')).toHaveTextContent('1 of 3')
  })

  it('wraps from first to last image', () => {
    render(
      <Lightbox images={images} open={true} onOpenChange={vi.fn()} />
    )

    fireEvent.click(screen.getByTestId('lightbox-prev'))

    expect(screen.getByTestId('lightbox-counter')).toHaveTextContent('3 of 3')
  })

  it('advances image with ArrowRight key', () => {
    render(
      <Lightbox images={images} open={true} onOpenChange={vi.fn()} />
    )

    fireEvent.keyDown(screen.getByTestId('lightbox'), { key: 'ArrowRight' })

    expect(screen.getByTestId('lightbox-counter')).toHaveTextContent('2 of 3')
  })

  it('goes back with ArrowLeft key', () => {
    render(
      <Lightbox images={images} open={true} initialIndex={2} onOpenChange={vi.fn()} />
    )

    fireEvent.keyDown(screen.getByTestId('lightbox'), { key: 'ArrowLeft' })

    expect(screen.getByTestId('lightbox-counter')).toHaveTextContent('2 of 3')
  })

  it('calls onOpenChange(false) when close button is clicked', () => {
    const onOpenChange = vi.fn()

    render(
      <Lightbox images={images} open={true} onOpenChange={onOpenChange} />
    )

    fireEvent.click(screen.getByTestId('lightbox-close'))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('closes when clicking empty space around the image', () => {
    const onOpenChange = vi.fn()

    render(
      <Lightbox images={images} open={true} onOpenChange={onOpenChange} />
    )

    // Click the lightbox backdrop (the content container itself)
    fireEvent.click(screen.getByTestId('lightbox'))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('does not close when clicking the image', () => {
    const onOpenChange = vi.fn()

    render(
      <Lightbox images={images} open={true} onOpenChange={onOpenChange} />
    )

    fireEvent.click(screen.getByTestId('lightbox-image'))

    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('initializes at the given initialIndex', () => {
    render(
      <Lightbox images={images} open={true} initialIndex={2} onOpenChange={vi.fn()} />
    )

    expect(screen.getByTestId('lightbox-counter')).toHaveTextContent('3 of 3')
    expect(screen.getByTestId('lightbox-image')).toHaveAttribute('src', images[2].src)
  })

  it('resets to initialIndex when reopened', () => {
    const { rerender } = render(
      <Lightbox images={images} open={true} initialIndex={0} onOpenChange={vi.fn()} />
    )

    // Navigate to image 2
    fireEvent.click(screen.getByTestId('lightbox-next'))
    expect(screen.getByTestId('lightbox-counter')).toHaveTextContent('2 of 3')

    // Close and reopen at index 2
    rerender(
      <Lightbox images={images} open={false} initialIndex={2} onOpenChange={vi.fn()} />
    )
    rerender(
      <Lightbox images={images} open={true} initialIndex={2} onOpenChange={vi.fn()} />
    )

    expect(screen.getByTestId('lightbox-counter')).toHaveTextContent('3 of 3')
  })
})
