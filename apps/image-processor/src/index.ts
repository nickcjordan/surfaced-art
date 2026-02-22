import type { S3Event, Context } from 'aws-lambda'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'

/** Target widths for WebP variants (ascending order). */
const TARGET_WIDTHS = [400, 800, 1200] as const

/** WebP quality — 82 balances file size with art gallery quality. */
const WEBP_QUALITY = 82

/** Supported input image extensions (lowercase). */
const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png'])

const s3 = new S3Client({ region: process.env.AWS_REGION ?? 'us-east-1' })

interface ProcessingResult {
  statusCode: number
  body: string
}

interface SingleImageResult {
  key: string
  variants: string[]
}

/**
 * Extracts the file extension from a key (lowercase, including the dot).
 */
function getExtension(key: string): string {
  const lastDot = key.lastIndexOf('.')
  if (lastDot === -1) return ''
  return key.slice(lastDot).toLowerCase()
}

/**
 * Strips the file extension from a key, returning the key without extension.
 * For `uploads/artist/photo.jpg` returns `uploads/artist/photo`.
 */
function stripExtension(key: string): string {
  const lastDot = key.lastIndexOf('.')
  if (lastDot === -1) return key
  return key.slice(0, lastDot)
}

/**
 * Processes a single image: fetches from S3, generates WebP variants at
 * target widths (skipping widths larger than the source), and uploads
 * variants back to S3.
 */
async function processImage(
  bucket: string,
  key: string
): Promise<SingleImageResult> {
  // Fetch the original image from S3
  const getResponse = await s3.send(
    new GetObjectCommand({ Bucket: bucket, Key: key })
  )

  if (!getResponse.Body) {
    throw new Error('Empty response body from S3')
  }

  const imageBytes = await getResponse.Body.transformToByteArray()
  const imageBuffer = Buffer.from(imageBytes)

  // Read metadata to determine source dimensions
  const sharpInstance = sharp(imageBuffer)
  const metadata = await sharpInstance.metadata()
  const sourceWidth = metadata.width ?? 0

  const baseKey = stripExtension(key)
  const variants: string[] = []

  for (const targetWidth of TARGET_WIDTHS) {
    // Do not upscale — skip if the source is narrower than the target
    if (sourceWidth <= targetWidth) {
      continue
    }

    const resized = sharpInstance
      .clone()
      .resize(targetWidth, null, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })

    const outputBuffer = await resized.toBuffer()
    const variantKey = `${baseKey}/${targetWidth}w.webp`

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: variantKey,
        Body: outputBuffer,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable',
      })
    )

    variants.push(variantKey)
  }

  return { key, variants }
}

/**
 * Lambda handler triggered by S3 PutObject events on the media bucket.
 *
 * For each uploaded image (JPEG, JPG, PNG) under the `uploads/` prefix,
 * generates WebP variants at 400px, 800px, and 1200px widths (maintaining
 * aspect ratio). Variants are stored alongside the original at:
 *   `{original-key-without-extension}/{width}w.webp`
 *
 * Skips non-image files and avoids upscaling (if the source is smaller
 * than a target width, that variant is omitted).
 */
export const handler = async (
  event: S3Event,
  _context: Context
): Promise<ProcessingResult> => {
  const records = event.Records

  if (!records || records.length === 0) {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'No records to process' }),
    }
  }

  // Single record — simpler response format
  if (records.length === 1) {
    const record = records[0]!
    const bucket = record.s3.bucket.name
    // S3 event keys are URL-encoded; decode for human-readable paths
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '))
    const extension = getExtension(key)

    if (!SUPPORTED_EXTENSIONS.has(extension)) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: `Skipped non-image file: ${key}`,
        }),
      }
    }

    try {
      const result = await processImage(bucket, key)
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: `Processed ${result.variants.length} variant(s) for ${key}`,
          variants: result.variants,
        }),
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`Error processing ${key}:`, message)
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: `Failed to process ${key}`,
          error: message,
        }),
      }
    }
  }

  // Multiple records — batch response format
  const results: SingleImageResult[] = []
  const errors: Array<{ key: string; error: string }> = []

  for (const record of records) {
    const bucket = record.s3.bucket.name
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '))
    const extension = getExtension(key)

    if (!SUPPORTED_EXTENSIONS.has(extension)) {
      continue
    }

    try {
      const result = await processImage(bucket, key)
      results.push(result)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`Error processing ${key}:`, message)
      errors.push({ key, error: message })
    }
  }

  const hasErrors = errors.length > 0
  return {
    statusCode: hasErrors ? 500 : 200,
    body: JSON.stringify({
      message: `Processed ${results.length} image(s)${hasErrors ? `, ${errors.length} error(s)` : ''}`,
      results,
      ...(hasErrors && { errors }),
    }),
  }
}
