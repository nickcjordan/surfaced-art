import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'

const mockTrackListingView = vi.fn()

vi.mock('@/lib/analytics', () => ({
  trackListingView: (...args: unknown[]) => mockTrackListingView(...args),
}))

import { ListingViewTracker } from '../ListingViewTracker'

describe('ListingViewTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call trackListingView on mount with provided props', () => {
    render(<ListingViewTracker listingId="abc-123" category="ceramics" />)
    expect(mockTrackListingView).toHaveBeenCalledWith('abc-123', 'ceramics')
  })

  it('should only fire once even if re-rendered', () => {
    const { rerender } = render(
      <ListingViewTracker listingId="abc-123" category="ceramics" />,
    )
    rerender(<ListingViewTracker listingId="abc-123" category="ceramics" />)
    expect(mockTrackListingView).toHaveBeenCalledTimes(1)
  })

  it('should render nothing', () => {
    const { container } = render(
      <ListingViewTracker listingId="abc-123" category="ceramics" />,
    )
    expect(container.innerHTML).toBe('')
  })
})
