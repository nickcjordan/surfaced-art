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
const mockUpdateListingAvailability = vi.fn()
vi.mock('@/lib/api', () => ({
  getMyListings: (...args: unknown[]) => mockGetMyListings(...args),
  deleteMyListing: (...args: unknown[]) => mockDeleteMyListing(...args),
  updateListingAvailability: (...args: unknown[]) => mockUpdateListingAvailability(...args),
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
    primaryImage: null,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    type: 'standard',
    title: 'Sold Piece',
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
  {
    id: '33333333-3333-4333-8333-333333333333',
    type: 'standard',
    title: 'Reserved Vase',
    medium: 'Clay',
    category: 'ceramics',
    price: 12000,
    status: 'reserved_artist',
    isDocumented: false,
    quantityTotal: 1,
    quantityRemaining: 1,
    createdAt: '2025-05-10T00:00:00.000Z',
    updatedAt: '2025-05-10T00:00:00.000Z',
    primaryImage: null,
  },
]

describe('ListingsTable — Availability Toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetIdToken.mockResolvedValue('test-token')
    mockGetMyListings.mockResolvedValue({
      data: mockListings,
      meta: { page: 1, limit: 20, total: 3, totalPages: 1 },
    })
    mockDeleteMyListing.mockResolvedValue(undefined)
    mockUpdateListingAvailability.mockResolvedValue({
      ...mockListings[0],
      status: 'reserved_artist',
    })
  })

  it('should show availability toggle for available listings', async () => {
    render(<ListingsTable />)

    await waitFor(() => {
      expect(screen.getByText('Mountain Vase')).toBeInTheDocument()
    })

    const toggleButtons = screen.getAllByTestId('availability-toggle')
    // Available and reserved_artist should have toggle buttons; sold should not
    expect(toggleButtons.length).toBeGreaterThanOrEqual(2)
  })

  it('should not show availability toggle for sold listings', async () => {
    render(<ListingsTable />)

    await waitFor(() => {
      expect(screen.getByText('Mountain Vase')).toBeInTheDocument()
    })

    // Find the sold listing row and verify no toggle
    const rows = screen.getAllByTestId('listing-row')
    const soldRow = rows.find((r) => r.textContent?.includes('Sold Piece'))
    expect(soldRow).toBeDefined()

    // The sold row should not contain an availability toggle
    const allToggles = screen.getAllByTestId('availability-toggle')
    // Mountain Vase (available) and Reserved Vase (reserved_artist) have toggles = 2
    // Sold Piece does not = 0 toggle in that row
    expect(allToggles).toHaveLength(2)
  })

  it('should toggle available listing to reserved', async () => {
    const user = userEvent.setup()
    render(<ListingsTable />)

    await waitFor(() => {
      expect(screen.getByText('Mountain Vase')).toBeInTheDocument()
    })

    // Click toggle on the available listing (first toggle)
    const toggleButtons = screen.getAllByTestId('availability-toggle')
    await user.click(toggleButtons[0])

    await waitFor(() => {
      expect(mockUpdateListingAvailability).toHaveBeenCalledWith(
        'test-token',
        '11111111-1111-4111-8111-111111111111',
        { status: 'reserved_artist' },
      )
    })
  })

  it('should toggle reserved listing to available', async () => {
    mockUpdateListingAvailability.mockResolvedValue({
      ...mockListings[2],
      status: 'available',
    })

    const user = userEvent.setup()
    render(<ListingsTable />)

    await waitFor(() => {
      expect(screen.getByText('Reserved Vase')).toBeInTheDocument()
    })

    // Click toggle on the reserved listing (second toggle)
    const toggleButtons = screen.getAllByTestId('availability-toggle')
    await user.click(toggleButtons[1])

    await waitFor(() => {
      expect(mockUpdateListingAvailability).toHaveBeenCalledWith(
        'test-token',
        '33333333-3333-4333-8333-333333333333',
        { status: 'available' },
      )
    })
  })

  it('should show "Reserve" text for available listings and "Unreserve" for reserved', async () => {
    render(<ListingsTable />)

    await waitFor(() => {
      expect(screen.getByText('Mountain Vase')).toBeInTheDocument()
    })

    const toggleButtons = screen.getAllByTestId('availability-toggle')
    expect(toggleButtons[0]).toHaveTextContent('Reserve')
    expect(toggleButtons[1]).toHaveTextContent('Unreserve')
  })
})
