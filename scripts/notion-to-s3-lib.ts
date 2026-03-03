/**
 * Pure utility functions for the Notion-to-S3 upload script.
 *
 * Separated from the main script for testability — no side effects here.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NotionImageRow {
  id: string
  imageName: string
  artist: string
  type: string
  done: boolean
  s3Key: string
  fileUrl: string | null
  fileName: string | null
}

export interface ContentTypeResult {
  contentType: string
  extension: string
}

// ---------------------------------------------------------------------------
// deriveUploadKey
// ---------------------------------------------------------------------------

/**
 * Derives the S3 upload key from the Notion `S3 Key` field.
 *
 * The Notion tracker stores the final WebP variant path, e.g.:
 *   `uploads/seed/artists/elena-cordova/profile/1200w.webp`
 *
 * The Sharp Lambda expects the original uploaded as `.jpg`/`.png` at the
 * parent path (without the width variant directory), e.g.:
 *   `uploads/seed/artists/elena-cordova/profile.png`
 *
 * The Lambda then generates `profile/400w.webp`, `profile/800w.webp`,
 * `profile/1200w.webp` automatically.
 *
 * @param s3Key  - The full S3 key from Notion, e.g. `.../profile/1200w.webp`
 * @param sourceExtension - The file extension to use, e.g. `.png`
 * @returns The key to upload the original image to
 */
export function deriveUploadKey(s3Key: string, sourceExtension: string): string {
  // Match pattern: .../{something}/{digits}w.webp
  const match = s3Key.match(/^(.+)\/\d+w\.webp$/)
  if (!match?.[1]) {
    throw new Error(
      `S3 Key does not match expected pattern ".../{width}w.webp": ${s3Key}`
    )
  }
  return `${match[1]}${sourceExtension}`
}

// ---------------------------------------------------------------------------
// detectContentType
// ---------------------------------------------------------------------------

const EXTENSION_MAP: Record<string, ContentTypeResult> = {
  '.png': { contentType: 'image/png', extension: '.png' },
  '.jpg': { contentType: 'image/jpeg', extension: '.jpg' },
  '.jpeg': { contentType: 'image/jpeg', extension: '.jpeg' },
  '.webp': { contentType: 'image/webp', extension: '.webp' },
}

const DEFAULT_CONTENT_TYPE: ContentTypeResult = {
  contentType: 'image/png',
  extension: '.png',
}

/**
 * Detects the content type and extension from a URL's path.
 * Strips query parameters before checking the extension.
 * Defaults to PNG if unrecognized.
 */
export function detectContentType(url: string): ContentTypeResult {
  try {
    const pathname = new URL(url).pathname
    const lastDot = pathname.lastIndexOf('.')
    if (lastDot === -1) return DEFAULT_CONTENT_TYPE

    const ext = pathname.slice(lastDot).toLowerCase()
    return EXTENSION_MAP[ext] ?? DEFAULT_CONTENT_TYPE
  } catch {
    return DEFAULT_CONTENT_TYPE
  }
}

// ---------------------------------------------------------------------------
// parseNotionRow
// ---------------------------------------------------------------------------

/**
 * Parses a raw Notion API page object into a typed `NotionImageRow`.
 *
 * Handles both `file` (Notion-hosted, signed URL) and `external` file types.
 */
export function parseNotionRow(page: Record<string, unknown>): NotionImageRow {
  const props = page.properties as Record<string, Record<string, unknown>>

  // Title (Image column)
  const titleProp = props.Image as { title?: Array<{ plain_text: string }> }
  const imageName = titleProp?.title?.[0]?.plain_text ?? ''

  // Select fields
  const artistProp = props.Artist as { select?: { name: string } | null }
  const artist = artistProp?.select?.name ?? ''

  const typeProp = props.Type as { select?: { name: string } | null }
  const type = typeProp?.select?.name ?? ''

  // Checkbox
  const doneProp = props.Done as { checkbox?: boolean }
  const done = doneProp?.checkbox ?? false

  // Rich text (S3 Key)
  const s3KeyProp = props['S3 Key'] as {
    rich_text?: Array<{ plain_text: string }>
  }
  const s3Key = s3KeyProp?.rich_text?.[0]?.plain_text ?? ''

  // Files (Generated Image)
  const filesProp = props['Generated Image'] as {
    files?: Array<{
      type: string
      name: string
      file?: { url: string }
      external?: { url: string }
    }>
  }

  const firstFile = filesProp?.files?.[0]
  let fileUrl: string | null = null
  let fileName: string | null = null

  if (firstFile) {
    fileName = firstFile.name
    if (firstFile.type === 'file' && firstFile.file) {
      fileUrl = firstFile.file.url
    } else if (firstFile.type === 'external' && firstFile.external) {
      fileUrl = firstFile.external.url
    }
  }

  return {
    id: page.id as string,
    imageName,
    artist,
    type,
    done,
    s3Key,
    fileUrl,
    fileName,
  }
}
