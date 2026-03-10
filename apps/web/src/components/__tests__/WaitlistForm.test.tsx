import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockJoinWaitlist = vi.fn()
const mockTrackWaitlistSignup = vi.fn()

vi.mock('@/lib/api', () => ({
  joinWaitlist: (...args: unknown[]) => mockJoinWaitlist(...args),
}))

vi.mock('@/lib/analytics', () => ({
  trackWaitlistSignup: () => mockTrackWaitlistSignup(),
}))

import { WaitlistForm } from '../WaitlistForm'

describe('WaitlistForm artist-aware messaging', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockJoinWaitlist.mockResolvedValue(undefined)
  })

  it('should show artist-aware CTA text when artistName is provided', () => {
    render(<WaitlistForm artistName="Jane Doe" />)
    expect(
      screen.getByText(/notify you when Jane Doe/i)
    ).toBeInTheDocument()
  })

  it('should show generic CTA text when no artistName is provided', () => {
    render(<WaitlistForm />)
    expect(
      screen.queryByText(/notify you when/i)
    ).not.toBeInTheDocument()
  })

  it('should pass context fields to joinWaitlist when provided', async () => {
    const user = userEvent.setup()
    render(
      <WaitlistForm
        artistName="Jane Doe"
        source="listing"
        artistId="artist-123"
        listingId="listing-456"
      />
    )

    await user.type(screen.getByTestId('waitlist-email-input'), 'fan@example.com')
    await user.click(screen.getByTestId('waitlist-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('waitlist-success')).toBeInTheDocument()
    })
    expect(mockJoinWaitlist).toHaveBeenCalledWith('fan@example.com', {
      source: 'listing',
      artistId: 'artist-123',
      listingId: 'listing-456',
    })
  })

  it('should call joinWaitlist without context when no props provided', async () => {
    const user = userEvent.setup()
    render(<WaitlistForm />)

    await user.type(screen.getByTestId('waitlist-email-input'), 'fan@example.com')
    await user.click(screen.getByTestId('waitlist-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('waitlist-success')).toBeInTheDocument()
    })
    expect(mockJoinWaitlist).toHaveBeenCalledWith('fan@example.com', undefined)
  })

  it('should show artist-aware success message when artistName is provided', async () => {
    const user = userEvent.setup()
    render(<WaitlistForm artistName="Jane Doe" />)

    await user.type(screen.getByTestId('waitlist-email-input'), 'fan@example.com')
    await user.click(screen.getByTestId('waitlist-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('waitlist-success')).toBeInTheDocument()
    })
    expect(screen.getByText(/Jane Doe/)).toBeInTheDocument()
  })
})

describe('WaitlistForm analytics tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockJoinWaitlist.mockResolvedValue(undefined)
  })

  it('should call trackWaitlistSignup after successful waitlist submission', async () => {
    const user = userEvent.setup()
    render(<WaitlistForm />)

    await user.type(screen.getByTestId('waitlist-email-input'), 'test@example.com')
    await user.click(screen.getByTestId('waitlist-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('waitlist-success')).toBeInTheDocument()
    })
    expect(mockTrackWaitlistSignup).toHaveBeenCalledOnce()
  })

  it('should NOT call trackWaitlistSignup on validation error', async () => {
    const user = userEvent.setup()
    render(<WaitlistForm />)

    // Submit with empty email
    await user.click(screen.getByTestId('waitlist-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('waitlist-error')).toBeInTheDocument()
    })
    expect(mockTrackWaitlistSignup).not.toHaveBeenCalled()
  })

  it('should NOT call trackWaitlistSignup on API error', async () => {
    mockJoinWaitlist.mockRejectedValue(new Error('Network error'))
    const user = userEvent.setup()
    render(<WaitlistForm />)

    await user.type(screen.getByTestId('waitlist-email-input'), 'test@example.com')
    await user.click(screen.getByTestId('waitlist-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('waitlist-error')).toBeInTheDocument()
    })
    expect(mockTrackWaitlistSignup).not.toHaveBeenCalled()
  })
})
