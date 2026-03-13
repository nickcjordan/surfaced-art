import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// --- Mocks ---

let mockPathname = '/admin/artists'

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
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

const mockGetAdminArtists = vi.fn()
const mockGetAdminArtist = vi.fn()
const mockUpdateAdminArtist = vi.fn()
const mockSuspendArtist = vi.fn()
const mockUnsuspendArtist = vi.fn()

vi.mock('@/lib/api', () => ({
  getAdminArtists: (...args: unknown[]) => mockGetAdminArtists(...args),
  getAdminArtist: (...args: unknown[]) => mockGetAdminArtist(...args),
  updateAdminArtist: (...args: unknown[]) => mockUpdateAdminArtist(...args),
  suspendArtist: (...args: unknown[]) => mockSuspendArtist(...args),
  unsuspendArtist: (...args: unknown[]) => mockUnsuspendArtist(...args),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockPathname = '/admin/artists'
  mockAuth.getIdToken.mockResolvedValue('mock-token')
})

// --- Artist List Tests ---

describe('AdminArtistList', () => {
  let AdminArtistList: React.ComponentType

  beforeEach(async () => {
    const mod = await import('../admin/artists/artist-list')
    AdminArtistList = mod.AdminArtistList
  })

  const mockArtists = {
    data: [
      {
        id: 'artist-1',
        userId: 'user-1',
        displayName: 'Jane Doe',
        slug: 'jane-doe',
        status: 'approved',
        listingCount: 5,
        isDemo: false,
        createdAt: '2026-02-01T00:00:00Z',
      },
      {
        id: 'artist-2',
        userId: 'user-2',
        displayName: 'John Smith',
        slug: 'john-smith',
        status: 'suspended',
        listingCount: 0,
        isDemo: true,
        createdAt: '2026-01-15T00:00:00Z',
      },
    ],
    meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
  }

  it('renders the artist list with data', async () => {
    mockGetAdminArtists.mockResolvedValue(mockArtists)
    render(<AdminArtistList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-artist-list')).toBeInTheDocument()
    })

    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('jane-doe')).toBeInTheDocument()
    expect(screen.getByText('John Smith')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    mockGetAdminArtists.mockReturnValue(new Promise(() => {}))
    render(<AdminArtistList />)

    expect(screen.getByTestId('admin-artists-loading')).toBeInTheDocument()
  })

  it('shows error state on API failure', async () => {
    mockGetAdminArtists.mockRejectedValue(new Error('Network error'))
    render(<AdminArtistList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-artists-error')).toBeInTheDocument()
    })
  })

  it('shows empty state when no artists found', async () => {
    mockGetAdminArtists.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })
    render(<AdminArtistList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-artists-empty')).toBeInTheDocument()
    })
  })

  it('displays status badges', async () => {
    mockGetAdminArtists.mockResolvedValue(mockArtists)
    render(<AdminArtistList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-artist-list')).toBeInTheDocument()
    })

    const row1 = screen.getByTestId('admin-artist-row-artist-1')
    expect(within(row1).getByText('approved')).toBeInTheDocument()

    const row2 = screen.getByTestId('admin-artist-row-artist-2')
    expect(within(row2).getByText('suspended')).toBeInTheDocument()
  })

  it('renders search input and status filter', async () => {
    mockGetAdminArtists.mockResolvedValue(mockArtists)
    render(<AdminArtistList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-artist-list')).toBeInTheDocument()
    })

    expect(screen.getByTestId('admin-artists-search')).toBeInTheDocument()
    expect(screen.getByTestId('admin-artists-status-filter')).toBeInTheDocument()
  })

  it('calls API with search param', async () => {
    mockGetAdminArtists.mockResolvedValue(mockArtists)
    const user = userEvent.setup()
    render(<AdminArtistList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-artist-list')).toBeInTheDocument()
    })

    const searchInput = screen.getByTestId('admin-artists-search')
    await user.type(searchInput, 'jane')

    // Debounced search — wait for the API call
    await waitFor(() => {
      expect(mockGetAdminArtists).toHaveBeenCalledWith(
        'mock-token',
        expect.objectContaining({ search: 'jane' }),
      )
    }, { timeout: 2000 })
  })

  it('calls API with status filter', async () => {
    mockGetAdminArtists.mockResolvedValue(mockArtists)
    const user = userEvent.setup()
    render(<AdminArtistList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-artist-list')).toBeInTheDocument()
    })

    const statusFilter = screen.getByTestId('admin-artists-status-filter')
    await user.selectOptions(statusFilter, 'suspended')

    await waitFor(() => {
      expect(mockGetAdminArtists).toHaveBeenCalledWith(
        'mock-token',
        expect.objectContaining({ status: 'suspended' }),
      )
    })
  })

  it('links each row to artist detail page', async () => {
    mockGetAdminArtists.mockResolvedValue(mockArtists)
    render(<AdminArtistList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-artist-list')).toBeInTheDocument()
    })

    const row = screen.getByTestId('admin-artist-row-artist-1')
    const link = within(row).getByRole('link')
    expect(link).toHaveAttribute('href', '/admin/artists/artist-1')
  })

  it('renders pagination when multiple pages', async () => {
    mockGetAdminArtists.mockResolvedValue({
      data: mockArtists.data,
      meta: { page: 1, limit: 20, total: 50, totalPages: 3 },
    })
    render(<AdminArtistList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-artists-pagination')).toBeInTheDocument()
    })
  })

  it('shows demo badge for demo artists', async () => {
    mockGetAdminArtists.mockResolvedValue(mockArtists)
    render(<AdminArtistList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-artist-list')).toBeInTheDocument()
    })

    const row2 = screen.getByTestId('admin-artist-row-artist-2')
    expect(within(row2).getByText('demo')).toBeInTheDocument()
  })
})

