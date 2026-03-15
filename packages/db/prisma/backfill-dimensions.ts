/**
 * Backfill image dimensions for listing_images rows.
 *
 * Reads each image from its CloudFront URL, extracts pixel dimensions
 * from format headers (PNG/JPEG/WebP), and updates the width/height
 * columns. Only processes rows where width IS NULL (idempotent).
 *
 * Designed to run inside the migrate Lambda via tsx, following the
 * same pattern as seed-safe.ts.
 */
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set.')
  process.exit(1)
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === 'development'
      ? false
      : process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false'
        ? { rejectUnauthorized: false }
        : true,
})

const prisma = new PrismaClient({ adapter })

// ---------------------------------------------------------------------------
// Image dimension reading
// ---------------------------------------------------------------------------

/**
 * Read width/height from image binary data by parsing format headers.
 * Supports PNG, JPEG, and WebP without external dependencies.
 */
function readImageDimensions(buf: Buffer): { width: number; height: number } | null {
  // PNG: bytes 0-7 are signature, IHDR chunk starts at byte 8
  // Width at offset 16, height at offset 20 (big-endian uint32)
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    const width = buf.readUInt32BE(16)
    const height = buf.readUInt32BE(20)
    return { width, height }
  }

  // JPEG: SOI marker (0xFFD8), then scan for SOF0/SOF2 markers
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2
    while (offset < buf.length - 1) {
      if (buf[offset] !== 0xff) break
      const marker = buf[offset + 1]!
      // SOF0 (0xC0) or SOF2 (0xC2) — contains dimensions
      if (marker === 0xc0 || marker === 0xc2) {
        const height = buf.readUInt16BE(offset + 5)
        const width = buf.readUInt16BE(offset + 7)
        return { width, height }
      }
      // Skip to next marker
      if (marker === 0xd9) break // EOI
      const segLength = buf.readUInt16BE(offset + 2)
      offset += 2 + segLength
    }
    return null
  }

  // WebP: RIFF header, then "WEBP" at offset 8
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = buf.toString('ascii', 12, 16)
    if (chunk === 'VP8 ') {
      // Lossy WebP: dimensions at offset 26-29
      const width = buf.readUInt16LE(26) & 0x3fff
      const height = buf.readUInt16LE(28) & 0x3fff
      return { width, height }
    }
    if (chunk === 'VP8L') {
      // Lossless WebP: dimensions encoded in first 4 bytes of bitstream at offset 21
      const bits = buf.readUInt32LE(21)
      const width = (bits & 0x3fff) + 1
      const height = ((bits >> 14) & 0x3fff) + 1
      return { width, height }
    }
    if (chunk === 'VP8X') {
      // Extended WebP: width at 24 (3 bytes LE), height at 27 (3 bytes LE)
      const width = (buf[24]! | (buf[25]! << 8) | (buf[26]! << 16)) + 1
      const height = (buf[27]! | (buf[28]! << 8) | (buf[29]! << 16)) + 1
      return { width, height }
    }
  }

  return null
}

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'surfaced-art-dev-media'
const s3 = new S3Client({})

/**
 * Extract the S3 object key from a CloudFront URL.
 * URL format: https://{domain}/uploads/seed/artists/{slug}/...
 * S3 key is everything after the domain, i.e. "uploads/seed/artists/...".
 */
function extractS3Key(url: string): string {
  const parsed = new URL(url)
  // pathname starts with "/", strip the leading slash for the S3 key
  return parsed.pathname.slice(1)
}

async function getImageDimensionsFromS3(url: string): Promise<{ width: number; height: number } | null> {
  try {
    const key = extractS3Key(url)
    const command = new GetObjectCommand({ Bucket: S3_BUCKET_NAME, Key: key })
    const response = await s3.send(command)

    if (!response.Body) {
      console.warn(`  SKIP: Empty body for s3://${S3_BUCKET_NAME}/${key}`)
      return null
    }

    const buffer = Buffer.from(await response.Body.transformToByteArray())
    const dims = readImageDimensions(buffer)
    if (!dims) {
      console.warn(`  SKIP: Could not parse dimensions from s3://${S3_BUCKET_NAME}/${key}`)
      return null
    }

    return dims
  } catch (err) {
    console.warn(`  SKIP: S3 error for ${url}: ${err instanceof Error ? err.message : err}`)
    return null
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const CONCURRENCY = 10

async function main() {
  console.log(`Using S3 bucket: ${S3_BUCKET_NAME}`)

  const images = await prisma.listingImage.findMany({
    where: { width: null },
    select: { id: true, url: true },
  })

  console.log(`Found ${images.length} images without dimensions`)

  let updated = 0
  let skipped = 0

  // Process in batches of CONCURRENCY
  for (let i = 0; i < images.length; i += CONCURRENCY) {
    const batch = images.slice(i, i + CONCURRENCY)
    const results = await Promise.all(
      batch.map(async (image) => {
        const dims = await getImageDimensionsFromS3(image.url)
        if (!dims) return { id: image.id, dims: null }
        return { id: image.id, dims }
      }),
    )

    const updates = results.filter((r) => r.dims !== null)
    skipped += results.length - updates.length

    await Promise.all(
      updates.map((result) =>
        prisma.listingImage.update({
          where: { id: result.id },
          data: { width: result.dims!.width, height: result.dims!.height },
        }),
      ),
    )
    updated += updates.length

    console.log(`  Batch ${Math.floor(i / CONCURRENCY) + 1}: processed ${batch.length} images`)
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
