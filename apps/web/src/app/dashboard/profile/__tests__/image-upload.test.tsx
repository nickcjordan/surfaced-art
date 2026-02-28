import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock auth
const mockGetIdToken = vi.fn()
vi.mock('@/lib/auth', () => ({
  useAuth: () => ({
    user: { email: 'artist@test.com', name: 'Test Artist' },
    loading: false,
    getIdToken: mockGetIdToken,
  }),
}))

// Mock API
const mockGetPresignedUrl = vi.fn()
vi.mock('@/lib/api', () => ({
  getPresignedUrl: (...args: unknown[]) => mockGetPresignedUrl(...args),
}))

// Mock upload utilities
const mockValidateFile = vi.fn()
const mockUploadToS3 = vi.fn()
vi.mock('@/lib/upload', () => ({
  validateFile: (...args: unknown[]) => mockValidateFile(...args),
  uploadToS3: (...args: unknown[]) => mockUploadToS3(...args),
  UploadError: class UploadError extends Error {
    code: string
    constructor(code: string, message: string) {
      super(message)
      this.name = 'UploadError'
      this.code = code
    }
  },
}))

import { ImageUpload } from '../components/image-upload'

beforeEach(() => {
  vi.clearAllMocks()
  mockValidateFile.mockImplementation(() => {})
  mockGetIdToken.mockResolvedValue('mock-token')
  mockUploadToS3.mockResolvedValue(undefined)
  mockGetPresignedUrl.mockResolvedValue({
    url: 'https://s3.amazonaws.com/bucket',
    fields: { key: 'uploads/profile/user-123/abc.jpg' },
    key: 'uploads/profile/user-123/abc.jpg',
    expiresIn: 900,
  })
})

describe('ImageUpload', () => {
  const defaultProps = {
    label: 'Profile Photo',
    currentUrl: null,
    context: 'profile' as const,
    onUploadComplete: vi.fn(),
    onRemove: vi.fn(),
    testId: 'profile-image-upload',
  }

  it('should render upload area with correct data-testid', () => {
    render(<ImageUpload {...defaultProps} />)
    expect(screen.getByTestId('profile-image-upload')).toBeInTheDocument()
  })

  it('should show current image preview when currentUrl is provided', () => {
    render(<ImageUpload {...defaultProps} currentUrl="https://cdn.example.com/profile.jpg" />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/profile.jpg')
  })

  it('should show upload placeholder when no image exists', () => {
    render(<ImageUpload {...defaultProps} />)
    expect(screen.getByText(/upload/i)).toBeInTheDocument()
  })

  it('should show remove button when image exists', () => {
    render(<ImageUpload {...defaultProps} currentUrl="https://cdn.example.com/profile.jpg" />)
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument()
  })

  it('should call onRemove when remove button is clicked', async () => {
    const user = userEvent.setup()
    render(<ImageUpload {...defaultProps} currentUrl="https://cdn.example.com/profile.jpg" />)

    await user.click(screen.getByRole('button', { name: /remove/i }))
    expect(defaultProps.onRemove).toHaveBeenCalled()
  })

  it('should show error message when file validation fails', async () => {
    const { UploadError } = await import('@/lib/upload')
    mockValidateFile.mockImplementation(() => {
      throw new UploadError('FILE_TOO_LARGE', 'File exceeds maximum size of 2 MB')
    })

    const user = userEvent.setup()
    render(<ImageUpload {...defaultProps} />)

    const fileInput = screen.getByTestId('profile-image-upload-input')
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/2 MB/i)
    })
  })

  it('should call onUploadComplete after successful upload', async () => {
    const user = userEvent.setup()
    render(<ImageUpload {...defaultProps} />)

    const fileInput = screen.getByTestId('profile-image-upload-input')
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(defaultProps.onUploadComplete).toHaveBeenCalledWith(
        expect.stringContaining('uploads/profile/user-123/abc.jpg')
      )
    })
  })

  it('should show loading state during upload', async () => {
    // Make the upload take a while
    mockUploadToS3.mockImplementation(() => new Promise(() => {}))

    const user = userEvent.setup()
    render(<ImageUpload {...defaultProps} />)

    const fileInput = screen.getByTestId('profile-image-upload-input')
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText(/uploading/i)).toBeInTheDocument()
    })
  })
})
