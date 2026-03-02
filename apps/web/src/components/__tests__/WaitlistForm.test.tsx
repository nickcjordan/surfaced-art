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
