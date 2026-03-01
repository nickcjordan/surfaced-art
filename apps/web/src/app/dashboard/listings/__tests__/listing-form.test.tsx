import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { MyListingResponse } from '@surfaced-art/types'

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
const mockCreateMyListing = vi.fn()
const mockUpdateMyListing = vi.fn()
const mockGetMyListing = vi.fn()
vi.mock('@/lib/api', () => ({
  createMyListing: (...args: unknown[]) => mockCreateMyListing(...args),
  updateMyListing: (...args: unknown[]) => mockUpdateMyListing(...args),
  getMyListing: (...args: unknown[]) => mockGetMyListing(...args),
}))

import { ListingForm } from '../components/listing-form'

const LISTING_ID = '11111111-1111-4111-8111-111111111111'

const mockListingResponse: MyListingResponse = {
  id: LISTING_ID,
  type: 'standard',
  title: 'Mountain Vase',
  description: 'A beautiful handmade vase inspired by mountain landscapes.',
  medium: 'Stoneware clay',
  category: 'ceramics',
  price: 15000,
  status: 'available',
  isDocumented: false,
  quantityTotal: 1,
  quantityRemaining: 1,
  artworkLength: 8,
  artworkWidth: 6,
  artworkHeight: 12,
  packedLength: 12,
  packedWidth: 10,
  packedHeight: 16,
  packedWeight: 5.5,
  editionNumber: null,
  editionTotal: null,
  reservedUntil: null,
  createdAt: '2025-06-01T00:00:00.000Z',
  updatedAt: '2025-06-01T00:00:00.000Z',
  images: [],
}

const createdResponse: MyListingResponse = {
  ...mockListingResponse,
  id: '33333333-3333-4333-8333-333333333333',
}

