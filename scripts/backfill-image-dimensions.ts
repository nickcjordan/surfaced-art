/**
 * Backfill image dimensions for existing listing_images rows.
 *
 * Reads each image from its CloudFront URL, extracts pixel dimensions,
 * and updates the width/height columns. Only processes rows where
 * width IS NULL (idempotent — safe to re-run).
 *
 * Prerequisites:
 *   - DATABASE_URL environment variable must be set
 *   - Images must be accessible via their stored URLs
 *
 * Usage:
 *   npx tsx scripts/backfill-image-dimensions.ts
 *   npx tsx scripts/backfill-image-dimensions.ts --dry-run
 */

import { PrismaClient } from '../packages/db/src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { readImageDimensions } from '../packages/utils/src/image-dimensions'

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const dryRun = process.argv.includes('--dry-run')

// ---------------------------------------------------------------------------
// DB setup (same pattern as grant-admin.ts)
// ---------------------------------------------------------------------------

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL environment variable is required')
  process.exit(1)
}

// Dynamic import for pg (ESM compat)
async function createPrisma() {
  const pg = await import('pg')
  const pool = new pg.default.Pool({ connectionString: databaseUrl })
  const adapter = new PrismaPg(pool)
  return { prisma: new PrismaClient({ adapter }), pool }
}

// ---------------------------------------------------------------------------
// Image dimension reading
// ---------------------------------------------------------------------------

async function getImageDimensionsFromUrl(url: string): Promise<{ width: number; height: number } | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.warn(`  SKIP: HTTP ${response.status} for ${url}`)
      return null
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    const dims = readImageDimensions(buffer)
    if (!dims) {
      console.warn(`  SKIP: Could not parse dimensions from ${url}`)
      return null
    }

    return dims
  } catch (err) {
    console.warn(`  SKIP: Fetch error for ${url}: ${err instanceof Error ? err.message : err}`)
    return null
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { prisma, pool } = await createPrisma()

  try {
    const images = await prisma.listingImage.findMany({
      where: { width: null },
      select: { id: true, url: true },
    })

    console.log(`Found ${images.length} images without dimensions${dryRun ? ' (DRY RUN)' : ''}`)

    let updated = 0
    let skipped = 0

    for (const image of images) {
      console.log(`Processing ${image.url}...`)
      const dims = await getImageDimensionsFromUrl(image.url)

      if (!dims) {
        skipped++
        continue
      }

      console.log(`  ${dims.width}x${dims.height}`)

      if (!dryRun) {
        await prisma.listingImage.update({
          where: { id: image.id },
          data: { width: dims.width, height: dims.height },
        })
      }

      updated++
    }

    console.log(`\nDone: ${updated} updated, ${skipped} skipped${dryRun ? ' (DRY RUN — no writes)' : ''}`)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
