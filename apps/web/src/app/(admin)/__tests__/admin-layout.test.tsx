import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'
import { AdminGuard } from '@/components/admin/admin-guard'

// --- Mocks ---

let mockPathname = '/admin'

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}))

const mockAuth = {
  user: { email: 'admin@surfaced.art', name: 'Admin User' },
  loading: false,
  roles: ['admin', 'buyer'] as string[],
  isAdmin: true,
  isArtist: false,
  hasRole: vi.fn((role: string) => ['admin', 'buyer'].includes(role)),
  signIn: vi.fn(),
  signUp: vi.fn(),
  confirmSignUp: vi.fn(),
  resendCode: vi.fn(),
  signOut: vi.fn(),
  forgotPassword: vi.fn(),
  confirmPassword: vi.fn(),
  completeNewPassword: vi.fn(),
  completeMfa: vi.fn(),
  getIdToken: vi.fn(),
  pendingChallenge: null,
}

vi.mock('@/lib/auth', () => ({
  useAuth: () => mockAuth,
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockPathname = '/admin'
  mockAuth.user = { email: 'admin@surfaced.art', name: 'Admin User' }
  mockAuth.loading = false
  mockAuth.isAdmin = true
  mockAuth.roles = ['admin', 'buyer']
})

// --- Sidebar Tests ---

describe('AdminSidebar', () => {
  it('renders all navigation links', () => {
    render(<AdminSidebar />)

    expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('admin-sidebar-dashboard')).toHaveTextContent('Dashboard')
    expect(screen.getByTestId('admin-sidebar-applications')).toHaveTextContent('Applications')
    expect(screen.getByTestId('admin-sidebar-artists')).toHaveTextContent('Artists')
    expect(screen.getByTestId('admin-sidebar-listings')).toHaveTextContent('Listings')
    expect(screen.getByTestId('admin-sidebar-users')).toHaveTextContent('Users')
    expect(screen.getByTestId('admin-sidebar-waitlist')).toHaveTextContent('Waitlist')
    expect(screen.getByTestId('admin-sidebar-audit-log')).toHaveTextContent('Audit Log')
  })

  it('highlights the active link for /admin', () => {
    mockPathname = '/admin'
    render(<AdminSidebar />)

    const dashboardLink = screen.getByTestId('admin-sidebar-dashboard')
    expect(dashboardLink.className).toContain('bg-accent-primary/10')
  })

  it('highlights sub-route links correctly', () => {
    mockPathname = '/admin/applications'
    render(<AdminSidebar />)

    const appLink = screen.getByTestId('admin-sidebar-applications')
    expect(appLink.className).toContain('bg-accent-primary/10')

    // Dashboard should NOT be active on sub-routes
    const dashboardLink = screen.getByTestId('admin-sidebar-dashboard')
    expect(dashboardLink.className).not.toContain('bg-accent-primary/10')
  })

  it('renders correct href values', () => {
    render(<AdminSidebar />)

    expect(screen.getByTestId('admin-sidebar-dashboard')).toHaveAttribute('href', '/admin')
    expect(screen.getByTestId('admin-sidebar-applications')).toHaveAttribute('href', '/admin/applications')
    expect(screen.getByTestId('admin-sidebar-artists')).toHaveAttribute('href', '/admin/artists')
    expect(screen.getByTestId('admin-sidebar-listings')).toHaveAttribute('href', '/admin/listings')
    expect(screen.getByTestId('admin-sidebar-users')).toHaveAttribute('href', '/admin/users')
    expect(screen.getByTestId('admin-sidebar-waitlist')).toHaveAttribute('href', '/admin/waitlist')
    expect(screen.getByTestId('admin-sidebar-audit-log')).toHaveAttribute('href', '/admin/audit-log')
  })
})

// --- Header Tests ---

describe('AdminHeader', () => {
  it('renders the admin header with user name and sign-out', () => {
    render(<AdminHeader />)

    expect(screen.getByTestId('admin-header')).toBeInTheDocument()
    expect(screen.getByTestId('admin-user-name')).toHaveTextContent('Admin User')
    expect(screen.getByTestId('admin-sign-out')).toHaveTextContent('Sign out')
  })

  it('calls signOut when sign-out button is clicked', async () => {
    render(<AdminHeader />)

    screen.getByTestId('admin-sign-out').click()
    expect(mockAuth.signOut).toHaveBeenCalled()
  })
})

// --- Guard Tests ---

describe('AdminGuard', () => {
  it('renders children when user is admin', () => {
    render(
      <AdminGuard>
        <div data-testid="protected-content">Secret</div>
      </AdminGuard>,
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('shows loading skeleton while auth is resolving', () => {
    mockAuth.loading = true
    render(
      <AdminGuard>
        <div data-testid="protected-content">Secret</div>
      </AdminGuard>,
    )

    expect(screen.getByTestId('admin-loading')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('shows forbidden when user is not admin', () => {
    mockAuth.isAdmin = false
    mockAuth.roles = ['buyer']
    render(
      <AdminGuard>
        <div data-testid="protected-content">Secret</div>
      </AdminGuard>,
    )

    expect(screen.getByTestId('admin-forbidden')).toBeInTheDocument()
    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('shows forbidden when user is null', () => {
    mockAuth.user = null as never
    mockAuth.isAdmin = false
    render(
      <AdminGuard>
        <div data-testid="protected-content">Secret</div>
      </AdminGuard>,
    )

    expect(screen.getByTestId('admin-forbidden')).toBeInTheDocument()
  })
})
