import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  validateFile,
  uploadToS3,
  UploadError,
} from './upload'
import type { PresignedPostResponse } from '@surfaced-art/types'

describe('validateFile', () => {
  function createMockFile(name: string, size: number, type: string): File {
    const blob = new Blob(['x'.repeat(size)], { type })
    return new File([blob], name, { type })
  }

  it('should accept a valid JPEG file', () => {
    const file = createMockFile('photo.jpg', 1024, 'image/jpeg')
    expect(() => validateFile(file)).not.toThrow()
  })

  it('should accept a valid PNG file', () => {
    const file = createMockFile('photo.png', 1024, 'image/png')
    expect(() => validateFile(file)).not.toThrow()
  })

  it('should accept a valid WebP file', () => {
    const file = createMockFile('photo.webp', 1024, 'image/webp')
    expect(() => validateFile(file)).not.toThrow()
  })

  it('should reject files exceeding 2MB', () => {
    const file = createMockFile('big.jpg', 3 * 1024 * 1024, 'image/jpeg')
    expect(() => validateFile(file)).toThrow(UploadError)
    expect(() => validateFile(file)).toThrow(/2 ?MB/)
  })

  it('should reject unsupported content types', () => {
    const file = createMockFile('anim.gif', 1024, 'image/gif')
    expect(() => validateFile(file)).toThrow(UploadError)
    expect(() => validateFile(file)).toThrow(/type/)
  })

  it('should set FILE_TOO_LARGE code for oversized files', () => {
    const file = createMockFile('big.jpg', 3 * 1024 * 1024, 'image/jpeg')
    try {
      validateFile(file)
    } catch (err) {
      expect(err).toBeInstanceOf(UploadError)
      expect((err as UploadError).code).toBe('FILE_TOO_LARGE')
    }
  })

  it('should set INVALID_TYPE code for wrong types', () => {
    const file = createMockFile('anim.gif', 1024, 'image/gif')
    try {
      validateFile(file)
    } catch (err) {
      expect(err).toBeInstanceOf(UploadError)
      expect((err as UploadError).code).toBe('INVALID_TYPE')
    }
  })

  it('should accept files at exactly 2MB', () => {
    const file = createMockFile('exact.jpg', 2 * 1024 * 1024, 'image/jpeg')
    expect(() => validateFile(file)).not.toThrow()
  })
})

describe('uploadToS3', () => {
  const mockPresignedPost: PresignedPostResponse = {
    url: 'https://test-bucket.s3.amazonaws.com',
    fields: {
      key: 'uploads/listing/user-123/abc.jpg',
      Policy: 'base64policy',
      'X-Amz-Signature': 'sig123',
    },
    key: 'uploads/listing/user-123/abc.jpg',
    expiresIn: 900,
  }

  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 204 })
    vi.stubGlobal('fetch', mockFetch)
  })

  it('should POST FormData with presigned fields and file', async () => {
    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })

    await uploadToS3(file, mockPresignedPost)

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('https://test-bucket.s3.amazonaws.com')
    expect(options.method).toBe('POST')
    expect(options.body).toBeInstanceOf(FormData)
  })

  it('should include all presigned fields in FormData', async () => {
    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })

    await uploadToS3(file, mockPresignedPost)

    const formData = mockFetch.mock.calls[0][1].body as FormData
    expect(formData.get('key')).toBe('uploads/listing/user-123/abc.jpg')
    expect(formData.get('Policy')).toBe('base64policy')
    expect(formData.get('X-Amz-Signature')).toBe('sig123')
  })

  it('should append file as the last field', async () => {
    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })

    await uploadToS3(file, mockPresignedPost)

    const formData = mockFetch.mock.calls[0][1].body as FormData
    // FormData entries() returns entries in insertion order
    const entries = [...formData.entries()]
    const lastEntry = entries[entries.length - 1]
    expect(lastEntry[0]).toBe('file')
    expect(lastEntry[1]).toBeInstanceOf(File)
  })

  it('should throw UploadError with UPLOAD_FAILED code on S3 error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 403, statusText: 'Forbidden' })
    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })

    await expect(uploadToS3(file, mockPresignedPost)).rejects.toThrow(UploadError)
    try {
      await uploadToS3(file, mockPresignedPost)
    } catch (err) {
      expect((err as UploadError).code).toBe('UPLOAD_FAILED')
    }
  })

  it('should throw UploadError on network failure', async () => {
    mockFetch.mockRejectedValue(new TypeError('Network error'))
    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })

    await expect(uploadToS3(file, mockPresignedPost)).rejects.toThrow(UploadError)
  })
})
