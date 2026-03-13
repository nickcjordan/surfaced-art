import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Control pathname per test
let mockPathname = '/dashboard'

vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<typeof import('next/navigation')>('next/navigation')
  return {
    ...actual,
    usePathname: () => mockPathname,
  }
})

// Control auth per test
const mockAuth = {
  user: { email: 'user@test.com', name: 'Test User' },
  loading: false,
  roles: [] as string[],
  isAdmin: false,
  isArtist: false,
  hasRole: vi.fn((role: string) => false),
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

import { DashboardSidebar } from '../components/dashboard-sidebar'

beforeEach(() => {
  mockPathname = '/dashboard'
  vi.clearAllMocks()
  mockAuth.hasRole = vi.fn(() => false)
  mockAuth.isArtist = false
})

describe('DashboardSidebar', () => {
  it('should render with data-testid', () => {
    render(<DashboardSidebar />)
    expect(screen.getByTestId('dashboard-sidebar')).toBeInTheDocument()
  })

  describe('General section (all users)', () => {
    it('should always show Dashboard and Settings links', () => {
      render(<DashboardSidebar />)

      expect(screen.getByTestId('sidebar-dashboard')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar-settings')).toBeInTheDocument()
    })

    it('should have correct hrefs for general items', () => {
      render(<DashboardSidebar />)

      expect(screen.getByTestId('sidebar-dashboard')).toHaveAttribute('href', '/dashboard')
      expect(screen.getByTestId('sidebar-settings')).toHaveAttribute('href', '/dashboard/settings')
    })
  })

  describe('Artist section (artist role only)', () => {
    it('should not show artist items when user lacks artist role', () => {
      mockAuth.hasRole = vi.fn(() => false)

      render(<DashboardSidebar />)

      expect(screen.queryByTestId('sidebar-profile')).not.toBeInTheDocument()
      expect(screen.queryByTestId('sidebar-listings')).not.toBeInTheDocument()
    })

    it('should show artist items when user has artist role', () => {
      mockAuth.hasRole = vi.fn((role: string) => role === 'artist')

      render(<DashboardSidebar />)

      expect(screen.getByTestId('sidebar-profile')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar-listings')).toBeInTheDocument()
    })

    it('should have correct hrefs for artist items', () => {
      mockAuth.hasRole = vi.fn((role: string) => role === 'artist')

      render(<DashboardSidebar />)

      expect(screen.getByTestId('sidebar-profile')).toHaveAttribute('href', '/dashboard/profile')
      expect(screen.getByTestId('sidebar-listings')).toHaveAttribute('href', '/dashboard/listings')
    })

    it('should show section header for artist section', () => {
      mockAuth.hasRole = vi.fn((role: string) => role === 'artist')

      render(<DashboardSidebar />)

      expect(screen.getByText('Artist')).toBeInTheDocument()
    })
  })

  describe('Section headers', () => {
    it('should show General section header', () => {
      render(<DashboardSidebar />)

      expect(screen.getByText('General')).toBeInTheDocument()
    })

    it('should not show Artist section header when user lacks artist role', () => {
      mockAuth.hasRole = vi.fn(() => false)

      render(<DashboardSidebar />)

      expect(screen.queryByText('Artist')).not.toBeInTheDocument()
    })
  })

  describe('Active state highlighting', () => {
    it('should highlight Dashboard when on /dashboard', () => {
      mockPathname = '/dashboard'
      render(<DashboardSidebar />)

      const dashboardLink = screen.getByTestId('sidebar-dashboard')
      expect(dashboardLink.className).toContain('bg-accent-primary')
    })

    it('should highlight Settings when on /dashboard/settings', () => {
      mockPathname = '/dashboard/settings'
      render(<DashboardSidebar />)

      const settingsLink = screen.getByTestId('sidebar-settings')
      expect(settingsLink.className).toContain('bg-accent-primary')

      const dashboardLink = screen.getByTestId('sidebar-dashboard')
      expect(dashboardLink.className).not.toContain('bg-accent-primary')
    })

    it('should highlight Profile when on /dashboard/profile', () => {
      mockPathname = '/dashboard/profile'
      mockAuth.hasRole = vi.fn((role: string) => role === 'artist')

      render(<DashboardSidebar />)

      const profileLink = screen.getByTestId('sidebar-profile')
      expect(profileLink.className).toContain('bg-accent-primary')

      const dashboardLink = screen.getByTestId('sidebar-dashboard')
      expect(dashboardLink.className).not.toContain('bg-accent-primary')
    })
  })
})
