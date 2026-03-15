import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// --- Mocks ---

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/waitlist',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
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
  getIdToken: vi.fn().mockResolvedValue('mock-token'),
  pendingChallenge: null,
}

vi.mock('@/lib/auth', () => ({
  useAuth: () => mockAuth,
}))

const mockGetAdminWaitlist = vi.fn()
const mockDeleteWaitlistEntry = vi.fn()

vi.mock('@/lib/api', () => ({
  getAdminWaitlist: (...args: unknown[]) => mockGetAdminWaitlist(...args),
  deleteWaitlistEntry: (...args: unknown[]) => mockDeleteWaitlistEntry(...args),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.getIdToken.mockResolvedValue('mock-token')
})

describe('AdminWaitlistList', () => {
  let AdminWaitlistList: React.ComponentType

  beforeEach(async () => {
    const mod = await import('../admin/waitlist/waitlist-list')
    AdminWaitlistList = mod.AdminWaitlistList
  })

  const mockEntries = {
    data: [
      { id: 'wl-1', email: 'buyer1@example.com', createdAt: '2026-03-01T00:00:00Z' },
      { id: 'wl-2', email: 'buyer2@example.com', createdAt: '2026-02-15T00:00:00Z' },
      { id: 'wl-3', email: 'buyer3@example.com', createdAt: '2026-02-10T00:00:00Z' },
    ],
    meta: { page: 1, limit: 20, total: 3, totalPages: 1 },
  }

  it('renders the waitlist with data', async () => {
    mockGetAdminWaitlist.mockResolvedValue(mockEntries)
    render(<AdminWaitlistList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-waitlist-list')).toBeInTheDocument()
    })

    expect(screen.getByText('buyer1@example.com')).toBeInTheDocument()
    expect(screen.getByText('buyer2@example.com')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    mockGetAdminWaitlist.mockReturnValue(new Promise(() => {}))
    render(<AdminWaitlistList />)

    expect(screen.getByTestId('admin-waitlist-loading')).toBeInTheDocument()
  })

  it('shows error state on API failure', async () => {
    mockGetAdminWaitlist.mockRejectedValue(new Error('Network error'))
    render(<AdminWaitlistList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-waitlist-error')).toBeInTheDocument()
    })
  })

  it('shows empty state when no entries found', async () => {
    mockGetAdminWaitlist.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })
    render(<AdminWaitlistList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-waitlist-empty')).toBeInTheDocument()
    })
  })

  it('displays total signup count', async () => {
    mockGetAdminWaitlist.mockResolvedValue(mockEntries)
    render(<AdminWaitlistList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-waitlist-list')).toBeInTheDocument()
    })

    expect(screen.getByTestId('waitlist-total-count')).toHaveTextContent('3')
  })

  it('renders search input', async () => {
    mockGetAdminWaitlist.mockResolvedValue(mockEntries)
    render(<AdminWaitlistList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-waitlist-list')).toBeInTheDocument()
    })

    expect(screen.getByTestId('admin-waitlist-search')).toBeInTheDocument()
  })

  it('calls API with search param', async () => {
    mockGetAdminWaitlist.mockResolvedValue(mockEntries)
    const user = userEvent.setup()
    render(<AdminWaitlistList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-waitlist-list')).toBeInTheDocument()
    })

    await user.type(screen.getByTestId('admin-waitlist-search'), 'buyer1')

    await waitFor(() => {
      expect(mockGetAdminWaitlist).toHaveBeenCalledWith(
        'mock-token',
        expect.objectContaining({ search: 'buyer1' }),
      )
    }, { timeout: 2000 })
  })

  it('renders pagination when multiple pages', async () => {
    mockGetAdminWaitlist.mockResolvedValue({
      data: mockEntries.data,
      meta: { page: 1, limit: 20, total: 50, totalPages: 3 },
    })
    render(<AdminWaitlistList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-waitlist-pagination')).toBeInTheDocument()
    })
  })

  it('renders CSV export button', async () => {
    mockGetAdminWaitlist.mockResolvedValue(mockEntries)
    render(<AdminWaitlistList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-waitlist-list')).toBeInTheDocument()
    })

    expect(screen.getByTestId('export-csv-btn')).toBeInTheDocument()
  })

  it('renders delete button for each entry', async () => {
    mockGetAdminWaitlist.mockResolvedValue(mockEntries)
    render(<AdminWaitlistList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-waitlist-list')).toBeInTheDocument()
    })

    const row = screen.getByTestId('admin-waitlist-row-wl-1')
    expect(within(row).getByTestId('delete-btn-wl-1')).toBeInTheDocument()
  })

  it('calls delete when confirmed', async () => {
    mockGetAdminWaitlist.mockResolvedValue(mockEntries)
    mockDeleteWaitlistEntry.mockResolvedValue({ message: 'Deleted' })
    const user = userEvent.setup()
    render(<AdminWaitlistList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-waitlist-list')).toBeInTheDocument()
    })

    const row = screen.getByTestId('admin-waitlist-row-wl-1')
    await user.click(within(row).getByTestId('delete-btn-wl-1'))

    await waitFor(() => {
      expect(screen.getByTestId('confirm-delete-btn')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('confirm-delete-btn'))

    await waitFor(() => {
      expect(mockDeleteWaitlistEntry).toHaveBeenCalledWith('mock-token', 'wl-1')
    })
  })
})
