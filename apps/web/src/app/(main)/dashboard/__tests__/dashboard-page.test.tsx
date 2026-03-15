import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import type { DashboardResponse } from '@surfaced-art/types'

// Mock the auth provider — mutable so tests can override
const mockAuth = {
  user: { email: 'artist@test.com', name: 'Test Artist' } as { email: string; name: string } | null,
  loading: false,
  isArtist: true,
  isAdmin: false,
  roles: ['artist'] as string[],
  hasRole: vi.fn((role: string) => role === 'artist'),
  signIn: vi.fn(),
  signUp: vi.fn(),
  confirmSignUp: vi.fn(),
  resendCode: vi.fn(),
  signOut: vi.fn(),
  forgotPassword: vi.fn(),
  confirmPassword: vi.fn(),
  getIdToken: vi.fn().mockResolvedValue('mock-token'),
  completeNewPassword: vi.fn(),
  completeMfa: vi.fn(),
  pendingChallenge: null,
}

vi.mock('@/lib/auth', () => ({
  useAuth: () => mockAuth,
}))

// Mock api
const mockGetDashboard = vi.fn()
const mockGetStripeStatus = vi.fn()
vi.mock('@/lib/api', () => ({
  getDashboard: (...args: unknown[]) => mockGetDashboard(...args),
  getStripeStatus: (...args: unknown[]) => mockGetStripeStatus(...args),
  initiateStripeOnboarding: vi.fn(),
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
    accentColor: null,
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
  mockAuth.user = { email: 'artist@test.com', name: 'Test Artist' }
  mockAuth.loading = false
  mockAuth.isArtist = true
  mockAuth.isAdmin = false
  mockAuth.hasRole = vi.fn((role: string) => role === 'artist')
  mockAuth.getIdToken = vi.fn().mockResolvedValue('mock-token')
  mockGetDashboard.mockResolvedValue(mockDashboardData)
  mockGetStripeStatus.mockResolvedValue({ status: 'not_started', stripeAccountId: null })
})

describe('DashboardPage', () => {
  it('should show loading skeleton when auth is loading', () => {
    mockAuth.loading = true

    render(<DashboardPage />)

    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument()
  })

  it('should render welcome header with user name', () => {
    render(<DashboardPage />)

    expect(screen.getByTestId('dashboard-welcome')).toBeInTheDocument()
    expect(screen.getByText('Welcome, Test Artist')).toBeInTheDocument()
  })

  it('should render ArtistOverview when user is an artist', async () => {
    render(<DashboardPage />)

    // ArtistOverview fetches data and renders — wait for it
    await waitFor(() => {
      expect(screen.getByTestId('artist-overview')).toBeInTheDocument()
    })
  })

  it('should show generic welcome card when user is not an artist', () => {
    mockAuth.isArtist = false
    mockAuth.hasRole = vi.fn((_role: string) => false) as typeof mockAuth.hasRole

    render(<DashboardPage />)

    expect(screen.getByTestId('generic-welcome')).toBeInTheDocument()
    expect(screen.getByText('Welcome to Surfaced Art')).toBeInTheDocument()
    expect(screen.queryByTestId('artist-overview')).not.toBeInTheDocument()
  })

  it('should show Browse Artists link for non-artist users', () => {
    mockAuth.isArtist = false
    mockAuth.hasRole = vi.fn((_role: string) => false) as typeof mockAuth.hasRole

    render(<DashboardPage />)

    expect(screen.getByRole('link', { name: /browse artists/i })).toHaveAttribute('href', '/artists')
    expect(screen.getByRole('link', { name: /account settings/i })).toHaveAttribute('href', '/dashboard/settings')
  })

  // Artist-specific tests that verify ArtistOverview content through DashboardPage
  it('should render profile completion card for artists', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('profile-completion')).toBeInTheDocument()
    })
    expect(screen.getByText('67% complete')).toBeInTheDocument()
  })

  it('should render stats grid for artists', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument()
    })

    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('Total Listings')).toBeInTheDocument()
  })

  it('should render action links for artists', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-actions')).toBeInTheDocument()
    })

    expect(screen.getByRole('link', { name: /edit profile/i })).toHaveAttribute('href', '/dashboard/profile')
    expect(screen.getByRole('link', { name: /manage listings/i })).toHaveAttribute('href', '/dashboard/listings')
  })

  it('should show error message when artist API call fails', async () => {
    mockGetDashboard.mockRejectedValue(new Error('Network error'))

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('artist-overview-error')).toBeInTheDocument()
    })

    expect(screen.getByText(/network error/i)).toBeInTheDocument()
  })

  it('should call getDashboard with the auth token for artists', async () => {
    mockAuth.getIdToken = vi.fn().mockResolvedValue('my-jwt-token')

    render(<DashboardPage />)

    await waitFor(() => {
      expect(mockGetDashboard).toHaveBeenCalledWith('my-jwt-token')
    })
  })
})
