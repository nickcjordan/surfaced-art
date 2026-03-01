import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { MyListingImageResponse } from '@surfaced-art/types'

// Mock auth
const mockGetIdToken = vi.fn()
vi.mock('@/lib/auth', () => ({
  useAuth: () => ({
    getIdToken: mockGetIdToken,
  }),
}))

// Mock API
const mockAddListingImage = vi.fn()
const mockDeleteListingImage = vi.fn()
const mockReorderListingImages = vi.fn()
const mockGetPresignedUrl = vi.fn()
vi.mock('@/lib/api', () => ({
  addListingImage: (...args: unknown[]) => mockAddListingImage(...args),
  deleteListingImage: (...args: unknown[]) => mockDeleteListingImage(...args),
  reorderListingImages: (...args: unknown[]) => mockReorderListingImages(...args),
  getPresignedUrl: (...args: unknown[]) => mockGetPresignedUrl(...args),
}))

// Mock upload utils
const mockValidateFile = vi.fn()
const mockUploadToS3 = vi.fn()
vi.mock('@/lib/upload', () => ({
  validateFile: (...args: unknown[]) => mockValidateFile(...args),
  uploadToS3: (...args: unknown[]) => mockUploadToS3(...args),
  UploadError: class extends Error {
    code: string
    constructor(code: string, message: string) {
      super(message)
      this.code = code
    }
  },
}))

import { ListingImages } from '../components/listing-images'

const LISTING_ID = '11111111-1111-4111-8111-111111111111'

const mockImages: MyListingImageResponse[] = [
  {
    id: 'img-1',
    url: 'https://cdn.example.com/image1.jpg',
    isProcessPhoto: false,
    sortOrder: 0,
    createdAt: '2025-06-01T00:00:00.000Z',
  },
  {
    id: 'img-2',
    url: 'https://cdn.example.com/image2.jpg',
    isProcessPhoto: true,
    sortOrder: 1,
    createdAt: '2025-06-02T00:00:00.000Z',
  },
]

describe('ListingImages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetIdToken.mockResolvedValue('test-token')
    mockDeleteListingImage.mockResolvedValue(undefined)
    mockReorderListingImages.mockResolvedValue(mockImages)

    // Mock environment variable
    vi.stubEnv('NEXT_PUBLIC_CLOUDFRONT_DOMAIN', 'cdn.example.com')
  })

  it('should render images passed as props', () => {
    render(
      <ListingImages
        listingId={LISTING_ID}
        images={mockImages}
        onImagesChange={() => {}}
      />,
    )

    const imageItems = screen.getAllByTestId('listing-image-item')
    expect(imageItems).toHaveLength(2)
  })

  it('should show empty state when no images', () => {
    render(
      <ListingImages
        listingId={LISTING_ID}
        images={[]}
        onImagesChange={() => {}}
      />,
    )

    expect(screen.getByTestId('listing-images-empty')).toBeInTheDocument()
  })

  it('should show process photo badge for process photos', () => {
    render(
      <ListingImages
        listingId={LISTING_ID}
        images={mockImages}
        onImagesChange={() => {}}
      />,
    )

    const processPhotoBadges = screen.getAllByText('Process')
    expect(processPhotoBadges).toHaveLength(1)
  })

  it('should delete image with confirmation', async () => {
    const onImagesChange = vi.fn()
    const user = userEvent.setup()

    render(
      <ListingImages
        listingId={LISTING_ID}
        images={mockImages}
        onImagesChange={onImagesChange}
      />,
    )

    // Click delete on first image
    const deleteButtons = screen.getAllByTestId('image-delete-button')
    await user.click(deleteButtons[0])

    // Confirm
    const confirmButton = screen.getByTestId('image-delete-confirm')
    await user.click(confirmButton)

    await waitFor(() => {
      expect(mockDeleteListingImage).toHaveBeenCalledWith('test-token', LISTING_ID, 'img-1')
    })

    expect(onImagesChange).toHaveBeenCalledWith([mockImages[1]])
  })

  it('should cancel delete', async () => {
    const user = userEvent.setup()

    render(
      <ListingImages
        listingId={LISTING_ID}
        images={mockImages}
        onImagesChange={() => {}}
      />,
    )

    const deleteButtons = screen.getAllByTestId('image-delete-button')
    await user.click(deleteButtons[0])

    // Cancel
    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)

    expect(screen.queryByTestId('image-delete-confirm')).not.toBeInTheDocument()
    expect(mockDeleteListingImage).not.toHaveBeenCalled()
  })

  it('should move image up', async () => {
    const onImagesChange = vi.fn()
    const user = userEvent.setup()

    mockReorderListingImages.mockResolvedValue([mockImages[1], mockImages[0]])

    render(
      <ListingImages
        listingId={LISTING_ID}
        images={mockImages}
        onImagesChange={onImagesChange}
      />,
    )

    // Move second image up
    const moveUpButtons = screen.getAllByLabelText('Move up')
    await user.click(moveUpButtons[1])

    await waitFor(() => {
      expect(mockReorderListingImages).toHaveBeenCalledWith(
        'test-token',
        LISTING_ID,
        ['img-2', 'img-1'],
      )
    })
  })

  it('should move image down', async () => {
    const onImagesChange = vi.fn()
    const user = userEvent.setup()

    mockReorderListingImages.mockResolvedValue([mockImages[1], mockImages[0]])

    render(
      <ListingImages
        listingId={LISTING_ID}
        images={mockImages}
        onImagesChange={onImagesChange}
      />,
    )

    // Move first image down
    const moveDownButtons = screen.getAllByLabelText('Move down')
    await user.click(moveDownButtons[0])

    await waitFor(() => {
      expect(mockReorderListingImages).toHaveBeenCalledWith(
        'test-token',
        LISTING_ID,
        ['img-2', 'img-1'],
      )
    })
  })

  it('should disable move up on first image', () => {
    render(
      <ListingImages
        listingId={LISTING_ID}
        images={mockImages}
        onImagesChange={() => {}}
      />,
    )

    const moveUpButtons = screen.getAllByLabelText('Move up')
    expect(moveUpButtons[0]).toBeDisabled()
  })

  it('should disable move down on last image', () => {
    render(
      <ListingImages
        listingId={LISTING_ID}
        images={mockImages}
        onImagesChange={() => {}}
      />,
    )

    const moveDownButtons = screen.getAllByLabelText('Move down')
    expect(moveDownButtons[moveDownButtons.length - 1]).toBeDisabled()
  })

  it('should show upload button', () => {
    render(
      <ListingImages
        listingId={LISTING_ID}
        images={mockImages}
        onImagesChange={() => {}}
      />,
    )

    expect(screen.getByTestId('image-upload-input')).toBeInTheDocument()
  })

  it('should mark first image as thumbnail', () => {
    render(
      <ListingImages
        listingId={LISTING_ID}
        images={mockImages}
        onImagesChange={() => {}}
      />,
    )

    expect(screen.getByText('Thumbnail')).toBeInTheDocument()
  })
})
