import { describe, it, expect } from 'vitest'
import {
  UPLOAD_MAX_FILE_SIZE,
  UPLOAD_ALLOWED_CONTENT_TYPES,
  UPLOAD_CONTEXTS,
  UPLOAD_URL_EXPIRY_SECONDS,
  CONTENT_TYPE_TO_EXTENSION,
} from './upload'
import type { UploadContentType, UploadContext } from './upload'

describe('upload constants', () => {
  it('should set max file size to 2MB', () => {
    expect(UPLOAD_MAX_FILE_SIZE).toBe(2 * 1024 * 1024)
  })

  it('should allow jpeg, png, and webp content types', () => {
    expect(UPLOAD_ALLOWED_CONTENT_TYPES).toEqual([
      'image/jpeg',
      'image/png',
      'image/webp',
    ])
  })

  it('should define upload contexts for profile, cover, listing, and process', () => {
    expect(UPLOAD_CONTEXTS).toEqual(['profile', 'cover', 'listing', 'process'])
  })

  it('should set URL expiry to 15 minutes (900 seconds)', () => {
    expect(UPLOAD_URL_EXPIRY_SECONDS).toBe(900)
  })

  it('should map content types to file extensions', () => {
    expect(CONTENT_TYPE_TO_EXTENSION).toEqual({
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    })
  })

  it('should have type-safe content type values', () => {
    const ct: UploadContentType = 'image/jpeg'
    expect(UPLOAD_ALLOWED_CONTENT_TYPES).toContain(ct)
  })

  it('should have type-safe context values', () => {
    const ctx: UploadContext = 'listing'
    expect(UPLOAD_CONTEXTS).toContain(ctx)
  })
})
