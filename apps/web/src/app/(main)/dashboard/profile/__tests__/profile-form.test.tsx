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
const mockUpdateCategories = vi.fn()
const mockGetPresignedUrl = vi.fn()
vi.mock('@/lib/api', () => ({
  getDashboard: (...args: unknown[]) => mockGetDashboard(...args),
  updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
  updateCategories: (...args: unknown[]) => mockUpdateCategories(...args),
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
    websiteUrl: 'https://testartist.com',
    instagramUrl: null,
    profileImageUrl: 'https://cdn.example.com/profile.jpg',
    coverImageUrl: 'https://cdn.example.com/cover.jpg',
    status: 'approved',
    stripeAccountId: null,
    categories: ['ceramics', 'painting'],
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
  mockUpdateCategories.mockResolvedValue({
    categories: ['ceramics', 'painting'],
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

  describe('category section', () => {
    it('should render all 9 category buttons', async () => {
      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByTestId('profile-categories')).toBeInTheDocument()
      })

      expect(screen.getByRole('button', { name: /ceramics/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /painting/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /print/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /jewelry/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /illustration/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /photography/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /woodworking/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /fibers/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /mixed media/i })).toBeInTheDocument()
    })

    it('should pre-select categories from dashboard data', async () => {
      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByTestId('profile-categories')).toBeInTheDocument()
      })

      // ceramics and painting should be visually selected (have aria-pressed=true)
      expect(screen.getByRole('button', { name: /ceramics/i })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByRole('button', { name: /painting/i })).toHaveAttribute('aria-pressed', 'true')
      // jewelry should not be selected
      expect(screen.getByRole('button', { name: /jewelry/i })).toHaveAttribute('aria-pressed', 'false')
    })

    it('should toggle category selection on click', async () => {
      const user = userEvent.setup()
      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByTestId('profile-categories')).toBeInTheDocument()
      })

      const jewelryButton = screen.getByRole('button', { name: /jewelry/i })
      expect(jewelryButton).toHaveAttribute('aria-pressed', 'false')

      await user.click(jewelryButton)
      expect(jewelryButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('should call updateCategories when categories are saved', async () => {
      const user = userEvent.setup()
      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByTestId('profile-categories')).toBeInTheDocument()
      })

      // Add jewelry to the existing ceramics + painting
      await user.click(screen.getByRole('button', { name: /jewelry/i }))
      await user.click(screen.getByTestId('profile-save'))

      await waitFor(() => {
        expect(mockUpdateCategories).toHaveBeenCalledWith(
          'mock-token',
          expect.arrayContaining(['ceramics', 'painting', 'jewelry'])
        )
      })
    })

    it('should not call updateCategories when categories have not changed', async () => {
      const user = userEvent.setup()
      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByTestId('profile-bio')).toBeInTheDocument()
      })

      // Only change bio, not categories
      const bioInput = screen.getByTestId('profile-bio')
      await user.clear(bioInput)
      await user.type(bioInput, 'New bio')

      await user.click(screen.getByTestId('profile-save'))

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalled()
      })

      expect(mockUpdateCategories).not.toHaveBeenCalled()
    })

    it('should show error when trying to save with no categories selected', async () => {
      const user = userEvent.setup()
      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByTestId('profile-categories')).toBeInTheDocument()
      })

      // Deselect both ceramics and painting
      await user.click(screen.getByRole('button', { name: /ceramics/i }))
      await user.click(screen.getByRole('button', { name: /painting/i }))

      await user.click(screen.getByTestId('profile-save'))

      await waitFor(() => {
        expect(screen.getByTestId('profile-error')).toBeInTheDocument()
      })

      // Should NOT call API
      expect(mockUpdateCategories).not.toHaveBeenCalled()
    })
  })
})
