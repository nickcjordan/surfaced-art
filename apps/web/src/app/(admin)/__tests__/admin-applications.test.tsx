import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// --- Mocks ---

let mockPathname = '/admin/applications'

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

const mockGetAdminApplications = vi.fn()
const mockGetAdminApplication = vi.fn()
const mockApproveApplication = vi.fn()
const mockRejectApplication = vi.fn()
const mockGetAdminUsers = vi.fn()

vi.mock('@/lib/api', () => ({
  getAdminApplications: (...args: unknown[]) => mockGetAdminApplications(...args),
  getAdminApplication: (...args: unknown[]) => mockGetAdminApplication(...args),
  approveApplication: (...args: unknown[]) => mockApproveApplication(...args),
  rejectApplication: (...args: unknown[]) => mockRejectApplication(...args),
  getAdminUsers: (...args: unknown[]) => mockGetAdminUsers(...args),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockPathname = '/admin/applications'
  mockAuth.getIdToken.mockResolvedValue('mock-token')
})

// --- Application List Tests ---

describe('AdminApplicationList', () => {
  let AdminApplicationList: React.ComponentType

  beforeEach(async () => {
    const mod = await import('../admin/applications/application-list')
    AdminApplicationList = mod.AdminApplicationList
  })

  const mockApplications = {
    data: [
      {
        id: 'app-1',
        email: 'artist1@example.com',
        fullName: 'Jane Doe',
        categories: ['ceramics'] as string[],
        status: 'pending',
        submittedAt: '2026-03-01T00:00:00Z',
        reviewedBy: null,
        reviewedAt: null,
        reviewerName: null,
      },
      {
        id: 'app-2',
        email: 'artist2@example.com',
        fullName: 'John Smith',
        categories: ['painting', 'sculpture'] as string[],
        status: 'approved',
        submittedAt: '2026-02-15T00:00:00Z',
        reviewedBy: 'admin-1',
        reviewedAt: '2026-02-20T00:00:00Z',
        reviewerName: 'Admin User',
      },
    ],
    meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
  }

  it('renders the application list with data', async () => {
    mockGetAdminApplications.mockResolvedValue(mockApplications)
    render(<AdminApplicationList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-application-list')).toBeInTheDocument()
    })

    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('artist1@example.com')).toBeInTheDocument()
    expect(screen.getByText('John Smith')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    mockGetAdminApplications.mockReturnValue(new Promise(() => {}))
    render(<AdminApplicationList />)

    expect(screen.getByTestId('admin-applications-loading')).toBeInTheDocument()
  })

  it('shows error state on API failure', async () => {
    mockGetAdminApplications.mockRejectedValue(new Error('Network error'))
    render(<AdminApplicationList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-applications-error')).toBeInTheDocument()
    })
  })

  it('shows empty state when no applications found', async () => {
    mockGetAdminApplications.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })
    render(<AdminApplicationList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-applications-empty')).toBeInTheDocument()
    })
  })

  it('displays status badges', async () => {
    mockGetAdminApplications.mockResolvedValue(mockApplications)
    render(<AdminApplicationList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-application-list')).toBeInTheDocument()
    })

    const pendingRow = screen.getByTestId('admin-application-row-app-1')
    expect(within(pendingRow).getByText('pending')).toBeInTheDocument()

    const approvedRow = screen.getByTestId('admin-application-row-app-2')
    expect(within(approvedRow).getByText('approved')).toBeInTheDocument()
  })

  it('renders status filter', async () => {
    mockGetAdminApplications.mockResolvedValue(mockApplications)
    render(<AdminApplicationList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-application-list')).toBeInTheDocument()
    })

    expect(screen.getByTestId('admin-applications-status-filter')).toBeInTheDocument()
  })

  it('calls API with status filter when changed', async () => {
    mockGetAdminApplications.mockResolvedValue(mockApplications)
    const user = userEvent.setup()
    render(<AdminApplicationList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-application-list')).toBeInTheDocument()
    })

    const statusFilter = screen.getByTestId('admin-applications-status-filter')
    await user.selectOptions(statusFilter, 'pending')

    await waitFor(() => {
      expect(mockGetAdminApplications).toHaveBeenCalledWith(
        'mock-token',
        expect.objectContaining({ status: 'pending' }),
      )
    })
  })

  it('links each row to application detail page', async () => {
    mockGetAdminApplications.mockResolvedValue(mockApplications)
    render(<AdminApplicationList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-application-list')).toBeInTheDocument()
    })

    const row = screen.getByTestId('admin-application-row-app-1')
    const link = within(row).getByRole('link')
    expect(link).toHaveAttribute('href', '/admin/applications/app-1')
  })

  it('renders pagination when multiple pages', async () => {
    mockGetAdminApplications.mockResolvedValue({
      data: mockApplications.data,
      meta: { page: 1, limit: 20, total: 50, totalPages: 3 },
    })
    render(<AdminApplicationList />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-applications-pagination')).toBeInTheDocument()
    })
  })
})

// --- Application Detail Tests ---

