import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'

const mockTrackArtistProfileView = vi.fn()

vi.mock('@/lib/analytics', () => ({
  trackArtistProfileView: (...args: unknown[]) =>
    mockTrackArtistProfileView(...args),
}))

import { ArtistProfileViewTracker } from '../ArtistProfileViewTracker'

describe('ArtistProfileViewTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call trackArtistProfileView on mount with provided slug', () => {
    render(<ArtistProfileViewTracker artistSlug="jane-doe" />)
    expect(mockTrackArtistProfileView).toHaveBeenCalledWith('jane-doe')
  })

  it('should only fire once even if re-rendered', () => {
    const { rerender } = render(
      <ArtistProfileViewTracker artistSlug="jane-doe" />,
    )
    rerender(<ArtistProfileViewTracker artistSlug="jane-doe" />)
    expect(mockTrackArtistProfileView).toHaveBeenCalledTimes(1)
  })

  it('should render nothing', () => {
    const { container } = render(
      <ArtistProfileViewTracker artistSlug="jane-doe" />,
    )
    expect(container.innerHTML).toBe('')
  })
})
