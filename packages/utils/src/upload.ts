/**
 * Shared upload constants used by both API (server-side validation)
 * and web (client-side pre-checks).
 */

/** Maximum allowed file size in bytes (2 MB) */
export const UPLOAD_MAX_FILE_SIZE = 2 * 1024 * 1024

/** Allowed MIME types for image uploads */
export const UPLOAD_ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

/** Upload context determines the S3 key prefix */
export const UPLOAD_CONTEXTS = [
  'profile',
  'cover',
  'listing',
  'process',
] as const

/** Presigned URL expiry in seconds (15 minutes) */
export const UPLOAD_URL_EXPIRY_SECONDS = 900

/** Maps MIME type to file extension for S3 keys */
export const CONTENT_TYPE_TO_EXTENSION: Record<UploadContentType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export type UploadContentType = (typeof UPLOAD_ALLOWED_CONTENT_TYPES)[number]
export type UploadContext = (typeof UPLOAD_CONTEXTS)[number]
