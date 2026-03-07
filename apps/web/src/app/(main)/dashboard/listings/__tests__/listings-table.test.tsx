import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { MyListingListItem } from '@surfaced-art/types'

// Mock auth
const mockGetIdToken = vi.fn()
vi.mock('@/lib/auth', () => ({
  useAuth: () => ({
    getIdToken: mockGetIdToken,
  }),
}))

// Mock router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock API
const mockGetMyListings = vi.fn()
const mockDeleteMyListing = vi.fn()
vi.mock('@/lib/api', () => ({
  getMyListings: (...args: unknown[]) => mockGetMyListings(...args),
  deleteMyListing: (...args: unknown[]) => mockDeleteMyListing(...args),
}))

import { ListingsTable } from '../components/listings-table'

const mockListings: MyListingListItem[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    type: 'standard',
    title: 'Mountain Vase',
    medium: 'Stoneware clay',
    category: 'ceramics',
    price: 15000,
    status: 'available',
    isDocumented: false,
    quantityTotal: 1,
    quantityRemaining: 1,
    createdAt: '2025-06-01T00:00:00.000Z',
    updatedAt: '2025-06-01T00:00:00.000Z',
    primaryImage: {
      id: 'img-1',
      url: 'https://cdn.example.com/img1.jpg',
      isProcessPhoto: false,
      sortOrder: 0,
      width: null,
      height: null,
      createdAt: '2025-06-01T00:00:00.000Z',
    },
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    type: 'standard',
    title: 'Sunset Bowl',
    medium: 'Porcelain',
    category: 'ceramics',
    price: 8500,
    status: 'sold',
    isDocumented: false,
    quantityTotal: 1,
    quantityRemaining: 0,
    createdAt: '2025-05-15T00:00:00.000Z',
    updatedAt: '2025-05-20T00:00:00.000Z',
    primaryImage: null,
  },
]

const mockPaginatedResponse = {
  data: mockListings,
  meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
}

