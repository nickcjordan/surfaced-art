import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CATEGORIES } from '@/lib/categories'

let mockPathname = '/'

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}))

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

import { MobileNav } from '../MobileNav'

describe('MobileNav', () => {
  beforeEach(() => {
    mockPathname = '/'
    vi.clearAllMocks()
    mockAuth.user = null
    mockAuth.isArtist = false
    mockAuth.isAdmin = false
  })

  it('should render a menu button', () => {
    render(<MobileNav />)
    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument()
  })

  it('should render all 4 category links when opened', async () => {
    render(<MobileNav />)
    await userEvent.click(screen.getByRole('button', { name: 'Menu' }))

    for (const category of CATEGORIES) {
      expect(screen.getByRole('link', { name: category.label })).toBeInTheDocument()
    }
  })

  it('should highlight the active category', async () => {
    mockPathname = '/category/drawing_painting'
    render(<MobileNav />)
    await userEvent.click(screen.getByRole('button', { name: 'Menu' }))

    const activeLink = screen.getByRole('link', { name: 'Drawing & Painting' })
    expect(activeLink.className).toContain('text-accent-primary')
    expect(activeLink.className).toContain('font-medium')
  })

  it('should not highlight inactive categories', async () => {
    mockPathname = '/category/drawing_painting'
    render(<MobileNav />)
    await userEvent.click(screen.getByRole('button', { name: 'Menu' }))

    const inactiveLink = screen.getByRole('link', { name: 'Ceramics' })
    expect(inactiveLink.className).not.toContain('text-accent-primary')
    expect(inactiveLink.className).toContain('text-muted-foreground')
  })

  it('should add aria-current="page" to the active link', async () => {
    mockPathname = '/category/ceramics'
    render(<MobileNav />)
    await userEvent.click(screen.getByRole('button', { name: 'Menu' }))

    const activeLink = screen.getByRole('link', { name: 'Ceramics' })
    expect(activeLink).toHaveAttribute('aria-current', 'page')
  })

  it('should not add aria-current to inactive links', async () => {
    mockPathname = '/category/ceramics'
    render(<MobileNav />)
    await userEvent.click(screen.getByRole('button', { name: 'Menu' }))

    const inactiveLink = screen.getByRole('link', { name: 'Drawing & Painting' })
    expect(inactiveLink).not.toHaveAttribute('aria-current')
  })

  it('should render a For Artists link when opened', async () => {
    render(<MobileNav />)
    await userEvent.click(screen.getByRole('button', { name: 'Menu' }))

    const link = screen.getByRole('link', { name: /for artists/i })
    expect(link).toHaveAttribute('href', '/for-artists')
  })

  describe('authenticated user links', () => {
    beforeEach(() => {
      mockAuth.user = { email: 'user@test.com', name: 'Test User' }
    })

    it('should show Dashboard and Settings links for authenticated users', async () => {
      render(<MobileNav />)
      await userEvent.click(screen.getByRole('button', { name: 'Menu' }))

      expect(screen.getByTestId('mobile-dashboard-link')).toBeInTheDocument()
      expect(screen.getByTestId('mobile-settings-link')).toBeInTheDocument()
      expect(screen.getByTestId('mobile-sign-out')).toBeInTheDocument()
    })

    it('should show Artist Profile link for artists', async () => {
      mockAuth.isArtist = true
      render(<MobileNav />)
      await userEvent.click(screen.getByRole('button', { name: 'Menu' }))

      expect(screen.getByTestId('mobile-artist-profile-link')).toBeInTheDocument()
    })

    it('should not show Artist Profile link for non-artists', async () => {
      mockAuth.isArtist = false
      render(<MobileNav />)
      await userEvent.click(screen.getByRole('button', { name: 'Menu' }))

      expect(screen.queryByTestId('mobile-artist-profile-link')).not.toBeInTheDocument()
    })

    it('should show Admin Panel link for admins', async () => {
      mockAuth.isAdmin = true
      render(<MobileNav />)
      await userEvent.click(screen.getByRole('button', { name: 'Menu' }))

      expect(screen.getByTestId('mobile-admin-link')).toBeInTheDocument()
    })

    it('should not show Admin Panel link for non-admins', async () => {
      mockAuth.isAdmin = false
      render(<MobileNav />)
      await userEvent.click(screen.getByRole('button', { name: 'Menu' }))

      expect(screen.queryByTestId('mobile-admin-link')).not.toBeInTheDocument()
    })

    it('should call signOut when Sign Out is clicked', async () => {
      render(<MobileNav />)
      await userEvent.click(screen.getByRole('button', { name: 'Menu' }))
      await userEvent.click(screen.getByTestId('mobile-sign-out'))

      expect(mockAuth.signOut).toHaveBeenCalled()
    })
  })

  describe('unauthenticated user', () => {
    it('should show Sign In link when not authenticated', async () => {
      mockAuth.user = null
      render(<MobileNav />)
      await userEvent.click(screen.getByRole('button', { name: 'Menu' }))

      expect(screen.getByTestId('mobile-sign-in-link')).toBeInTheDocument()
    })

    it('should not show account nav when not authenticated', async () => {
      mockAuth.user = null
      render(<MobileNav />)
      await userEvent.click(screen.getByRole('button', { name: 'Menu' }))

      expect(screen.queryByTestId('mobile-auth-nav')).not.toBeInTheDocument()
    })
  })
})
