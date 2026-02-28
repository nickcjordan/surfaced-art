/**
 * Download images to a local folder structure.
 *
 * Organizes images by context (profile, cover, process, listings)
 * and handles concurrent downloads with deduplication.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { logger } from '@surfaced-art/utils'
import type { ScrapedArtistData, ScrapedImage } from '../types.js'
import { slugify } from '../utils/url.js'

const CONCURRENT_DOWNLOADS = 5
const MIN_FILE_SIZE = 5_000 // 5KB minimum
const DOWNLOAD_TIMEOUT_MS = 30_000

/**
 * Download all images from the scraped data to local folders.
 */
export async function downloadImages(
  data: ScrapedArtistData,
  outputDir: string,
  verbose?: boolean
): Promise<{ downloaded: number; skipped: number; failed: number }> {
  const stats = { downloaded: 0, skipped: 0, failed: 0 }
  const seenUrls = new Set<string>()

  // Collect all images with their target directories
  const downloads: Array<{ image: ScrapedImage; dir: string; filename: string }> = []

  // Profile images
  for (let i = 0; i < data.profileImages.length; i++) {
    const img = data.profileImages[i]!
    const dir = path.join(outputDir, 'profile')
    const ext = getExtension(img.url)
    downloads.push({ image: img, dir, filename: `${String(i + 1).padStart(2, '0')}${ext}` })
  }

  // Cover images
  for (let i = 0; i < data.coverImages.length; i++) {
    const img = data.coverImages[i]!
    const dir = path.join(outputDir, 'cover')
    const ext = getExtension(img.url)
    downloads.push({ image: img, dir, filename: `${String(i + 1).padStart(2, '0')}${ext}` })
  }

  // Process images
  for (let i = 0; i < data.processImages.length; i++) {
    const img = data.processImages[i]!
    const dir = path.join(outputDir, 'process')
    const ext = getExtension(img.url)
    downloads.push({ image: img, dir, filename: `${String(i + 1).padStart(2, '0')}${ext}` })
  }

  // Listing images
  for (let listingIdx = 0; listingIdx < data.listings.length; listingIdx++) {
    const listing = data.listings[listingIdx]!
    const listingSlug = slugify(listing.title.value).substring(0, 40)
    const listingDir = path.join(
      outputDir,
      'listings',
      `${String(listingIdx + 1).padStart(2, '0')}-${listingSlug}`
    )

    for (let imgIdx = 0; imgIdx < listing.images.length; imgIdx++) {
      const img = listing.images[imgIdx]!
      const ext = getExtension(img.url)
      downloads.push({
        image: img,
        dir: listingDir,
        filename: `${String(imgIdx + 1).padStart(2, '0')}${ext}`,
      })
    }
  }

  // Deduplicate by URL
  const uniqueDownloads = downloads.filter((d) => {
    if (seenUrls.has(d.image.url)) {
      stats.skipped++
      return false
    }
    seenUrls.add(d.image.url)
    return true
  })

  if (verbose) {
    logger.info('Downloading images', {
      total: uniqueDownloads.length,
      deduplicated: stats.skipped,
    })
  }

  // Download in batches
  for (let i = 0; i < uniqueDownloads.length; i += CONCURRENT_DOWNLOADS) {
    const batch = uniqueDownloads.slice(i, i + CONCURRENT_DOWNLOADS)
    const results = await Promise.allSettled(
      batch.map((d) => downloadSingleImage(d.image.url, d.dir, d.filename, verbose))
    )

    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (result.value) {
          stats.downloaded++
        } else {
          stats.skipped++
        }
      } else {
        stats.failed++
      }
    }
  }

  return stats
}

/**
 * Download a single image to the specified directory.
 * Returns true if downloaded, false if skipped (too small).
 */
async function downloadSingleImage(
  url: string,
  dir: string,
  filename: string,
  verbose?: boolean
): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS)

    const response = await fetch(url, {
      headers: { 'User-Agent': 'SurfacedArt-ArtistTool/1.0' },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      if (verbose) {
        logger.warn('Image download failed', { url, status: response.status })
      }
      return false
    }

    const buffer = Buffer.from(await response.arrayBuffer())

    // Skip tiny files (likely icons or broken images)
    if (buffer.length < MIN_FILE_SIZE) {
      if (verbose) {
        logger.info('Skipping tiny image', { url, size: buffer.length })
      }
      return false
    }

    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(path.join(dir, filename), buffer)

    if (verbose) {
      logger.info('Downloaded', { url, size: buffer.length, path: path.join(dir, filename) })
    }

    return true
  } catch (err) {
    if (verbose) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.warn('Image download error', { url, error: msg })
    }
    return false
  }
}

/**
 * Extract file extension from a URL, defaulting to .jpg.
 */
function getExtension(url: string): string {
  try {
    const pathname = new URL(url).pathname
    const ext = path.extname(pathname).toLowerCase()
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'].includes(ext)) {
      return ext
    }
  } catch {
    // Ignore parse errors
  }
  return '.jpg'
}
