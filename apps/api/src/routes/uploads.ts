import { Hono } from 'hono'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import type { PrismaClient } from '@surfaced-art/db'
import { logger, UPLOAD_MAX_FILE_SIZE, UPLOAD_URL_EXPIRY_SECONDS, CONTENT_TYPE_TO_EXTENSION } from '@surfaced-art/utils'
import { presignedUrlBody } from '@surfaced-art/types'
import type { UploadContentType, UploadContext } from '@surfaced-art/utils'
import { authMiddleware, requireAnyRole, type AuthUser } from '../middleware/auth'
import { getS3Client } from '../lib/s3'
import { badRequest, validationError, internalError } from '../errors'

export function createUploadRoutes(prisma: PrismaClient) {
  const uploads = new Hono<{ Variables: { user: AuthUser } }>()

  // Auth + role check: artist or admin only
  uploads.use('*', authMiddleware(prisma))
  uploads.use('*', requireAnyRole(['artist', 'admin']))

  /**
   * POST /uploads/presigned-url
   * Generate a presigned POST URL for direct-to-S3 upload.
   */
  uploads.post('/presigned-url', async (c) => {
    const body = await c.req.json().catch(() => null)
    if (body === null) {
      return badRequest(c, 'Invalid JSON payload')
    }

    const parsed = presignedUrlBody.safeParse(body)
    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    const { context, contentType } = parsed.data as {
      context: UploadContext
      contentType: UploadContentType
    }

    const bucketName = process.env.S3_BUCKET_NAME
    if (!bucketName) {
      logger.error('S3_BUCKET_NAME environment variable is not set')
      return internalError(c)
    }

    const user = c.get('user')
    const ext = CONTENT_TYPE_TO_EXTENSION[contentType]
    const key = `uploads/${context}/${user.id}/${crypto.randomUUID()}.${ext}`
    const keyPrefix = `uploads/${context}/${user.id}/`

    try {
      const s3Client = getS3Client()
      const { url, fields } = await createPresignedPost(s3Client, {
        Bucket: bucketName,
        Key: key,
        Conditions: [
          ['content-length-range', 0, UPLOAD_MAX_FILE_SIZE],
          ['eq', '$Content-Type', contentType],
          ['starts-with', '$key', keyPrefix],
        ],
        Expires: UPLOAD_URL_EXPIRY_SECONDS,
      })

      logger.info('Presigned upload URL generated', {
        context,
        contentType,
        userId: user.id,
      })

      return c.json({
        url,
        fields,
        key,
        expiresIn: UPLOAD_URL_EXPIRY_SECONDS,
      })
    } catch (err) {
      logger.error('Failed to generate presigned URL', {
        errorMessage: err instanceof Error ? err.message : String(err),
        context,
        contentType,
      })
      return internalError(c)
    }
  })

  return uploads
}
