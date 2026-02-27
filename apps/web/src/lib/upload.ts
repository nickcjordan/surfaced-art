/**
 * Client-side upload utilities for direct-to-S3 uploads via presigned POST.
 */

import {
  UPLOAD_MAX_FILE_SIZE,
  UPLOAD_ALLOWED_CONTENT_TYPES,
} from '@surfaced-art/utils'
import type { PresignedPostResponse } from '@surfaced-art/types'

export type UploadErrorCode = 'FILE_TOO_LARGE' | 'INVALID_TYPE' | 'UPLOAD_FAILED'

export class UploadError extends Error {
  code: UploadErrorCode

  constructor(code: UploadErrorCode, message: string) {
    super(message)
    this.name = 'UploadError'
    this.code = code
  }
}

/**
 * Validate a file before requesting a presigned URL.
 * Throws UploadError if the file fails validation.
 */
export function validateFile(file: File): void {
  if (file.size > UPLOAD_MAX_FILE_SIZE) {
    throw new UploadError(
      'FILE_TOO_LARGE',
      `File exceeds maximum size of ${UPLOAD_MAX_FILE_SIZE / (1024 * 1024)} MB`,
    )
  }

  if (
    !UPLOAD_ALLOWED_CONTENT_TYPES.includes(
      file.type as (typeof UPLOAD_ALLOWED_CONTENT_TYPES)[number],
    )
  ) {
    throw new UploadError(
      'INVALID_TYPE',
      `Unsupported file type "${file.type}". Allowed types: ${UPLOAD_ALLOWED_CONTENT_TYPES.join(', ')}`,
    )
  }
}

/**
 * Upload a file directly to S3 using a presigned POST response.
 * Builds FormData from the presigned fields and appends the file last (required by S3).
 */
export async function uploadToS3(
  file: File,
  presignedPost: PresignedPostResponse,
): Promise<void> {
  const formData = new FormData()

  // Add all presigned fields first
  for (const [key, value] of Object.entries(presignedPost.fields)) {
    formData.append(key, value)
  }

  // File MUST be the last field in the FormData
  formData.append('file', file)

  try {
    const response = await fetch(presignedPost.url, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new UploadError(
        'UPLOAD_FAILED',
        `Upload failed with status ${response.status}: ${response.statusText}`,
      )
    }
  } catch (err) {
    if (err instanceof UploadError) throw err
    throw new UploadError(
      'UPLOAD_FAILED',
      err instanceof Error ? err.message : 'Upload failed',
    )
  }
}