describe('AdminApplicationDetail', () => {
  let AdminApplicationDetail: React.ComponentType<{ applicationId: string }>

  beforeEach(async () => {
    const mod = await import('../admin/applications/[id]/application-detail')
    AdminApplicationDetail = mod.AdminApplicationDetail
  })

  const mockDetail = {
    id: 'app-1',
    email: 'artist1@example.com',
    fullName: 'Jane Doe',
    instagramUrl: 'https://instagram.com/janedoe',
    websiteUrl: 'https://janedoe.art',
    statement: 'I create ceramic vessels inspired by nature.',
    exhibitionHistory: 'Gallery A, Gallery B',
    categories: ['ceramics'] as string[],
    status: 'pending',
    submittedAt: '2026-03-01T00:00:00Z',
    reviewedBy: null,
    reviewedAt: null,
    reviewerName: null,
    reviewNotes: null,
  }

  it('renders application detail', async () => {
    mockGetAdminApplication.mockResolvedValue(mockDetail)
    render(<AdminApplicationDetail applicationId="app-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-application-detail')).toBeInTheDocument()
    })

    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('artist1@example.com')).toBeInTheDocument()
    expect(screen.getByText('I create ceramic vessels inspired by nature.')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    mockGetAdminApplication.mockReturnValue(new Promise(() => {}))
    render(<AdminApplicationDetail applicationId="app-1" />)

    expect(screen.getByTestId('admin-application-detail-loading')).toBeInTheDocument()
  })

  it('shows error state on API failure', async () => {
    mockGetAdminApplication.mockRejectedValue(new Error('Not found'))
    render(<AdminApplicationDetail applicationId="app-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-application-detail-error')).toBeInTheDocument()
    })
  })

  it('shows approve and reject buttons for pending applications', async () => {
    mockGetAdminApplication.mockResolvedValue(mockDetail)
    render(<AdminApplicationDetail applicationId="app-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-application-detail')).toBeInTheDocument()
    })

    expect(screen.getByTestId('approve-btn')).toBeInTheDocument()
    expect(screen.getByTestId('reject-btn')).toBeInTheDocument()
  })

  it('does not show approve/reject for already reviewed applications', async () => {
    mockGetAdminApplication.mockResolvedValue({
      ...mockDetail,
      status: 'approved',
      reviewedBy: 'admin-1',
      reviewedAt: '2026-03-05T00:00:00Z',
      reviewerName: 'Admin User',
    })
    render(<AdminApplicationDetail applicationId="app-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-application-detail')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('approve-btn')).not.toBeInTheDocument()
    expect(screen.queryByTestId('reject-btn')).not.toBeInTheDocument()
  })

  it('displays external links', async () => {
    mockGetAdminApplication.mockResolvedValue(mockDetail)
    render(<AdminApplicationDetail applicationId="app-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-application-detail')).toBeInTheDocument()
    })

    expect(screen.getByTestId('instagram-link')).toHaveAttribute('href', 'https://instagram.com/janedoe')
    expect(screen.getByTestId('website-link')).toHaveAttribute('href', 'https://janedoe.art')
  })

  it('calls approve when approve button clicked', async () => {
    mockGetAdminApplication.mockResolvedValue(mockDetail)
    // User lookup by email to get userId
    mockGetAdminUsers.mockResolvedValue({
      data: [{ id: 'user-1', email: 'artist1@example.com', fullName: 'Jane Doe', roles: ['buyer'], createdAt: '2026-01-01T00:00:00Z', lastActiveAt: null, hasArtistProfile: false }],
      meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
    })
    mockApproveApplication.mockResolvedValue({
      message: 'Artist application approved successfully',
      profile: { id: 'profile-1', slug: 'jane-doe', displayName: 'Jane Doe' },
    })
    const user = userEvent.setup()
    render(<AdminApplicationDetail applicationId="app-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-application-detail')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('approve-btn'))

    // Should show confirmation
    await waitFor(() => {
      expect(screen.getByTestId('confirm-approve-btn')).toBeInTheDocument()
    })
    await user.click(screen.getByTestId('confirm-approve-btn'))

    await waitFor(() => {
      expect(mockApproveApplication).toHaveBeenCalledWith('mock-token', 'user-1', undefined)
    })
  })

  it('calls reject with notes when reject button clicked', async () => {
    mockGetAdminApplication.mockResolvedValue(mockDetail)
    mockGetAdminUsers.mockResolvedValue({
      data: [{ id: 'user-1', email: 'artist1@example.com', fullName: 'Jane Doe', roles: ['buyer'], createdAt: '2026-01-01T00:00:00Z', lastActiveAt: null, hasArtistProfile: false }],
      meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
    })
    mockRejectApplication.mockResolvedValue({ message: 'Artist application rejected' })
    const user = userEvent.setup()
    render(<AdminApplicationDetail applicationId="app-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-application-detail')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('reject-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('reject-notes-input')).toBeInTheDocument()
    })

    await user.type(screen.getByTestId('reject-notes-input'), 'Portfolio not strong enough')
    await user.click(screen.getByTestId('confirm-reject-btn'))

    await waitFor(() => {
      expect(mockRejectApplication).toHaveBeenCalledWith('mock-token', 'user-1', 'Portfolio not strong enough')
    })
  })

  it('shows error when applicant has no user account', async () => {
    mockGetAdminApplication.mockResolvedValue(mockDetail)
    mockGetAdminUsers.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 1, total: 0, totalPages: 0 },
    })
    const user = userEvent.setup()
    render(<AdminApplicationDetail applicationId="app-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-application-detail')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('approve-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('confirm-approve-btn')).toBeInTheDocument()
    })
    await user.click(screen.getByTestId('confirm-approve-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('action-error')).toBeInTheDocument()
    })
  })
})
