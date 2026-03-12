import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// --- Mocks ---

let mockPathname = '/admin/users'

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
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

const mockGetAdminUsers = vi.fn()
const mockGetAdminUser = vi.fn()
const mockGrantRole = vi.fn()
const mockRevokeRole = vi.fn()

vi.mock('@/lib/api', () => ({
  getAdminUsers: (...args: unknown[]) => mockGetAdminUsers(...args),
  getAdminUser: (...args: unknown[]) => mockGetAdminUser(...args),
  grantRole: (...args: unknown[]) => mockGrantRole(...args),
  revokeRole: (...args: unknown[]) => mockRevokeRole(...args),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockPathname = '/admin/users'
  mockAuth.user = { email: 'admin@surfaced.art', name: 'Admin User' }
  mockAuth.loading = false
  mockAuth.isAdmin = true
  mockAuth.roles = ['admin', 'buyer']
  mockAuth.getIdToken.mockResolvedValue('mock-token')
})

// --- User List Tests ---

describe('AdminUserList', () => {
  // Lazy import so mocks are set up first
  let AdminUserList: React.ComponentType

  beforeEach(async () => {
    const mod = await import('../admin/users/user-list')
    AdminUserList = mod.AdminUserList
  })

  const mockUsers = {
    data: [
      {
        id: 'user-1',
        email: 'alice@example.com',
        fullName: 'Alice Smith',
        roles: ['buyer'] as string[],
        createdAt: '2026-01-15T00:00:00Z',
        lastActiveAt: '2026-03-10T12:00:00Z',
        hasArtistProfile: false,
      },
      {
        id: 'user-2',
        email: 'bob@example.com',
        fullName: 'Bob Jones',
        roles: ['buyer', 'artist'] as string[],
        createdAt: '2026-02-01T00:00:00Z',
        lastActiveAt: null,
        hasArtistProfile: true,
      },
    ],
    meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
  }

  it('renders the user list with data', async () => {
    mockGetAdminUsers.mockResolvedValue(mockUsers)
    render(<AdminUserList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-user-list')).toBeInTheDocument()
    })

    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
    expect(screen.getByText('Bob Jones')).toBeInTheDocument()
    expect(screen.getByText('bob@example.com')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    mockGetAdminUsers.mockReturnValue(new Promise(() => {})) // never resolves
    render(<AdminUserList />)

    expect(screen.getByTestId('admin-users-loading')).toBeInTheDocument()
  })

  it('shows error state on API failure', async () => {
    mockGetAdminUsers.mockRejectedValue(new Error('Network error'))
    render(<AdminUserList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-users-error')).toBeInTheDocument()
    })
  })

  it('shows empty state when no users found', async () => {
    mockGetAdminUsers.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })
    render(<AdminUserList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-users-empty')).toBeInTheDocument()
    })
  })

  it('displays role badges for each user', async () => {
    mockGetAdminUsers.mockResolvedValue(mockUsers)
    render(<AdminUserList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-user-list')).toBeInTheDocument()
    })

    // Bob has both buyer and artist roles
    const bobRow = screen.getByTestId('admin-user-row-user-2')
    expect(within(bobRow).getByText('buyer')).toBeInTheDocument()
    expect(within(bobRow).getByText('artist')).toBeInTheDocument()
  })

  it('shows artist profile indicator', async () => {
    mockGetAdminUsers.mockResolvedValue(mockUsers)
    render(<AdminUserList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-user-list')).toBeInTheDocument()
    })

    const bobRow = screen.getByTestId('admin-user-row-user-2')
    expect(within(bobRow).getByTestId('has-artist-profile')).toBeInTheDocument()
  })

  it('renders search input', async () => {
    mockGetAdminUsers.mockResolvedValue(mockUsers)
    render(<AdminUserList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-user-list')).toBeInTheDocument()
    })

    expect(screen.getByTestId('admin-users-search')).toBeInTheDocument()
  })

  it('renders role filter', async () => {
    mockGetAdminUsers.mockResolvedValue(mockUsers)
    render(<AdminUserList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-user-list')).toBeInTheDocument()
    })

    expect(screen.getByTestId('admin-users-role-filter')).toBeInTheDocument()
  })

  it('calls API with search param when searching', async () => {
    mockGetAdminUsers.mockResolvedValue(mockUsers)
    const user = userEvent.setup()
    render(<AdminUserList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-user-list')).toBeInTheDocument()
    })

    const searchInput = screen.getByTestId('admin-users-search')
    await user.type(searchInput, 'alice')

    // Search should debounce and then call API
    await waitFor(() => {
      expect(mockGetAdminUsers).toHaveBeenCalledWith(
        'mock-token',
        expect.objectContaining({ search: 'alice' }),
      )
    })
  })

  it('renders pagination when multiple pages', async () => {
    mockGetAdminUsers.mockResolvedValue({
      data: mockUsers.data,
      meta: { page: 1, limit: 20, total: 50, totalPages: 3 },
    })
    render(<AdminUserList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-users-pagination')).toBeInTheDocument()
    })
  })

  it('links each row to user detail page', async () => {
    mockGetAdminUsers.mockResolvedValue(mockUsers)
    render(<AdminUserList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-user-list')).toBeInTheDocument()
    })

    const aliceRow = screen.getByTestId('admin-user-row-user-1')
    const link = within(aliceRow).getByRole('link')
    expect(link).toHaveAttribute('href', '/admin/users/user-1')
  })
})

