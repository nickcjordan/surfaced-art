import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'

// Mock the analytics module
vi.mock('../analytics', () => ({
  getStoredConsent: vi.fn(() => 'pending' as const),
  grantConsent: vi.fn(),
  denyConsent: vi.fn(),
}))

import { getStoredConsent, grantConsent, denyConsent } from '../analytics'

const mockGetConsent = vi.mocked(getStoredConsent)
const mockGrantConsent = vi.mocked(grantConsent)
const mockDenyConsent = vi.mocked(denyConsent)

// Import after mocks are set up
import { ConsentProvider, useAnalyticsConsent } from '../posthog-provider'

function TestConsumer() {
  const { consentStatus, acceptAnalytics, declineAnalytics } =
    useAnalyticsConsent()
  return (
    <div>
      <span data-testid="status">{consentStatus}</span>
      <button onClick={acceptAnalytics}>Accept</button>
      <button onClick={declineAnalytics}>Decline</button>
    </div>
  )
}

function wrapper({ children }: { children: ReactNode }) {
  return <ConsentProvider>{children}</ConsentProvider>
}

describe('ConsentProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetConsent.mockReturnValue('pending')
  })

  it('should start with "pending" consent status', () => {
    render(
      <ConsentProvider>
        <TestConsumer />
      </ConsentProvider>,
    )
    expect(screen.getByTestId('status')).toHaveTextContent('pending')
  })

  it('should restore "granted" consent from storage on mount', () => {
    mockGetConsent.mockReturnValue('granted')
    render(
      <ConsentProvider>
        <TestConsumer />
      </ConsentProvider>,
    )
    expect(screen.getByTestId('status')).toHaveTextContent('granted')
    expect(grantConsent).toHaveBeenCalled()
  })

  it('should restore "denied" consent from storage on mount', () => {
    mockGetConsent.mockReturnValue('denied')
    render(
      <ConsentProvider>
        <TestConsumer />
      </ConsentProvider>,
    )
    expect(screen.getByTestId('status')).toHaveTextContent('denied')
    expect(denyConsent).toHaveBeenCalled()
  })

  it('acceptAnalytics should update status to "granted" and call grantConsent', async () => {
    const user = userEvent.setup()
    render(
      <ConsentProvider>
        <TestConsumer />
      </ConsentProvider>,
    )

    await user.click(screen.getByText('Accept'))
    expect(screen.getByTestId('status')).toHaveTextContent('granted')
    expect(mockGrantConsent).toHaveBeenCalled()
  })

  it('declineAnalytics should update status to "denied" and call denyConsent', async () => {
    const user = userEvent.setup()
    render(
      <ConsentProvider>
        <TestConsumer />
      </ConsentProvider>,
    )

    await user.click(screen.getByText('Decline'))
    expect(screen.getByTestId('status')).toHaveTextContent('denied')
    expect(mockDenyConsent).toHaveBeenCalled()
  })
})

describe('useAnalyticsConsent', () => {
  it('should throw when used outside ConsentProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => {
      renderHook(() => useAnalyticsConsent())
    }).toThrow('useAnalyticsConsent must be used within a ConsentProvider')
    spy.mockRestore()
  })

  it('should return context value when used inside ConsentProvider', () => {
    const { result } = renderHook(() => useAnalyticsConsent(), { wrapper })
    expect(result.current).toHaveProperty('consentStatus')
    expect(result.current).toHaveProperty('acceptAnalytics')
    expect(result.current).toHaveProperty('declineAnalytics')
  })
})
