/**
 * Download demo images from the Notion "Demo Image Generation Tracker" and
 * upload them to S3 for processing by the Sharp image processor Lambda.
 *
 * The script is designed to be re-runnable: it checks if the upload key
 * already exists in S3 and skips images that are already present.
 *
 * Prerequisites:
 *   - NOTION_API_TOKEN env var (Notion integration token with read access)
 *   - AWS credentials configured (CLI profile, env vars, or IAM role)
 *   - S3_MEDIA_BUCKET env var (defaults to surfaced-art-prod-media)
 *
 * Usage:
 *   npx tsx scripts/notion-to-s3.ts                     # upload all done images
 *   npx tsx scripts/notion-to-s3.ts --dry-run            # preview without uploading
 *   npx tsx scripts/notion-to-s3.ts --artist "Elena Cordova"  # single artist
 *
 * Environment variables:
 *   NOTION_API_TOKEN       (required) Notion integration token
 *   NOTION_DATA_SOURCE_ID  (optional) defaults to the tracker data source ID
 *   S3_MEDIA_BUCKET        (optional) defaults to surfaced-art-prod-media
 *   AWS_REGION             (optional) defaults to us-east-1
 */

import { Client } from '@notionhq/client'
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import {
  deriveUploadKey,
  detectContentType,
  parseNotionRow,
  type NotionImageRow,
} from './notion-to-s3-lib.js'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

// Notion SDK v5 uses dataSources.query (not databases.query).
// The data source ID is the collection ID from the Notion database.
const NOTION_DATA_SOURCE_ID =
  process.env.NOTION_DATA_SOURCE_ID ??
  process.env.NOTION_DATABASE_ID ??
  'd190c7e8-fbcb-49c6-ac4e-abf6389575cf'
const S3_BUCKET = process.env.S3_MEDIA_BUCKET ?? 'surfaced-art-prod-media'
const AWS_REGION = process.env.AWS_REGION ?? 'us-east-1'

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

interface CliArgs {
  dryRun: boolean
  artist: string | null
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2)
  let dryRun = false
  let artist: string | null = null

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') {
      dryRun = true
    } else if (args[i] === '--artist' && args[i + 1]) {
      artist = args[i + 1]!
      i++
    }
  }

  return { dryRun, artist }
}

// ---------------------------------------------------------------------------
// Notion API: fetch all completed rows
// ---------------------------------------------------------------------------

async function fetchCompletedRows(
  notion: Client,
  artistFilter: string | null
): Promise<NotionImageRow[]> {
  const rows: NotionImageRow[] = []
  let cursor: string | undefined

  // Build Notion filter: Done == true, and optionally Artist == name
  const filterConditions: Array<Record<string, unknown>> = [
    { property: 'Done', checkbox: { equals: true } },
  ]
  if (artistFilter) {
    filterConditions.push({
      property: 'Artist',
      select: { equals: artistFilter },
    })
  }

  const filter =
    filterConditions.length === 1
      ? filterConditions[0]!
      : { and: filterConditions }

  do {
    const response = await notion.dataSources.query({
      data_source_id: NOTION_DATA_SOURCE_ID,
      filter: filter as Parameters<typeof notion.dataSources.query>[0]['filter'],
      start_cursor: cursor,
      page_size: 100,
    })

    for (const page of response.results) {
      if ('properties' in page) {
        const row = parseNotionRow(page as unknown as Record<string, unknown>)
        // Only include rows that have both an S3 key and a file URL
        if (row.s3Key && row.fileUrl) {
          rows.push(row)
        } else if (row.s3Key && !row.fileUrl) {
          console.warn(
            `  ⚠ ${row.imageName}: Done=true but no file attached, skipping`
          )
        } else if (!row.s3Key && row.fileUrl) {
          console.warn(
            `  ⚠ ${row.imageName}: has file but no S3 Key set, skipping`
          )
        }
      }
    }

    cursor = response.has_more ? response.next_cursor ?? undefined : undefined
  } while (cursor)

  return rows
}

// ---------------------------------------------------------------------------
// S3: check if key exists
// ---------------------------------------------------------------------------

async function s3KeyExists(s3: S3Client, key: string): Promise<boolean> {
  try {
    await s3.send(
      new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key })
    )
    return true
  } catch (err: unknown) {
    const error = err as { name?: string }
    if (error.name === 'NotFound' || error.name === '404') {
      return false
    }
    // Re-throw non-404 errors (permission denied, network issues, etc.)
    // so they surface immediately rather than masking configuration problems
    throw err
  }
}

// ---------------------------------------------------------------------------
// Download image from Notion URL
// ---------------------------------------------------------------------------

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { dryRun, artist } = parseArgs()

  // Validate NOTION_API_TOKEN
  const notionToken = process.env.NOTION_API_TOKEN
  if (!notionToken) {
    console.error(
      'ERROR: NOTION_API_TOKEN environment variable is not set.\n' +
        'Create a Notion integration at https://www.notion.so/my-integrations\n' +
        'and share the Demo Image Generation Tracker database with it.'
    )
    process.exit(1)
  }

  const notion = new Client({ auth: notionToken })
  const s3 = new S3Client({ region: AWS_REGION })

  console.log(`Bucket:   ${S3_BUCKET}`)
  console.log(`Region:   ${AWS_REGION}`)
  console.log(`Data src: ${NOTION_DATA_SOURCE_ID}`)
  if (artist) console.log(`Artist:   ${artist}`)
  if (dryRun) console.log(`Mode:     DRY RUN (no uploads)`)
  console.log('')

  // 1. Fetch completed rows from Notion
  console.log('Querying Notion for completed images...')
  const rows = await fetchCompletedRows(notion, artist)
  console.log(`Found ${rows.length} completed image(s) with files\n`)

  if (rows.length === 0) {
    console.log('Nothing to upload.')
    return
  }

  // 2. Process each row
  let uploaded = 0
  let skipped = 0
  let failed = 0

  for (const row of rows) {
    const { contentType, extension } = detectContentType(row.fileUrl!)

    // If the source is already WebP, upload directly to the S3 Key path
    // (bypasses Sharp Lambda since .webp doesn't trigger it)
    let uploadKey: string
    if (extension === '.webp') {
      uploadKey = row.s3Key
    } else {
      uploadKey = deriveUploadKey(row.s3Key, extension)
    }

    // Check idempotency — skip if already uploaded
    const exists = await s3KeyExists(s3, uploadKey)
    if (exists) {
      console.log(`  ⊘ Exists: ${row.imageName} → ${uploadKey}`)
      skipped++
      continue
    }

    if (dryRun) {
      console.log(`  → Would upload (new): ${row.imageName} → ${uploadKey}`)
      continue
    }

    // Download from Notion and upload to S3
    try {
      const imageBuffer = await downloadImage(row.fileUrl!)

      await s3.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: uploadKey,
          Body: imageBuffer,
          ContentType: contentType,
          CacheControl: 'public, max-age=31536000, immutable',
        })
      )

      console.log(`  ✓ Uploaded: ${row.imageName} → ${uploadKey}`)
      uploaded++
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`  ✗ Failed: ${row.imageName} — ${message}`)
      failed++
    }
  }

  // 3. Summary
  console.log('')
  console.log('─'.repeat(50))
  if (dryRun) {
    console.log(`DRY RUN complete. ${rows.length} image(s) would be processed.`)
  } else {
    console.log(
      `Uploaded: ${uploaded} | Skipped: ${skipped} | Failed: ${failed} | Total: ${rows.length}`
    )
  }

  if (failed > 0) {
    process.exit(1)
  }
}

main().catch((err: unknown) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