// --- User Detail Tests ---

describe('AdminUserDetail', () => {
  let AdminUserDetail: React.ComponentType<{ userId: string }>

  beforeEach(async () => {
    const mod = await import('../admin/users/[id]/user-detail')
    AdminUserDetail = mod.AdminUserDetail
  })

  const mockUserDetail = {
    id: 'user-1',
    email: 'alice@example.com',
    fullName: 'Alice Smith',
    avatarUrl: null,
    roles: [
      { role: 'buyer', grantedAt: '2026-01-15T00:00:00Z', grantedBy: null },
    ],
    createdAt: '2026-01-15T00:00:00Z',
    lastActiveAt: '2026-03-10T12:00:00Z',
    artistProfile: null,
    stats: { orderCount: 5, reviewCount: 2, saveCount: 10, followCount: 3 },
  }

  it('renders user detail with profile info', async () => {
    mockGetAdminUser.mockResolvedValue(mockUserDetail)
    render(<AdminUserDetail userId="user-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-user-detail')).toBeInTheDocument()
    })

    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    mockGetAdminUser.mockReturnValue(new Promise(() => {}))
    render(<AdminUserDetail userId="user-1" />)

    expect(screen.getByTestId('admin-user-detail-loading')).toBeInTheDocument()
  })

  it('shows error state on API failure', async () => {
    mockGetAdminUser.mockRejectedValue(new Error('Not found'))
    render(<AdminUserDetail userId="user-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-user-detail-error')).toBeInTheDocument()
    })
  })

  it('displays user stats', async () => {
    mockGetAdminUser.mockResolvedValue(mockUserDetail)
    render(<AdminUserDetail userId="user-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-user-detail')).toBeInTheDocument()
    })

    expect(screen.getByTestId('stat-orders')).toHaveTextContent('5')
    expect(screen.getByTestId('stat-reviews')).toHaveTextContent('2')
    expect(screen.getByTestId('stat-saves')).toHaveTextContent('10')
    expect(screen.getByTestId('stat-follows')).toHaveTextContent('3')
  })

  it('displays current roles with grant dates', async () => {
    mockGetAdminUser.mockResolvedValue(mockUserDetail)
    render(<AdminUserDetail userId="user-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-user-detail')).toBeInTheDocument()
    })

    expect(screen.getByTestId('role-buyer')).toBeInTheDocument()
  })

  it('shows artist profile link when user has artist profile', async () => {
    mockGetAdminUser.mockResolvedValue({
      ...mockUserDetail,
      artistProfile: {
        id: 'artist-1',
        displayName: 'Alice Art',
        slug: 'alice-art',
        status: 'approved',
      },
    })
    render(<AdminUserDetail userId="user-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-user-detail')).toBeInTheDocument()
    })

    expect(screen.getByTestId('artist-profile-link')).toHaveAttribute(
      'href',
      '/admin/artists/artist-1',
    )
  })

  it('grants a role when grant button is clicked', async () => {
    mockGetAdminUser.mockResolvedValue(mockUserDetail)
    mockGrantRole.mockResolvedValue({
      message: 'Role artist granted successfully',
      role: { userId: 'user-1', role: 'artist', grantedAt: '2026-03-12T00:00:00Z', grantedBy: 'admin-1' },
    })
    const user = userEvent.setup()
    render(<AdminUserDetail userId="user-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-user-detail')).toBeInTheDocument()
    })

    // Select artist role from the grant dropdown/select
    const roleSelect = screen.getByTestId('grant-role-select')
    await user.selectOptions(roleSelect, 'artist')

    const grantBtn = screen.getByTestId('grant-role-btn')
    await user.click(grantBtn)

    await waitFor(() => {
      expect(mockGrantRole).toHaveBeenCalledWith('mock-token', 'user-1', 'artist')
    })
  })

  it('revokes a role when revoke button is clicked', async () => {
    mockGetAdminUser.mockResolvedValue(mockUserDetail)
    mockRevokeRole.mockResolvedValue({ message: 'Role buyer revoked successfully' })
    const user = userEvent.setup()
    render(<AdminUserDetail userId="user-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-user-detail')).toBeInTheDocument()
    })

    const revokeBtn = screen.getByTestId('revoke-role-buyer')
    await user.click(revokeBtn)

    await waitFor(() => {
      expect(mockRevokeRole).toHaveBeenCalledWith('mock-token', 'user-1', 'buyer')
    })
  })

  it('shows grant error message on failure', async () => {
    mockGetAdminUser.mockResolvedValue(mockUserDetail)
    mockGrantRole.mockRejectedValue(new Error('Cannot self-grant admin role'))
    const user = userEvent.setup()
    render(<AdminUserDetail userId="user-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-user-detail')).toBeInTheDocument()
    })

    const roleSelect = screen.getByTestId('grant-role-select')
    await user.selectOptions(roleSelect, 'artist')

    const grantBtn = screen.getByTestId('grant-role-btn')
    await user.click(grantBtn)

    await waitFor(() => {
      expect(screen.getByTestId('role-action-error')).toBeInTheDocument()
    })
  })
})
