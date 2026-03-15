import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShareButton } from '../ShareButton'

describe('ShareButton', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should render with share label', () => {
    render(<ShareButton url="https://surfaced.art/jane" title="Jane — Surfaced Art" />)
    expect(screen.getByTestId('share-button')).toBeInTheDocument()
    expect(screen.getByLabelText('Share this page')).toBeInTheDocument()
  })

  it('should copy URL to clipboard on click when share API is not available', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)

    Object.defineProperty(navigator, 'share', { value: undefined, writable: true, configurable: true })
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    })

    render(<ShareButton url="https://surfaced.art/jane" title="Jane — Surfaced Art" />)
    await user.click(screen.getByTestId('share-button'))

    expect(writeText).toHaveBeenCalledWith('https://surfaced.art/jane')
  })

  it('should show "Copied!" feedback after copying', async () => {
    const user = userEvent.setup()

    Object.defineProperty(navigator, 'share', { value: undefined, writable: true, configurable: true })
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    })

    render(<ShareButton url="https://surfaced.art/jane" title="Jane — Surfaced Art" />)
    await user.click(screen.getByTestId('share-button'))

    expect(screen.getByLabelText('Link copied')).toBeInTheDocument()
  })

  it('should use native share API when available', async () => {
    const user = userEvent.setup()
    const shareFn = vi.fn().mockResolvedValue(undefined)

    Object.defineProperty(navigator, 'share', { value: shareFn, writable: true, configurable: true })

    render(<ShareButton url="https://surfaced.art/jane" title="Jane — Surfaced Art" />)
    await user.click(screen.getByTestId('share-button'))

    expect(shareFn).toHaveBeenCalledWith({
      title: 'Jane — Surfaced Art',
      url: 'https://surfaced.art/jane',
    })
  })

  it('should fall back to clipboard when native share is cancelled', async () => {
    const user = userEvent.setup()
    const shareFn = vi.fn().mockRejectedValue(new Error('Share cancelled'))
    const writeText = vi.fn().mockResolvedValue(undefined)

    Object.defineProperty(navigator, 'share', { value: shareFn, writable: true, configurable: true })
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    })

    render(<ShareButton url="https://surfaced.art/jane" title="Jane — Surfaced Art" />)
    await user.click(screen.getByTestId('share-button'))

    expect(writeText).toHaveBeenCalledWith('https://surfaced.art/jane')
  })
})
