import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// --- Mocks ---

let mockPathname = '/admin/listings'

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

const mockGetAdminListings = vi.fn()
const mockGetAdminListing = vi.fn()
const mockHideListing = vi.fn()
const mockUnhideListing = vi.fn()
const mockUpdateAdminListingCategory = vi.fn()
const mockUpdateAdminListingTags = vi.fn()
const mockGetTagVocabulary = vi.fn()

vi.mock('@/lib/api', () => ({
  getAdminListings: (...args: unknown[]) => mockGetAdminListings(...args),
  getAdminListing: (...args: unknown[]) => mockGetAdminListing(...args),
  hideListing: (...args: unknown[]) => mockHideListing(...args),
  unhideListing: (...args: unknown[]) => mockUnhideListing(...args),
  updateAdminListingCategory: (...args: unknown[]) => mockUpdateAdminListingCategory(...args),
  updateAdminListingTags: (...args: unknown[]) => mockUpdateAdminListingTags(...args),
  getTagVocabulary: (...args: unknown[]) => mockGetTagVocabulary(...args),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockPathname = '/admin/listings'
  mockAuth.getIdToken.mockResolvedValue('mock-token')
})

const now = new Date()

// --- Listing List Tests ---

describe('AdminListingList', () => {
  let AdminListingList: React.ComponentType

  beforeEach(async () => {
    const mod = await import('../admin/listings/listing-list')
    AdminListingList = mod.AdminListingList
  })

  const mockListings = {
    data: [
      {
        id: 'listing-1',
        artistId: 'artist-1',
        type: 'original',
        title: 'Ceramic Bowl',
        description: 'A beautiful ceramic bowl',
        medium: 'Stoneware',
        category: 'ceramics',
        price: 12500,
        status: 'available',
        isDocumented: true,
        quantityTotal: 1,
        quantityRemaining: 1,
        artworkLength: 8,
        artworkWidth: 8,
        artworkHeight: 4,
        packedLength: 12,
        packedWidth: 12,
        packedHeight: 8,
        packedWeight: 3,
        editionNumber: null,
        editionTotal: null,
        reservedUntil: null,
        createdAt: now,
        updatedAt: now,
        primaryImage: { id: 'img-1', listingId: 'listing-1', url: '/img.jpg', isProcessPhoto: false, sortOrder: 0, width: 800, height: 600, createdAt: now },
        artist: { displayName: 'Jane Doe', slug: 'jane-doe' },
      },
      {
        id: 'listing-2',
        artistId: 'artist-2',
        type: 'original',
        title: 'Abstract Painting',
        description: 'Oil on canvas',
        medium: 'Oil',
        category: 'painting',
        price: 45000,
        status: 'hidden',
        isDocumented: false,
        quantityTotal: 1,
        quantityRemaining: 1,
        artworkLength: 24,
        artworkWidth: 36,
        artworkHeight: null,
        packedLength: 30,
        packedWidth: 42,
        packedHeight: 6,
        packedWeight: 8,
        editionNumber: null,
        editionTotal: null,
        reservedUntil: null,
        createdAt: now,
        updatedAt: now,
        primaryImage: null,
        artist: { displayName: 'John Smith', slug: 'john-smith' },
      },
    ],
    meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
  }

  it('renders the listing list with data', async () => {
    mockGetAdminListings.mockResolvedValue(mockListings)
    render(<AdminListingList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-listing-list')).toBeInTheDocument()
    })

    expect(screen.getByText('Ceramic Bowl')).toBeInTheDocument()
    expect(screen.getByText('Abstract Painting')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    mockGetAdminListings.mockReturnValue(new Promise(() => {}))
    render(<AdminListingList />)

    expect(screen.getByTestId('admin-listings-loading')).toBeInTheDocument()
  })

  it('shows error state on API failure', async () => {
    mockGetAdminListings.mockRejectedValue(new Error('Network error'))
    render(<AdminListingList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-listings-error')).toBeInTheDocument()
    })
  })

  it('shows empty state when no listings found', async () => {
    mockGetAdminListings.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })
    render(<AdminListingList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-listings-empty')).toBeInTheDocument()
    })
  })

  it('displays status badges', async () => {
    mockGetAdminListings.mockResolvedValue(mockListings)
    render(<AdminListingList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-listing-list')).toBeInTheDocument()
    })

    const row1 = screen.getByTestId('admin-listing-row-listing-1')
    expect(within(row1).getByText('available')).toBeInTheDocument()

    const row2 = screen.getByTestId('admin-listing-row-listing-2')
    expect(within(row2).getByText('hidden')).toBeInTheDocument()
  })

  it('displays formatted prices', async () => {
    mockGetAdminListings.mockResolvedValue(mockListings)
    render(<AdminListingList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-listing-list')).toBeInTheDocument()
    })

    const row1 = screen.getByTestId('admin-listing-row-listing-1')
    expect(within(row1).getByText('$125.00')).toBeInTheDocument()
  })

  it('renders search and status filter', async () => {
    mockGetAdminListings.mockResolvedValue(mockListings)
    render(<AdminListingList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-listing-list')).toBeInTheDocument()
    })

    expect(screen.getByTestId('admin-listings-search')).toBeInTheDocument()
    expect(screen.getByTestId('admin-listings-status-filter')).toBeInTheDocument()
  })

  it('calls API with status filter', async () => {
    mockGetAdminListings.mockResolvedValue(mockListings)
    const user = userEvent.setup()
    render(<AdminListingList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-listing-list')).toBeInTheDocument()
    })

    const statusFilter = screen.getByTestId('admin-listings-status-filter')
    await user.selectOptions(statusFilter, 'hidden')

    await waitFor(() => {
      expect(mockGetAdminListings).toHaveBeenCalledWith(
        'mock-token',
        expect.objectContaining({ status: 'hidden' }),
      )
    })
  })

  it('links each row to listing detail page', async () => {
    mockGetAdminListings.mockResolvedValue(mockListings)
    render(<AdminListingList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-listing-list')).toBeInTheDocument()
    })

    const row = screen.getByTestId('admin-listing-row-listing-1')
    const link = within(row).getByRole('link')
    expect(link).toHaveAttribute('href', '/admin/listings/listing-1')
  })

  it('renders pagination when multiple pages', async () => {
    mockGetAdminListings.mockResolvedValue({
      data: mockListings.data,
      meta: { page: 1, limit: 20, total: 50, totalPages: 3 },
    })
    render(<AdminListingList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-listings-pagination')).toBeInTheDocument()
    })
  })

  it('shows artist name in rows', async () => {
    mockGetAdminListings.mockResolvedValue(mockListings)
    render(<AdminListingList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-listing-list')).toBeInTheDocument()
    })

    const row1 = screen.getByTestId('admin-listing-row-listing-1')
    expect(within(row1).getByText('Jane Doe')).toBeInTheDocument()
  })
})

