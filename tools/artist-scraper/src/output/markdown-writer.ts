/**
 * Write a human-readable markdown summary of scraped artist data.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import type { ScrapedArtistData, ExtractedField, ScrapedListing, ScrapedCvEntry } from '../types.js'

/**
 * Format a confidence indicator.
 */
function confidenceBadge(confidence: string): string {
  switch (confidence) {
    case 'high': return '[HIGH]'
    case 'medium': return '[MED]'
    case 'low': return '[LOW]'
    default: return `[${confidence.toUpperCase()}]`
  }
}

/**
 * Format an extracted field for display.
 */
function formatField<T>(field: ExtractedField<T> | null, fallback = 'Not found'): string {
  if (!field) return fallback
  return `${String(field.value)} ${confidenceBadge(field.confidence)}`
}

/**
 * Format price in cents as dollars.
 */
function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

/**
 * Generate the markdown summary.
 */
export function generateMarkdown(data: ScrapedArtistData): string {
  const lines: string[] = []

  // Header
  const name = data.name?.value || 'Unknown Artist'
  lines.push(`# Artist Extraction Report: ${name}`)
  lines.push('')
  lines.push(`**Scraped**: ${data.scrapedAt}`)
  lines.push(`**Website**: ${data.websiteUrl}`)
  lines.push(`**Platform**: ${data.platform || 'unknown'}`)
  lines.push(`**Pages visited**: ${data.sourceUrls.length}`)
  lines.push('')

  // Profile
  lines.push('## Profile')
  lines.push('')
  lines.push(`- **Name**: ${formatField(data.name)}`)
  lines.push(`- **Bio**: ${data.bio ? truncate(data.bio.value, 200) + ` ${confidenceBadge(data.bio.confidence)}` : 'Not found'}`)
  if (data.artistStatement) {
    lines.push(`- **Artist Statement**: ${truncate(data.artistStatement.value, 200)} ${confidenceBadge(data.artistStatement.confidence)}`)
  }
  lines.push(`- **Location**: ${formatField(data.location)}`)
  lines.push(`- **Email**: ${formatField(data.email)}`)
  lines.push(`- **Instagram**: ${data.instagramUrl || 'Not provided'}`)
  if (data.otherSocialLinks.length > 0) {
    for (const link of data.otherSocialLinks) {
      lines.push(`- **${capitalize(link.platform)}**: ${link.url}`)
    }
  }
  if (data.suggestedCategories) {
    lines.push(`- **Suggested Categories**: ${data.suggestedCategories.value.join(', ')} ${confidenceBadge(data.suggestedCategories.confidence)}`)
  }
  lines.push('')

  // CV Entries
  if (data.cvEntries.length > 0) {
    lines.push(`## CV Entries (${data.cvEntries.length} found)`)
    lines.push('')

    // Group by type
    const grouped = groupCvEntries(data.cvEntries)
    for (const [type, entries] of Object.entries(grouped)) {
      lines.push(`### ${capitalize(type)} (${entries.length})`)
      lines.push('')
      for (const entry of entries) {
        const yearStr = entry.year ? `, ${entry.year.value}` : ''
        const instStr = entry.institution ? ` - ${entry.institution.value}` : ''
        lines.push(`- ${entry.title.value}${instStr}${yearStr} ${confidenceBadge(entry.title.confidence)}`)
      }
      lines.push('')
    }
  }

  // Listings
  if (data.listings.length > 0) {
    const available = data.listings.filter((l) => !l.isSoldOut)
    const sold = data.listings.filter((l) => l.isSoldOut)

    lines.push(`## Listings (${data.listings.length} found)`)
    lines.push('')

    if (available.length > 0) {
      lines.push(`### Available (${available.length})`)
      lines.push('')
      for (let i = 0; i < available.length; i++) {
        lines.push(formatListing(i + 1, available[i]!))
      }
      lines.push('')
    }

    if (sold.length > 0) {
      lines.push(`### Sold (${sold.length})`)
      lines.push('')
      for (let i = 0; i < sold.length; i++) {
        lines.push(formatListing(i + 1, sold[i]!))
      }
      lines.push('')
    }
  }

  // Images summary
  lines.push('## Images')
  lines.push('')
  lines.push(`- Profile candidates: ${data.profileImages.length}`)
  lines.push(`- Cover candidates: ${data.coverImages.length}`)
  lines.push(`- Process/studio: ${data.processImages.length}`)
  const listingImageCount = data.listings.reduce((sum, l) => sum + l.images.length, 0)
  lines.push(`- Listing images: ${listingImageCount}`)
  lines.push('')

  // Warnings
  if (data.warnings.length > 0) {
    lines.push('## Warnings')
    lines.push('')
    for (const warning of data.warnings) {
      lines.push(`- ${warning}`)
    }
    lines.push('')
  }

  // Errors
  if (data.errors.length > 0) {
    lines.push('## Errors')
    lines.push('')
    for (const error of data.errors) {
      lines.push(`- **${error.url}**: ${error.error}`)
    }
    lines.push('')
  } else {
    lines.push('## Errors')
    lines.push('')
    lines.push('None')
    lines.push('')
  }

  // Source URLs
  lines.push('## Source URLs')
  lines.push('')
  for (const url of data.sourceUrls) {
    lines.push(`- ${url}`)
  }
  lines.push('')

  return lines.join('\n')
}

function formatListing(index: number, listing: ScrapedListing): string {
  const priceStr = listing.price ? ` - ${formatPrice(listing.price.value)}` : ''
  const mediumStr = listing.medium ? ` - ${listing.medium.value}` : ''
  const imageStr = listing.images.length > 0 ? ` [${listing.images.length} images]` : ''
  return `${index}. **${listing.title.value}**${priceStr}${mediumStr}${imageStr}`
}

function groupCvEntries(entries: ScrapedCvEntry[]): Record<string, ScrapedCvEntry[]> {
  const groups: Record<string, ScrapedCvEntry[]> = {}
  for (const entry of entries) {
    const type = entry.type.value
    if (!groups[type]) groups[type] = []
    groups[type].push(entry)
  }
  return groups
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Write the markdown summary to a file.
 */
export async function writeMarkdown(
  data: ScrapedArtistData,
  outputDir: string
): Promise<string> {
  await fs.mkdir(outputDir, { recursive: true })
  const filePath = path.join(outputDir, 'summary.md')
  const content = generateMarkdown(data)
  await fs.writeFile(filePath, content, 'utf-8')
  return filePath
}