// --- Artist Detail Tests ---

describe('AdminArtistDetail', () => {
  let AdminArtistDetail: React.ComponentType<{ artistId: string }>

  beforeEach(async () => {
    const mod = await import('../admin/artists/[id]/artist-detail')
    AdminArtistDetail = mod.AdminArtistDetail
  })

  const mockDetail = {
    id: 'artist-1',
    userId: 'user-1',
    displayName: 'Jane Doe',
    slug: 'jane-doe',
    bio: 'I make ceramics inspired by the Pacific Northwest.',
    location: 'Portland, OR',
    websiteUrl: 'https://janedoe.art',
    instagramUrl: 'https://instagram.com/janedoe',
    originZip: '97201',
    status: 'approved' as const,
    commissionsOpen: true,
    coverImageUrl: null,
    profileImageUrl: null,
    applicationSource: null,
    isDemo: false,
    hasStripeAccount: false,
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    user: { email: 'jane@example.com', fullName: 'Jane Doe', roles: ['buyer', 'artist'] as string[] },
    categories: ['ceramics'] as string[],
    stats: {
      totalListings: 5,
      availableListings: 3,
      soldListings: 2,
      followerCount: 12,
    },
  }

  it('renders artist detail', async () => {
    mockGetAdminArtist.mockResolvedValue(mockDetail)
    render(<AdminArtistDetail artistId="artist-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-artist-detail')).toBeInTheDocument()
    })

    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    expect(screen.getByText('I make ceramics inspired by the Pacific Northwest.')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    mockGetAdminArtist.mockReturnValue(new Promise(() => {}))
    render(<AdminArtistDetail artistId="artist-1" />)

    expect(screen.getByTestId('admin-artist-detail-loading')).toBeInTheDocument()
  })

  it('shows error state', async () => {
    mockGetAdminArtist.mockRejectedValue(new Error('Not found'))
    render(<AdminArtistDetail artistId="artist-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-artist-detail-error')).toBeInTheDocument()
    })
  })

  it('displays stats', async () => {
    mockGetAdminArtist.mockResolvedValue(mockDetail)
    render(<AdminArtistDetail artistId="artist-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-artist-detail')).toBeInTheDocument()
    })

    expect(screen.getByTestId('stat-total-listings')).toHaveTextContent('5')
    expect(screen.getByTestId('stat-available')).toHaveTextContent('3')
    expect(screen.getByTestId('stat-sold')).toHaveTextContent('2')
    expect(screen.getByTestId('stat-followers')).toHaveTextContent('12')
  })

  it('shows suspend button for approved artists', async () => {
    mockGetAdminArtist.mockResolvedValue(mockDetail)
    render(<AdminArtistDetail artistId="artist-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-artist-detail')).toBeInTheDocument()
    })

    expect(screen.getByTestId('suspend-btn')).toBeInTheDocument()
    expect(screen.queryByTestId('unsuspend-btn')).not.toBeInTheDocument()
  })

  it('shows unsuspend button for suspended artists', async () => {
    mockGetAdminArtist.mockResolvedValue({ ...mockDetail, status: 'suspended' })
    render(<AdminArtistDetail artistId="artist-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-artist-detail')).toBeInTheDocument()
    })

    expect(screen.getByTestId('unsuspend-btn')).toBeInTheDocument()
    expect(screen.queryByTestId('suspend-btn')).not.toBeInTheDocument()
  })

  it('calls suspend with reason', async () => {
    mockGetAdminArtist.mockResolvedValue(mockDetail)
    mockSuspendArtist.mockResolvedValue({ message: 'Artist suspended successfully' })
    const user = userEvent.setup()
    render(<AdminArtistDetail artistId="artist-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-artist-detail')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('suspend-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('suspend-reason-input')).toBeInTheDocument()
    })

    await user.type(screen.getByTestId('suspend-reason-input'), 'Policy violation')
    await user.click(screen.getByTestId('confirm-suspend-btn'))

    await waitFor(() => {
      expect(mockSuspendArtist).toHaveBeenCalledWith('mock-token', 'artist-1', 'Policy violation')
    })
  })

  it('calls unsuspend', async () => {
    mockGetAdminArtist.mockResolvedValue({ ...mockDetail, status: 'suspended' })
    mockUnsuspendArtist.mockResolvedValue({ message: 'Artist unsuspended successfully' })
    const user = userEvent.setup()
    render(<AdminArtistDetail artistId="artist-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-artist-detail')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('unsuspend-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('confirm-unsuspend-btn')).toBeInTheDocument()
    })
    await user.click(screen.getByTestId('confirm-unsuspend-btn'))

    await waitFor(() => {
      expect(mockUnsuspendArtist).toHaveBeenCalledWith('mock-token', 'artist-1')
    })
  })

  it('shows edit button and opens edit form', async () => {
    mockGetAdminArtist.mockResolvedValue(mockDetail)
    const user = userEvent.setup()
    render(<AdminArtistDetail artistId="artist-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-artist-detail')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('edit-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('edit-form')).toBeInTheDocument()
    })

    expect(screen.getByTestId('edit-displayName')).toHaveValue('Jane Doe')
    expect(screen.getByTestId('edit-bio')).toHaveValue('I make ceramics inspired by the Pacific Northwest.')
  })

  it('submits edit form', async () => {
    mockGetAdminArtist.mockResolvedValue(mockDetail)
    mockUpdateAdminArtist.mockResolvedValue({ message: 'Artist profile updated successfully' })
    const user = userEvent.setup()
    render(<AdminArtistDetail artistId="artist-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-artist-detail')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('edit-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('edit-form')).toBeInTheDocument()
    })

    const bioInput = screen.getByTestId('edit-bio')
    await user.clear(bioInput)
    await user.type(bioInput, 'Updated bio text')
    await user.click(screen.getByTestId('save-edit-btn'))

    await waitFor(() => {
      expect(mockUpdateAdminArtist).toHaveBeenCalledWith(
        'mock-token',
        'artist-1',
        expect.objectContaining({ bio: 'Updated bio text' }),
      )
    })
  })

  it('links to public profile', async () => {
    mockGetAdminArtist.mockResolvedValue(mockDetail)
    render(<AdminArtistDetail artistId="artist-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-artist-detail')).toBeInTheDocument()
    })

    expect(screen.getByTestId('public-profile-link')).toHaveAttribute('href', '/artist/jane-doe')
  })
})
