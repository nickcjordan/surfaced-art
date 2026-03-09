import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { DashboardResponse } from '@surfaced-art/types'

// Mock the auth provider
const mockGetIdToken = vi.fn()
vi.mock('@/lib/auth', () => ({
  useAuth: () => ({
    user: { email: 'artist@test.com', name: 'Test Artist' },
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    confirmSignUp: vi.fn(),
    resendCode: vi.fn(),
    signOut: vi.fn(),
    forgotPassword: vi.fn(),
    confirmPassword: vi.fn(),
    getIdToken: mockGetIdToken,
  }),
}))

// Mock api
const mockGetDashboard = vi.fn()
const mockInitiateStripeOnboarding = vi.fn()
const mockGetStripeStatus = vi.fn()
vi.mock('@/lib/api', () => ({
  getDashboard: (...args: unknown[]) => mockGetDashboard(...args),
  initiateStripeOnboarding: (...args: unknown[]) => mockInitiateStripeOnboarding(...args),
  getStripeStatus: (...args: unknown[]) => mockGetStripeStatus(...args),
  ApiError: class ApiError extends Error {
    constructor(public status: number, message: string) {
      super(message)
      this.name = 'ApiError'
    }
  },
}))

import DashboardPage from '../page'

const baseDashboardData: DashboardResponse = {
  profile: {
    id: 'artist-uuid-123',
    displayName: 'Test Artist',
    slug: 'test-artist',
    bio: 'A passionate artist.',
    location: 'Portland, OR',
    websiteUrl: null,
    instagramUrl: null,
    profileImageUrl: 'https://cdn.example.com/profile.jpg',
    coverImageUrl: 'https://cdn.example.com/cover.jpg',
    status: 'approved',
    stripeAccountId: null,
    categories: ['ceramics'],
  },
  completion: {
    percentage: 67,
    fields: [
      { label: 'Bio', complete: true },
      { label: 'Location', complete: true },
    ],
  },
  stats: {
    totalListings: 5,
    availableListings: 3,
    soldListings: 2,
    totalViews: 0,
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetIdToken.mockResolvedValue('mock-token')
  mockGetDashboard.mockResolvedValue(baseDashboardData)
  mockGetStripeStatus.mockResolvedValue({ status: 'not_started', stripeAccountId: null })
})

describe('Stripe CTA on Dashboard', () => {
  it('should show "Connect Stripe" button when status is not_started', async () => {
    mockGetStripeStatus.mockResolvedValue({ status: 'not_started', stripeAccountId: null })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('stripe-cta')).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /connect stripe/i })).toBeInTheDocument()
  })

  it('should show "Continue Setup" button when status is pending', async () => {
    mockGetStripeStatus.mockResolvedValue({ status: 'pending', stripeAccountId: 'acct_123' })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('stripe-cta')).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /continue setup/i })).toBeInTheDocument()
  })

  it('should hide CTA when status is complete', async () => {
    mockGetDashboard.mockResolvedValue({
      ...baseDashboardData,
      profile: { ...baseDashboardData.profile, stripeAccountId: 'acct_123' },
    })
    mockGetStripeStatus.mockResolvedValue({ status: 'complete', stripeAccountId: 'acct_123' })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('stripe-cta')).not.toBeInTheDocument()
  })

  it('should call initiateStripeOnboarding on button click', async () => {
    const user = userEvent.setup()
    mockInitiateStripeOnboarding.mockResolvedValue({ url: 'https://connect.stripe.com/setup/test' })

    // Mock window.location.href assignment
    const locationHref = vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      href: '',
    } as Location)

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('stripe-cta')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /connect stripe/i }))

    await waitFor(() => {
      expect(mockInitiateStripeOnboarding).toHaveBeenCalledWith('mock-token')
    })

    locationHref.mockRestore()
  })

  it('should hide CTA when Stripe status fetch fails', async () => {
    mockGetStripeStatus.mockRejectedValue(new Error('Network error'))

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('stripe-cta')).not.toBeInTheDocument()
  })

  it('should show error when onboarding API call fails', async () => {
    const user = userEvent.setup()
    mockInitiateStripeOnboarding.mockRejectedValue(new Error('Network error'))

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('stripe-cta')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /connect stripe/i }))

    await waitFor(() => {
      expect(screen.getByText(/failed to start stripe setup/i)).toBeInTheDocument()
    })
  })
})