describe('ListingsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetIdToken.mockResolvedValue('test-token')
    mockGetMyListings.mockResolvedValue(mockPaginatedResponse)
    mockDeleteMyListing.mockResolvedValue(undefined)
  })

  it('should fetch and render listings on mount', async () => {
    render(<ListingsTable />)

    await waitFor(() => {
      expect(screen.getByText('Mountain Vase')).toBeInTheDocument()
    })

    expect(screen.getByText('Sunset Bowl')).toBeInTheDocument()
    expect(mockGetMyListings).toHaveBeenCalledWith('test-token', {})
  })

  it('should show empty state when no listings exist', async () => {
    mockGetMyListings.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
    })

    render(<ListingsTable />)

    await waitFor(() => {
      expect(screen.getByTestId('listings-empty-state')).toBeInTheDocument()
    })

    expect(screen.getByText(/create first listing/i)).toBeInTheDocument()
  })

  it('should display price in dollars', async () => {
    render(<ListingsTable />)

    await waitFor(() => {
      expect(screen.getByText('$150.00')).toBeInTheDocument()
    })

    expect(screen.getByText('$85.00')).toBeInTheDocument()
  })

  it('should display status badges', async () => {
    render(<ListingsTable />)

    await waitFor(() => {
      expect(screen.getByText('Mountain Vase')).toBeInTheDocument()
    })

    // Filter tabs and badges both show status labels;
    // "Available" appears in filter tab + badge, "Sold" in filter tab + badge
    const rows = screen.getAllByTestId('listing-row')
    expect(rows).toHaveLength(2)

    // Check that status labels appear somewhere within the listing rows
    const availableTexts = screen.getAllByText('Available')
    expect(availableTexts.length).toBeGreaterThanOrEqual(2)

    const soldTexts = screen.getAllByText('Sold')
    expect(soldTexts.length).toBeGreaterThanOrEqual(2)
  })

  it('should filter listings by status', async () => {
    render(<ListingsTable />)

    await waitFor(() => {
      expect(screen.getByText('Mountain Vase')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    const soldTab = screen.getByTestId('status-filter-sold')
    await user.click(soldTab)

    expect(mockGetMyListings).toHaveBeenCalledWith('test-token', { status: 'sold' })
  })

  it('should show "All" filter as active by default', async () => {
    render(<ListingsTable />)

    await waitFor(() => {
      expect(screen.getByText('Mountain Vase')).toBeInTheDocument()
    })

    const allTab = screen.getByTestId('status-filter-all')
    expect(allTab).toHaveAttribute('data-active', 'true')
  })

  it('should delete listing with inline confirmation', async () => {
    render(<ListingsTable />)

    await waitFor(() => {
      expect(screen.getByText('Mountain Vase')).toBeInTheDocument()
    })

    const user = userEvent.setup()

    // Click delete button
    const deleteButtons = screen.getAllByTestId('listing-delete-button')
    await user.click(deleteButtons[0])

    // Confirm button should appear
    const confirmButton = screen.getByTestId('listing-delete-confirm')
    expect(confirmButton).toBeInTheDocument()

    // Click confirm
    await user.click(confirmButton)

    await waitFor(() => {
      expect(mockDeleteMyListing).toHaveBeenCalledWith('test-token', '11111111-1111-4111-8111-111111111111')
    })
  })

  it('should cancel delete when clicking cancel', async () => {
    render(<ListingsTable />)

    await waitFor(() => {
      expect(screen.getByText('Mountain Vase')).toBeInTheDocument()
    })

    const user = userEvent.setup()

    // Click delete button
    const deleteButtons = screen.getAllByTestId('listing-delete-button')
    await user.click(deleteButtons[0])

    // Click cancel
    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)

    // Confirm should be gone
    expect(screen.queryByTestId('listing-delete-confirm')).not.toBeInTheDocument()
    expect(mockDeleteMyListing).not.toHaveBeenCalled()
  })

  it('should show loading skeleton while fetching', async () => {
    // Make the API call never resolve
    mockGetMyListings.mockReturnValue(new Promise(() => {}))

    render(<ListingsTable />)

    expect(screen.getByTestId('listings-skeleton')).toBeInTheDocument()
  })

  it('should show error state on API failure', async () => {
    mockGetMyListings.mockRejectedValue(new Error('Network error'))

    render(<ListingsTable />)

    await waitFor(() => {
      expect(screen.getByTestId('listings-error')).toBeInTheDocument()
    })
  })

  it('should show thumbnail for listings with primary image', async () => {
    render(<ListingsTable />)

    await waitFor(() => {
      expect(screen.getByText('Mountain Vase')).toBeInTheDocument()
    })

    const thumbnails = screen.getAllByTestId('listing-thumbnail')
    expect(thumbnails).toHaveLength(1) // Only Mountain Vase has an image
  })

  it('should navigate to new listing page', async () => {
    render(<ListingsTable />)

    await waitFor(() => {
      expect(screen.getByText('Mountain Vase')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    const newButton = screen.getByTestId('new-listing-button')
    await user.click(newButton)

    expect(mockPush).toHaveBeenCalledWith('/dashboard/listings/new')
  })

  it('should remove deleted listing from the list', async () => {
    render(<ListingsTable />)

    await waitFor(() => {
      expect(screen.getByText('Mountain Vase')).toBeInTheDocument()
    })

    const user = userEvent.setup()

    // Delete first listing
    const deleteButtons = screen.getAllByTestId('listing-delete-button')
    await user.click(deleteButtons[0])
    const confirmButton = screen.getByTestId('listing-delete-confirm')
    await user.click(confirmButton)

    await waitFor(() => {
      expect(screen.queryByText('Mountain Vase')).not.toBeInTheDocument()
    })

    // Second listing should still be there
    expect(screen.getByText('Sunset Bowl')).toBeInTheDocument()
  })
})
