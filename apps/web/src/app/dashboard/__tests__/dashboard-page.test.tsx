import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { DashboardResponse } from '@surfaced-art/types'

// Mock the auth provider
const mockGetIdToken = vi.fn()
const mockAuth = {
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
}

vi.mock('@/lib/auth', () => ({
  useAuth: () => mockAuth,
}))

// Mock api
const mockGetDashboard = vi.fn()
vi.mock('@/lib/api', () => ({
  getDashboard: (...args: unknown[]) => mockGetDashboard(...args),
  ApiError: class ApiError extends Error {
    constructor(public status: number, message: string) {
      super(message)
      this.name = 'ApiError'
    }
  },
}))

import DashboardPage from '../page'

const mockDashboardData: DashboardResponse = {
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
      { label: 'Profile image', complete: true },
      { label: 'Cover image', complete: true },
      { label: 'At least 1 category', complete: false },
      { label: 'At least 1 CV entry', complete: false },
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
  mockGetDashboard.mockResolvedValue(mockDashboardData)
})

describe('DashboardPage', () => {
  it('should show loading skeleton initially', () => {
    // Never resolve — keeps in loading state
    mockGetDashboard.mockReturnValue(new Promise(() => {}))

    render(<DashboardPage />)

    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument()
  })

  it('should render welcome header with artist name', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-welcome')).toBeInTheDocument()
    })
    expect(screen.getByText('Welcome, Test Artist')).toBeInTheDocument()
  })

  it('should render profile completion card with percentage', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('profile-completion')).toBeInTheDocument()
    })
    expect(screen.getByText('67% complete')).toBeInTheDocument()
  })

  it('should render completion field checklist', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('profile-completion')).toBeInTheDocument()
    })

    expect(screen.getByText('Bio')).toBeInTheDocument()
    expect(screen.getByText('Location')).toBeInTheDocument()
    expect(screen.getByText('At least 1 category')).toBeInTheDocument()
    expect(screen.getByText('At least 1 CV entry')).toBeInTheDocument()
  })

  it('should show "Complete your profile" link when completion < 100%', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('profile-completion')).toBeInTheDocument()
    })

    const link = screen.getByRole('link', { name: /complete your profile/i })
    expect(link).toHaveAttribute('href', '/dashboard/profile')
  })

  it('should not show "Complete your profile" when completion is 100%', async () => {
    const fullData = {
      ...mockDashboardData,
      completion: {
        percentage: 100,
        fields: mockDashboardData.completion.fields.map((f) => ({ ...f, complete: true })),
      },
    }
    mockGetDashboard.mockResolvedValue(fullData)

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('profile-completion')).toBeInTheDocument()
    })

    expect(screen.queryByRole('link', { name: /complete your profile/i })).not.toBeInTheDocument()
  })

  it('should render stats grid with correct values', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument()
    })

    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('Total Listings')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Available')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Sold')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('Total Views')).toBeInTheDocument()
  })

  it('should show Stripe CTA when stripeAccountId is null', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('stripe-cta')).toBeInTheDocument()
    })

    expect(screen.getByText('Set Up Payments')).toBeInTheDocument()
  })

  it('should not show Stripe CTA when stripeAccountId is set', async () => {
    const dataWithStripe = {
      ...mockDashboardData,
      profile: { ...mockDashboardData.profile, stripeAccountId: 'acct_123' },
    }
    mockGetDashboard.mockResolvedValue(dataWithStripe)

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('stripe-cta')).not.toBeInTheDocument()
  })

  it('should render action links', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-actions')).toBeInTheDocument()
    })

    expect(screen.getByRole('link', { name: /edit profile/i })).toHaveAttribute('href', '/dashboard/profile')
    expect(screen.getByRole('link', { name: /manage listings/i })).toHaveAttribute('href', '/dashboard/listings')
    expect(screen.getByRole('link', { name: /view public profile/i })).toHaveAttribute('href', '/artist/test-artist')
  })

  it('should show error message when API call fails', async () => {
    mockGetDashboard.mockRejectedValue(new Error('Network error'))

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-error')).toBeInTheDocument()
    })

    expect(screen.getByText(/network error/i)).toBeInTheDocument()
  })

  it('should show not authorized message on 403', async () => {
    const error = new Error('API request failed: Forbidden')
    Object.assign(error, { name: 'ApiError', status: 403 })
    mockGetDashboard.mockRejectedValue(error)

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-error')).toBeInTheDocument()
    })

    expect(screen.getByText(/do not have artist access/i)).toBeInTheDocument()
  })

  it('should show retry button on error', async () => {
    mockGetDashboard.mockRejectedValueOnce(new Error('Temporary failure'))
    mockGetDashboard.mockResolvedValueOnce(mockDashboardData)

    const user = userEvent.setup()
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-error')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /try again/i }))

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument()
    })
  })

  it('should call getDashboard with the auth token', async () => {
    mockGetIdToken.mockResolvedValue('my-jwt-token')

    render(<DashboardPage />)

    await waitFor(() => {
      expect(mockGetDashboard).toHaveBeenCalledWith('my-jwt-token')
    })
  })
})
