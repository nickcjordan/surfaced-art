import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockAuth = {
  user: null as { email: string; name: string } | null,
  loading: false,
  isArtist: false,
  isAdmin: false,
  roles: [] as string[],
  hasRole: vi.fn(() => false),
  signIn: vi.fn(),
  signUp: vi.fn(),
  confirmSignUp: vi.fn(),
  resendCode: vi.fn(),
  signOut: vi.fn(),
  forgotPassword: vi.fn(),
  confirmPassword: vi.fn(),
  getIdToken: vi.fn(),
  completeNewPassword: vi.fn(),
  completeMfa: vi.fn(),
  pendingChallenge: null,
}

vi.mock('@/lib/auth', () => ({
  useAuth: () => mockAuth,
}))

import { AuthButton } from '../AuthButton'

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.user = null
  mockAuth.loading = false
  mockAuth.isArtist = false
  mockAuth.isAdmin = false
})

describe('AuthButton', () => {
  it('should show loading placeholder while auth is loading', () => {
    mockAuth.loading = true
    render(<AuthButton />)
    expect(screen.getByTestId('auth-loading')).toBeInTheDocument()
  })

  it('should show sign-in button when not authenticated', () => {
    render(<AuthButton />)
    const link = screen.getByTestId('sign-in-button')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/sign-in')
  })

  it('should show user menu trigger when authenticated', () => {
    mockAuth.user = { email: 'user@test.com', name: 'Test User' }
    render(<AuthButton />)
    expect(screen.getByTestId('user-menu')).toBeInTheDocument()
  })

  describe('dropdown menu items', () => {
    it('should show user name label in dropdown', async () => {
      mockAuth.user = { email: 'buyer@test.com', name: 'Test Buyer' }
      const user = userEvent.setup()

      render(<AuthButton />)
      await user.click(screen.getByTestId('user-menu-trigger'))

      const nameLabel = screen.getByTestId('menu-user-name')
      expect(nameLabel).toBeInTheDocument()
      expect(nameLabel).toHaveTextContent('Test Buyer')
    })

    it('should fall back to email when name is missing', async () => {
      mockAuth.user = { email: 'buyer@test.com', name: '' }
      const user = userEvent.setup()

      render(<AuthButton />)
      await user.click(screen.getByTestId('user-menu-trigger'))

      expect(screen.getByTestId('menu-user-name')).toHaveTextContent('buyer@test.com')
    })

    it('should show Settings and Sign Out for all authenticated users', async () => {
      mockAuth.user = { email: 'buyer@test.com', name: 'Test Buyer' }
      const user = userEvent.setup()

      render(<AuthButton />)
      await user.click(screen.getByTestId('user-menu-trigger'))

      expect(screen.getByTestId('menu-settings')).toBeInTheDocument()
      expect(screen.getByTestId('menu-sign-out')).toBeInTheDocument()
    })

    it('should not show artist or admin items in dropdown (moved to top-level nav)', async () => {
      mockAuth.user = { email: 'both@test.com', name: 'Both Roles' }
      mockAuth.isArtist = true
      mockAuth.isAdmin = true
      const user = userEvent.setup()

      render(<AuthButton />)
      await user.click(screen.getByTestId('user-menu-trigger'))

      expect(screen.queryByTestId('menu-artist-profile')).not.toBeInTheDocument()
      expect(screen.queryByTestId('menu-manage-listings')).not.toBeInTheDocument()
      expect(screen.queryByTestId('menu-admin')).not.toBeInTheDocument()
      expect(screen.queryByTestId('menu-dashboard')).not.toBeInTheDocument()
    })

    it('should call signOut when sign out is clicked', async () => {
      mockAuth.user = { email: 'user@test.com', name: 'Test User' }
      const user = userEvent.setup()

      render(<AuthButton />)
      await user.click(screen.getByTestId('user-menu-trigger'))
      await user.click(screen.getByTestId('menu-sign-out'))

      expect(mockAuth.signOut).toHaveBeenCalled()
    })
  })
})
