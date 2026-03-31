import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Header } from '../Header'
import { CATEGORIES } from '@/lib/categories'

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

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.user = null
    mockAuth.isArtist = false
    mockAuth.isAdmin = false
  })

  it('should render the Surfaced Art brand wordmark', () => {
    render(<Header />)
    expect(screen.getByRole('link', { name: /surfaced art/i })).toBeInTheDocument()
  })

  it('should have a link to the home page from the brand name', () => {
    render(<Header />)
    const homeLink = screen.getByRole('link', { name: /surfaced art/i })
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('should render the header as a banner landmark', () => {
    render(<Header />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('should render category navigation', () => {
    render(<Header />)
    const nav = screen.getByRole('navigation', {
      name: 'Category navigation',
    })
    expect(nav).toBeInTheDocument()
  })

  it('should render all 9 category links in the navigation', () => {
    render(<Header />)
    for (const category of CATEGORIES) {
      const links = screen.getAllByRole('link', { name: category.label })
      // At least one link for this category exists (desktop nav has it)
      expect(links.length).toBeGreaterThanOrEqual(1)
      const hasCorrectHref = links.some(
        (link) => link.getAttribute('href') === category.href
      )
      expect(hasCorrectHref).toBe(true)
    }
  })

  it('should render a mobile menu button for small screens', () => {
    render(<Header />)
    const menuButton = screen.getByRole('button', { name: 'Menu' })
    expect(menuButton).toBeInTheDocument()
  })

  it('should render a search toggle button', () => {
    render(<Header />)
    expect(screen.getByTestId('search-toggle')).toBeInTheDocument()
  })

  describe('For Artists link (logged out)', () => {
    it('should render a For Artists link when not logged in', () => {
      render(<Header />)
      const link = screen.getByRole('link', { name: /for artists/i })
      expect(link).toHaveAttribute('href', '/for-artists')
    })
  })

  describe('logged-in navigation', () => {
    it('should hide For Artists link when logged in', () => {
      mockAuth.user = { email: 'user@test.com', name: 'Test User' }
      render(<Header />)
      expect(screen.queryByRole('link', { name: /for artists/i })).not.toBeInTheDocument()
    })

    it('should show Studio link for artists', () => {
      mockAuth.user = { email: 'artist@test.com', name: 'Test Artist' }
      mockAuth.isArtist = true
      render(<Header />)
      const link = screen.getByTestId('nav-studio')
      expect(link).toHaveAttribute('href', '/dashboard')
    })

    it('should not show Studio link for non-artists', () => {
      mockAuth.user = { email: 'buyer@test.com', name: 'Test Buyer' }
      render(<Header />)
      expect(screen.queryByTestId('nav-studio')).not.toBeInTheDocument()
    })

    it('should show Admin link for admins', () => {
      mockAuth.user = { email: 'admin@test.com', name: 'Admin' }
      mockAuth.isAdmin = true
      render(<Header />)
      const link = screen.getByTestId('nav-admin')
      expect(link).toHaveAttribute('href', '/admin')
    })

    it('should not show Admin link for non-admins', () => {
      mockAuth.user = { email: 'buyer@test.com', name: 'Test Buyer' }
      render(<Header />)
      expect(screen.queryByTestId('nav-admin')).not.toBeInTheDocument()
    })

    it('should show both Studio and Admin for admin+artist users', () => {
      mockAuth.user = { email: 'both@test.com', name: 'Both Roles' }
      mockAuth.isArtist = true
      mockAuth.isAdmin = true
      render(<Header />)
      expect(screen.getByTestId('nav-studio')).toBeInTheDocument()
      expect(screen.getByTestId('nav-admin')).toBeInTheDocument()
    })
  })
})
