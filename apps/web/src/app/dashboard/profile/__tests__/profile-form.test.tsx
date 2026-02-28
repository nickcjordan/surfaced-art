import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { DashboardResponse } from '@surfaced-art/types'

// Mock auth
const mockGetIdToken = vi.fn()
vi.mock('@/lib/auth', () => ({
  useAuth: () => ({
    user: { email: 'artist@test.com', name: 'Test Artist' },
    loading: false,
    getIdToken: mockGetIdToken,
  }),
}))

// Mock API
const mockGetDashboard = vi.fn()
const mockUpdateProfile = vi.fn()
const mockGetPresignedUrl = vi.fn()
vi.mock('@/lib/api', () => ({
  getDashboard: (...args: unknown[]) => mockGetDashboard(...args),
  updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
  getPresignedUrl: (...args: unknown[]) => mockGetPresignedUrl(...args),
  ApiError: class ApiError extends Error {
    constructor(public status: number, message: string) {
      super(message)
      this.name = 'ApiError'
    }
  },
}))

// Mock upload utilities
vi.mock('@/lib/upload', () => ({
  validateFile: vi.fn(),
  uploadToS3: vi.fn().mockResolvedValue(undefined),
  UploadError: class UploadError extends Error {
    code: string
    constructor(code: string, message: string) {
      super(message)
      this.name = 'UploadError'
      this.code = code
    }
  },
}))

import { ProfileForm } from '../components/profile-form'

const mockDashboardData: DashboardResponse = {
  profile: {
    id: 'artist-uuid-123',
    displayName: 'Test Artist',
    slug: 'test-artist',
    bio: 'A passionate artist.',
    location: 'Portland, OR',
    profileImageUrl: 'https://cdn.example.com/profile.jpg',
    coverImageUrl: 'https://cdn.example.com/cover.jpg',
    status: 'approved',
    stripeAccountId: null,
  },
  completion: {
    percentage: 100,
    fields: [],
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
  mockUpdateProfile.mockResolvedValue({
    id: 'artist-uuid-123',
    displayName: 'Test Artist',
    slug: 'test-artist',
    bio: 'Updated bio',
    location: 'Portland, OR',
    websiteUrl: null,
    instagramUrl: null,
    profileImageUrl: null,
    coverImageUrl: null,
    status: 'approved',
  })
})

describe('ProfileForm', () => {
  describe('rendering', () => {
    it('should render profile form with data-testid', async () => {
      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByTestId('profile-form')).toBeInTheDocument()
      })
    })

    it('should render bio textarea pre-filled with current value', async () => {
      render(<ProfileForm />)

      await waitFor(() => {
        const bioInput = screen.getByTestId('profile-bio')
        expect(bioInput).toHaveValue('A passionate artist.')
      })
    })

    it('should render location input pre-filled with current value', async () => {
      render(<ProfileForm />)

      await waitFor(() => {
        const locationInput = screen.getByTestId('profile-location')
        expect(locationInput).toHaveValue('Portland, OR')
      })
    })

    it('should render website and instagram URL inputs', async () => {
      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByTestId('profile-website')).toBeInTheDocument()
        expect(screen.getByTestId('profile-instagram')).toBeInTheDocument()
      })
    })

    it('should render image upload areas', async () => {
      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByTestId('profile-image-upload')).toBeInTheDocument()
        expect(screen.getByTestId('cover-image-upload')).toBeInTheDocument()
      })
    })

    it('should render save button', async () => {
      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByTestId('profile-save')).toBeInTheDocument()
      })
    })

    it('should show loading skeleton while fetching initial data', () => {
      mockGetDashboard.mockReturnValue(new Promise(() => {}))
      render(<ProfileForm />)

      expect(screen.getByTestId('profile-form-skeleton')).toBeInTheDocument()
    })
  })

  describe('submission', () => {
    it('should call updateProfile with only changed fields', async () => {
      const user = userEvent.setup()
      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByTestId('profile-bio')).toBeInTheDocument()
      })

      const bioInput = screen.getByTestId('profile-bio')
      await user.clear(bioInput)
      await user.type(bioInput, 'Updated bio text')

      await user.click(screen.getByTestId('profile-save'))

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith(
          'mock-token',
          expect.objectContaining({ bio: 'Updated bio text' })
        )
      })
    })

    it('should show success message after successful save', async () => {
      const user = userEvent.setup()
      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByTestId('profile-bio')).toBeInTheDocument()
      })

      const bioInput = screen.getByTestId('profile-bio')
      await user.clear(bioInput)
      await user.type(bioInput, 'Updated bio')

      await user.click(screen.getByTestId('profile-save'))

      await waitFor(() => {
        expect(screen.getByTestId('profile-success')).toBeInTheDocument()
      })
    })

    it('should show error message on API failure', async () => {
      mockUpdateProfile.mockRejectedValue(new Error('Server error'))

      const user = userEvent.setup()
      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByTestId('profile-bio')).toBeInTheDocument()
      })

      const bioInput = screen.getByTestId('profile-bio')
      await user.clear(bioInput)
      await user.type(bioInput, 'Updated bio')

      await user.click(screen.getByTestId('profile-save'))

      await waitFor(() => {
        expect(screen.getByTestId('profile-error')).toBeInTheDocument()
      })
    })

    it('should disable save button while submitting', async () => {
      mockUpdateProfile.mockImplementation(() => new Promise(() => {}))

      const user = userEvent.setup()
      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByTestId('profile-bio')).toBeInTheDocument()
      })

      const bioInput = screen.getByTestId('profile-bio')
      await user.clear(bioInput)
      await user.type(bioInput, 'Updated bio')

      await user.click(screen.getByTestId('profile-save'))

      await waitFor(() => {
        expect(screen.getByTestId('profile-save')).toBeDisabled()
      })
    })
  })

  describe('error handling', () => {
    it('should show error when dashboard fetch fails', async () => {
      mockGetDashboard.mockRejectedValue(new Error('Network error'))
      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByTestId('profile-error')).toBeInTheDocument()
      })
    })
  })
})