// --- Listing Detail Tests ---

describe('AdminListingDetail', () => {
  let AdminListingDetail: React.ComponentType<{ listingId: string }>

  beforeEach(async () => {
    const mod = await import('../admin/listings/[id]/listing-detail')
    AdminListingDetail = mod.AdminListingDetail
  })

  const mockTags = [
    { id: 'tag-1', slug: 'functional', label: 'Functional', category: 'ceramics', sortOrder: 0 },
    { id: 'tag-2', slug: 'sculptural', label: 'Sculptural', category: 'ceramics', sortOrder: 1 },
    { id: 'tag-3', slug: 'abstract', label: 'Abstract', category: null, sortOrder: 0 },
    { id: 'tag-4', slug: 'landscape', label: 'Landscape', category: 'drawing_painting', sortOrder: 0 },
  ]

  const mockDetail = {
    id: 'listing-1',
    artistId: 'artist-1',
    type: 'original',
    title: 'Ceramic Bowl',
    description: 'A beautiful ceramic bowl made from stoneware.',
    medium: 'Stoneware',
    category: 'ceramics',
    price: 12500,
    status: 'available',
    isDocumented: true,
    quantityTotal: 1,
    quantityRemaining: 1,
    artworkLength: 8,
    artworkWidth: 8,
    artworkHeight: 4,
    packedLength: 12,
    packedWidth: 12,
    packedHeight: 8,
    packedWeight: 3,
    editionNumber: null,
    editionTotal: null,
    reservedUntil: null,
    createdAt: now,
    updatedAt: now,
    images: [
      { id: 'img-1', listingId: 'listing-1', url: '/img1.jpg', isProcessPhoto: false, sortOrder: 0, width: 800, height: 600, createdAt: now },
      { id: 'img-2', listingId: 'listing-1', url: '/img2.jpg', isProcessPhoto: true, sortOrder: 1, width: 800, height: 600, createdAt: now },
    ],
    artist: { id: 'artist-1', displayName: 'Jane Doe', slug: 'jane-doe', status: 'approved' as const },
    orderCount: 0,
    reviewCount: 0,
    tags: [
      { id: 'tag-1', slug: 'functional', label: 'Functional', category: 'ceramics', sortOrder: 0 },
    ],
  }

  it('renders listing detail', async () => {
    mockGetAdminListing.mockResolvedValue(mockDetail)
    render(<AdminListingDetail listingId="listing-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-listing-detail')).toBeInTheDocument()
    })

    expect(screen.getByText('Ceramic Bowl')).toBeInTheDocument()
    expect(screen.getByText('A beautiful ceramic bowl made from stoneware.')).toBeInTheDocument()
    expect(screen.getByText('$125.00')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    mockGetAdminListing.mockReturnValue(new Promise(() => {}))
    render(<AdminListingDetail listingId="listing-1" />)

    expect(screen.getByTestId('admin-listing-detail-loading')).toBeInTheDocument()
  })

  it('shows error state', async () => {
    mockGetAdminListing.mockRejectedValue(new Error('Not found'))
    render(<AdminListingDetail listingId="listing-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-listing-detail-error')).toBeInTheDocument()
    })
  })

  it('displays artist info', async () => {
    mockGetAdminListing.mockResolvedValue(mockDetail)
    render(<AdminListingDetail listingId="listing-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-listing-detail')).toBeInTheDocument()
    })

    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
  })

  it('shows hide button for available listings', async () => {
    mockGetAdminListing.mockResolvedValue(mockDetail)
    render(<AdminListingDetail listingId="listing-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-listing-detail')).toBeInTheDocument()
    })

    expect(screen.getByTestId('hide-btn')).toBeInTheDocument()
    expect(screen.queryByTestId('unhide-btn')).not.toBeInTheDocument()
  })

  it('shows unhide button for hidden listings', async () => {
    mockGetAdminListing.mockResolvedValue({ ...mockDetail, status: 'hidden' })
    render(<AdminListingDetail listingId="listing-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-listing-detail')).toBeInTheDocument()
    })

    expect(screen.getByTestId('unhide-btn')).toBeInTheDocument()
    expect(screen.queryByTestId('hide-btn')).not.toBeInTheDocument()
  })

  it('calls hide with reason', async () => {
    mockGetAdminListing.mockResolvedValue(mockDetail)
    mockHideListing.mockResolvedValue({ message: 'Listing hidden successfully' })
    const user = userEvent.setup()
    render(<AdminListingDetail listingId="listing-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-listing-detail')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('hide-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('hide-reason-input')).toBeInTheDocument()
    })

    await user.type(screen.getByTestId('hide-reason-input'), 'Policy violation')
    await user.click(screen.getByTestId('confirm-hide-btn'))

    await waitFor(() => {
      expect(mockHideListing).toHaveBeenCalledWith('mock-token', 'listing-1', 'Policy violation')
    })
  })

  it('calls unhide', async () => {
    mockGetAdminListing.mockResolvedValue({ ...mockDetail, status: 'hidden' })
    mockUnhideListing.mockResolvedValue({ message: 'Listing unhidden successfully' })
    const user = userEvent.setup()
    render(<AdminListingDetail listingId="listing-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-listing-detail')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('unhide-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('confirm-unhide-btn')).toBeInTheDocument()
    })
    await user.click(screen.getByTestId('confirm-unhide-btn'))

    await waitFor(() => {
      expect(mockUnhideListing).toHaveBeenCalledWith('mock-token', 'listing-1')
    })
  })

  it('links to public listing page', async () => {
    mockGetAdminListing.mockResolvedValue(mockDetail)
    render(<AdminListingDetail listingId="listing-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-listing-detail')).toBeInTheDocument()
    })

    expect(screen.getByTestId('public-listing-link')).toHaveAttribute('href', '/artist/jane-doe/listing-1')
  })

  it('displays stats', async () => {
    mockGetAdminListing.mockResolvedValue(mockDetail)
    render(<AdminListingDetail listingId="listing-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-listing-detail')).toBeInTheDocument()
    })

    expect(screen.getByTestId('stat-orders')).toHaveTextContent('0')
    expect(screen.getByTestId('stat-reviews')).toHaveTextContent('0')
  })

  it('displays current tags', async () => {
    mockGetAdminListing.mockResolvedValue(mockDetail)
    render(<AdminListingDetail listingId="listing-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-listing-detail')).toBeInTheDocument()
    })

    expect(screen.getByTestId('listing-tags')).toBeInTheDocument()
    expect(screen.getByText('Functional')).toBeInTheDocument()
  })

  it('shows category reassignment select with current value', async () => {
    mockGetAdminListing.mockResolvedValue(mockDetail)
    render(<AdminListingDetail listingId="listing-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-listing-detail')).toBeInTheDocument()
    })

    const categorySelect = screen.getByTestId('category-select')
    expect(categorySelect).toBeInTheDocument()
    expect(categorySelect).toHaveValue('ceramics')
  })

  it('calls updateAdminListingCategory when category is changed', async () => {
    mockGetAdminListing.mockResolvedValue(mockDetail)
    mockUpdateAdminListingCategory.mockResolvedValue({ message: 'Listing updated successfully' })
    const user = userEvent.setup()
    render(<AdminListingDetail listingId="listing-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-listing-detail')).toBeInTheDocument()
    })

    const categorySelect = screen.getByTestId('category-select')
    await user.selectOptions(categorySelect, 'drawing_painting')

    await waitFor(() => {
      expect(mockUpdateAdminListingCategory).toHaveBeenCalledWith(
        'mock-token',
        'listing-1',
        'drawing_painting',
      )
    })
  })

  it('shows tag editing UI when edit tags button is clicked', async () => {
    mockGetAdminListing.mockResolvedValue(mockDetail)
    mockGetTagVocabulary.mockResolvedValue(mockTags)
    const user = userEvent.setup()
    render(<AdminListingDetail listingId="listing-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-listing-detail')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('edit-tags-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('tag-editor')).toBeInTheDocument()
    })
  })

  it('saves tag changes when save button is clicked', async () => {
    mockGetAdminListing.mockResolvedValue(mockDetail)
    mockGetTagVocabulary.mockResolvedValue(mockTags)
    mockUpdateAdminListingTags.mockResolvedValue({ tags: mockTags.slice(0, 2) })
    const user = userEvent.setup()
    render(<AdminListingDetail listingId="listing-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-listing-detail')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('edit-tags-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('tag-editor')).toBeInTheDocument()
    })

    // Toggle tag-2 (Sculptural) on
    const tag2Checkbox = screen.getByTestId('tag-checkbox-tag-2')
    await user.click(tag2Checkbox)

    await user.click(screen.getByTestId('save-tags-btn'))

    await waitFor(() => {
      expect(mockUpdateAdminListingTags).toHaveBeenCalledWith(
        'mock-token',
        'listing-1',
        expect.arrayContaining(['tag-1', 'tag-2']),
      )
    })
  })

  it('shows success message after category update', async () => {
    mockGetAdminListing.mockResolvedValue(mockDetail)
    mockUpdateAdminListingCategory.mockResolvedValue({ message: 'Listing updated successfully' })
    const user = userEvent.setup()
    render(<AdminListingDetail listingId="listing-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-listing-detail')).toBeInTheDocument()
    })

    const categorySelect = screen.getByTestId('category-select')
    await user.selectOptions(categorySelect, 'drawing_painting')

    await waitFor(() => {
      expect(screen.getByTestId('action-success')).toBeInTheDocument()
    })
  })
})
