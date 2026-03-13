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
    it('should show Dashboard and Settings for all authenticated users', async () => {
      mockAuth.user = { email: 'buyer@test.com', name: 'Test Buyer' }
      const user = userEvent.setup()

      render(<AuthButton />)
      await user.click(screen.getByTestId('user-menu-trigger'))

      expect(screen.getByTestId('menu-dashboard')).toBeInTheDocument()
      expect(screen.getByTestId('menu-settings')).toBeInTheDocument()
      expect(screen.getByTestId('menu-sign-out')).toBeInTheDocument()
    })

    it('should show artist items when user has artist role', async () => {
      mockAuth.user = { email: 'artist@test.com', name: 'Test Artist' }
      mockAuth.isArtist = true
      const user = userEvent.setup()

      render(<AuthButton />)
      await user.click(screen.getByTestId('user-menu-trigger'))

      expect(screen.getByTestId('menu-artist-profile')).toBeInTheDocument()
      expect(screen.getByTestId('menu-manage-listings')).toBeInTheDocument()
    })

    it('should not show artist items when user lacks artist role', async () => {
      mockAuth.user = { email: 'buyer@test.com', name: 'Test Buyer' }
      mockAuth.isArtist = false
      const user = userEvent.setup()

      render(<AuthButton />)
      await user.click(screen.getByTestId('user-menu-trigger'))

      expect(screen.queryByTestId('menu-artist-profile')).not.toBeInTheDocument()
      expect(screen.queryByTestId('menu-manage-listings')).not.toBeInTheDocument()
    })

    it('should show admin link when user has admin role', async () => {
      mockAuth.user = { email: 'admin@test.com', name: 'Admin User' }
      mockAuth.isAdmin = true
      const user = userEvent.setup()

      render(<AuthButton />)
      await user.click(screen.getByTestId('user-menu-trigger'))

      expect(screen.getByTestId('menu-admin')).toBeInTheDocument()
    })

    it('should not show admin link when user lacks admin role', async () => {
      mockAuth.user = { email: 'buyer@test.com', name: 'Test Buyer' }
      mockAuth.isAdmin = false
      const user = userEvent.setup()

      render(<AuthButton />)
      await user.click(screen.getByTestId('user-menu-trigger'))

      expect(screen.queryByTestId('menu-admin')).not.toBeInTheDocument()
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
