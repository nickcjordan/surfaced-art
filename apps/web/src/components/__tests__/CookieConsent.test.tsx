import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockAccept = vi.fn()
const mockDecline = vi.fn()
let mockStatus: 'pending' | 'granted' | 'denied' = 'pending'

vi.mock('@/lib/analytics', () => ({
  useAnalyticsConsent: () => ({
    consentStatus: mockStatus,
    acceptAnalytics: mockAccept,
    declineAnalytics: mockDecline,
  }),
}))

import { CookieConsent } from '../CookieConsent'

describe('CookieConsent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStatus = 'pending'
  })

  it('should render the consent banner when status is "pending"', () => {
    render(<CookieConsent />)
    expect(screen.getByTestId('cookie-consent')).toBeInTheDocument()
    expect(screen.getByRole('region')).toHaveAttribute(
      'aria-label',
      'Cookie consent',
    )
  })

  it('should not render when status is "granted"', () => {
    mockStatus = 'granted'
    render(<CookieConsent />)
    expect(screen.queryByTestId('cookie-consent')).not.toBeInTheDocument()
  })

  it('should not render when status is "denied"', () => {
    mockStatus = 'denied'
    render(<CookieConsent />)
    expect(screen.queryByTestId('cookie-consent')).not.toBeInTheDocument()
  })

  it('should call acceptAnalytics when Accept is clicked', async () => {
    const user = userEvent.setup()
    render(<CookieConsent />)
    await user.click(screen.getByTestId('cookie-accept'))
    expect(mockAccept).toHaveBeenCalledOnce()
  })

  it('should call declineAnalytics when Decline is clicked', async () => {
    const user = userEvent.setup()
    render(<CookieConsent />)
    await user.click(screen.getByTestId('cookie-decline'))
    expect(mockDecline).toHaveBeenCalledOnce()
  })

  it('should have correct data-testid attributes', () => {
    render(<CookieConsent />)
    expect(screen.getByTestId('cookie-consent')).toBeInTheDocument()
    expect(screen.getByTestId('cookie-accept')).toBeInTheDocument()
    expect(screen.getByTestId('cookie-decline')).toBeInTheDocument()
  })
})