describe('ListingForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetIdToken.mockResolvedValue('test-token')
    mockCreateMyListing.mockResolvedValue(createdResponse)
    mockUpdateMyListing.mockResolvedValue(mockListingResponse)
    mockGetMyListing.mockResolvedValue(mockListingResponse)
  })

  describe('Create mode', () => {
    it('should render all form fields', () => {
      render(<ListingForm mode="create" />)

      expect(screen.getByTestId('listing-form')).toBeInTheDocument()
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/medium/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/type/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/price/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/packed length/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/packed width/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/packed height/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/packed weight/i)).toBeInTheDocument()
    })

    it('should show "Create Listing" submit button', () => {
      render(<ListingForm mode="create" />)
      expect(screen.getByTestId('listing-form-submit')).toHaveTextContent('Create Listing')
    })

    it('should submit form with dollars converted to cents', async () => {
      const user = userEvent.setup()
      render(<ListingForm mode="create" />)

      // Fill required fields
      await user.type(screen.getByLabelText(/title/i), 'Test Vase')
      await user.type(screen.getByLabelText(/description/i), 'A beautiful vase')
      await user.type(screen.getByLabelText(/medium/i), 'Stoneware')
      await user.selectOptions(screen.getByLabelText(/category/i), 'ceramics')
      await user.selectOptions(screen.getByLabelText(/type/i), 'standard')
      await user.type(screen.getByLabelText(/price/i), '150.00')
      await user.type(screen.getByLabelText(/packed length/i), '12')
      await user.type(screen.getByLabelText(/packed width/i), '10')
      await user.type(screen.getByLabelText(/packed height/i), '8')
      await user.type(screen.getByLabelText(/packed weight/i), '5')

      await user.click(screen.getByTestId('listing-form-submit'))

      await waitFor(() => {
        expect(mockCreateMyListing).toHaveBeenCalledWith('test-token', expect.objectContaining({
          title: 'Test Vase',
          description: 'A beautiful vase',
          medium: 'Stoneware',
          category: 'ceramics',
          type: 'standard',
          price: 15000, // $150.00 → 15000 cents
          packedLength: 12,
          packedWidth: 10,
          packedHeight: 8,
          packedWeight: 5,
        }))
      })
    })

    it('should redirect to listings page on successful create', async () => {
      const user = userEvent.setup()
      render(<ListingForm mode="create" />)

      await user.type(screen.getByLabelText(/title/i), 'Test Vase')
      await user.type(screen.getByLabelText(/description/i), 'A beautiful vase')
      await user.type(screen.getByLabelText(/medium/i), 'Stoneware')
      await user.selectOptions(screen.getByLabelText(/category/i), 'ceramics')
      await user.selectOptions(screen.getByLabelText(/type/i), 'standard')
      await user.type(screen.getByLabelText(/price/i), '150')
      await user.type(screen.getByLabelText(/packed length/i), '12')
      await user.type(screen.getByLabelText(/packed width/i), '10')
      await user.type(screen.getByLabelText(/packed height/i), '8')
      await user.type(screen.getByLabelText(/packed weight/i), '5')

      await user.click(screen.getByTestId('listing-form-submit'))

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/listings')
      })
    })

    it('should show validation error for missing required fields', async () => {
      const user = userEvent.setup()
      render(<ListingForm mode="create" />)

      // Submit without filling anything
      await user.click(screen.getByTestId('listing-form-submit'))

      await waitFor(() => {
        expect(screen.getByTestId('listing-form-error')).toBeInTheDocument()
      })

      expect(mockCreateMyListing).not.toHaveBeenCalled()
    })

    it('should include optional artwork dimensions when provided', async () => {
      const user = userEvent.setup()
      render(<ListingForm mode="create" />)

      await user.type(screen.getByLabelText(/title/i), 'Test Piece')
      await user.type(screen.getByLabelText(/description/i), 'Artwork with dimensions')
      await user.type(screen.getByLabelText(/medium/i), 'Clay')
      await user.selectOptions(screen.getByLabelText(/category/i), 'ceramics')
      await user.selectOptions(screen.getByLabelText(/type/i), 'standard')
      await user.type(screen.getByLabelText(/price/i), '100')
      await user.type(screen.getByLabelText(/artwork length/i), '8')
      await user.type(screen.getByLabelText(/artwork width/i), '6')
      await user.type(screen.getByLabelText(/artwork height/i), '12')
      await user.type(screen.getByLabelText(/packed length/i), '12')
      await user.type(screen.getByLabelText(/packed width/i), '10')
      await user.type(screen.getByLabelText(/packed height/i), '16')
      await user.type(screen.getByLabelText(/packed weight/i), '5')

      await user.click(screen.getByTestId('listing-form-submit'))

      await waitFor(() => {
        expect(mockCreateMyListing).toHaveBeenCalledWith('test-token', expect.objectContaining({
          artworkLength: 8,
          artworkWidth: 6,
          artworkHeight: 12,
        }))
      })
    })

    it('should include edition info when provided', async () => {
      const user = userEvent.setup()
      render(<ListingForm mode="create" />)

      await user.type(screen.getByLabelText(/title/i), 'Limited Print')
      await user.type(screen.getByLabelText(/description/i), 'Edition print')
      await user.type(screen.getByLabelText(/medium/i), 'Ink on paper')
      await user.selectOptions(screen.getByLabelText(/category/i), 'print')
      await user.selectOptions(screen.getByLabelText(/type/i), 'standard')
      await user.type(screen.getByLabelText(/price/i), '75')
      await user.type(screen.getByLabelText(/packed length/i), '20')
      await user.type(screen.getByLabelText(/packed width/i), '16')
      await user.type(screen.getByLabelText(/packed height/i), '2')
      await user.type(screen.getByLabelText(/packed weight/i), '1')
      await user.type(screen.getByLabelText(/edition number/i), '3')
      await user.type(screen.getByLabelText(/edition total/i), '50')

      await user.click(screen.getByTestId('listing-form-submit'))

      await waitFor(() => {
        expect(mockCreateMyListing).toHaveBeenCalledWith('test-token', expect.objectContaining({
          editionNumber: 3,
          editionTotal: 50,
        }))
      })
    })

    it('should show server error on API failure', async () => {
      mockCreateMyListing.mockRejectedValue(new Error('Server error'))
      const user = userEvent.setup()
      render(<ListingForm mode="create" />)

      await user.type(screen.getByLabelText(/title/i), 'Test')
      await user.type(screen.getByLabelText(/description/i), 'Test description')
      await user.type(screen.getByLabelText(/medium/i), 'Clay')
      await user.selectOptions(screen.getByLabelText(/category/i), 'ceramics')
      await user.selectOptions(screen.getByLabelText(/type/i), 'standard')
      await user.type(screen.getByLabelText(/price/i), '50')
      await user.type(screen.getByLabelText(/packed length/i), '10')
      await user.type(screen.getByLabelText(/packed width/i), '8')
      await user.type(screen.getByLabelText(/packed height/i), '6')
      await user.type(screen.getByLabelText(/packed weight/i), '3')

      await user.click(screen.getByTestId('listing-form-submit'))

      await waitFor(() => {
        expect(screen.getByTestId('listing-form-error')).toBeInTheDocument()
      })

      expect(screen.getByText(/server error/i)).toBeInTheDocument()
    })

    it('should disable submit button while submitting', async () => {
      mockCreateMyListing.mockReturnValue(new Promise(() => {}))
      const user = userEvent.setup()
      render(<ListingForm mode="create" />)

      await user.type(screen.getByLabelText(/title/i), 'Test')
      await user.type(screen.getByLabelText(/description/i), 'Test description')
      await user.type(screen.getByLabelText(/medium/i), 'Clay')
      await user.selectOptions(screen.getByLabelText(/category/i), 'ceramics')
      await user.selectOptions(screen.getByLabelText(/type/i), 'standard')
      await user.type(screen.getByLabelText(/price/i), '50')
      await user.type(screen.getByLabelText(/packed length/i), '10')
      await user.type(screen.getByLabelText(/packed width/i), '8')
      await user.type(screen.getByLabelText(/packed height/i), '6')
      await user.type(screen.getByLabelText(/packed weight/i), '3')

      await user.click(screen.getByTestId('listing-form-submit'))

      await waitFor(() => {
        expect(screen.getByTestId('listing-form-submit')).toBeDisabled()
      })
      expect(screen.getByTestId('listing-form-submit')).toHaveTextContent(/saving/i)
    })

    it('should set quantity when provided', async () => {
      const user = userEvent.setup()
      render(<ListingForm mode="create" />)

      await user.type(screen.getByLabelText(/title/i), 'Batch Item')
      await user.type(screen.getByLabelText(/description/i), 'Multiple available')
      await user.type(screen.getByLabelText(/medium/i), 'Clay')
      await user.selectOptions(screen.getByLabelText(/category/i), 'ceramics')
      await user.selectOptions(screen.getByLabelText(/type/i), 'standard')
      await user.type(screen.getByLabelText(/price/i), '50')
      await user.type(screen.getByLabelText(/packed length/i), '10')
      await user.type(screen.getByLabelText(/packed width/i), '8')
      await user.type(screen.getByLabelText(/packed height/i), '6')
      await user.type(screen.getByLabelText(/packed weight/i), '3')

      // Clear default value and type new quantity
      const qtyInput = screen.getByLabelText(/quantity/i)
      await user.clear(qtyInput)
      await user.type(qtyInput, '5')

      await user.click(screen.getByTestId('listing-form-submit'))

      await waitFor(() => {
        expect(mockCreateMyListing).toHaveBeenCalledWith('test-token', expect.objectContaining({
          quantityTotal: 5,
        }))
      })
    })
  })

  describe('Edit mode', () => {
    it('should fetch and pre-fill listing data', async () => {
      render(<ListingForm mode="edit" listingId={LISTING_ID} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toHaveValue('Mountain Vase')
      })

      expect(screen.getByLabelText(/description/i)).toHaveValue(
        'A beautiful handmade vase inspired by mountain landscapes.'
      )
      expect(screen.getByLabelText(/medium/i)).toHaveValue('Stoneware clay')
      expect(screen.getByLabelText(/category/i)).toHaveValue('ceramics')
      expect(screen.getByLabelText(/type/i)).toHaveValue('standard')
      // Price should be displayed in dollars (15000 cents → 150.00)
      expect(screen.getByLabelText(/price/i)).toHaveValue(150)
      expect(screen.getByLabelText(/packed length/i)).toHaveValue(12)
      expect(screen.getByLabelText(/packed width/i)).toHaveValue(10)
      expect(screen.getByLabelText(/packed height/i)).toHaveValue(16)
      expect(screen.getByLabelText(/packed weight/i)).toHaveValue(5.5)

      expect(mockGetMyListing).toHaveBeenCalledWith('test-token', LISTING_ID)
    })

    it('should pre-fill artwork dimensions', async () => {
      render(<ListingForm mode="edit" listingId={LISTING_ID} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toHaveValue('Mountain Vase')
      })

      expect(screen.getByLabelText(/artwork length/i)).toHaveValue(8)
      expect(screen.getByLabelText(/artwork width/i)).toHaveValue(6)
      expect(screen.getByLabelText(/artwork height/i)).toHaveValue(12)
    })

    it('should show "Save Changes" submit button', async () => {
      render(<ListingForm mode="edit" listingId={LISTING_ID} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toHaveValue('Mountain Vase')
      })

      expect(screen.getByTestId('listing-form-submit')).toHaveTextContent('Save Changes')
    })

    it('should call updateMyListing on submit', async () => {
      const user = userEvent.setup()
      render(<ListingForm mode="edit" listingId={LISTING_ID} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toHaveValue('Mountain Vase')
      })

      // Change title
      const titleInput = screen.getByLabelText(/title/i)
      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Vase')

      await user.click(screen.getByTestId('listing-form-submit'))

      await waitFor(() => {
        expect(mockUpdateMyListing).toHaveBeenCalledWith(
          'test-token',
          LISTING_ID,
          expect.objectContaining({
            title: 'Updated Vase',
          }),
        )
      })
    })

    it('should redirect to listings page on successful update', async () => {
      const user = userEvent.setup()
      render(<ListingForm mode="edit" listingId={LISTING_ID} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toHaveValue('Mountain Vase')
      })

      await user.click(screen.getByTestId('listing-form-submit'))

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/listings')
      })
    })

    it('should show loading skeleton while fetching', () => {
      mockGetMyListing.mockReturnValue(new Promise(() => {}))
      render(<ListingForm mode="edit" listingId={LISTING_ID} />)

      expect(screen.getByTestId('listing-form-skeleton')).toBeInTheDocument()
    })

    it('should show error state on fetch failure', async () => {
      mockGetMyListing.mockRejectedValue(new Error('Not found'))
      render(<ListingForm mode="edit" listingId={LISTING_ID} />)

      await waitFor(() => {
        expect(screen.getByTestId('listing-form-fetch-error')).toBeInTheDocument()
      })

      expect(screen.getByText(/not found/i)).toBeInTheDocument()
    })

    it('should convert price from cents to dollars on load', async () => {
      render(<ListingForm mode="edit" listingId={LISTING_ID} />)

      await waitFor(() => {
        // 15000 cents should display as 150 (the number input value)
        expect(screen.getByLabelText(/price/i)).toHaveValue(150)
      })
    })
  })
})
