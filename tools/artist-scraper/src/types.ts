/**
 * Types for the artist data extraction tool.
 *
 * Every extracted value is wrapped in ExtractedField<T> to carry
 * confidence and source metadata, so the human reviewer knows
 * what to trust and what to verify.
 */

import type { CategoryType, CvEntryTypeType } from '@surfaced-art/types'

// ============================================================================
// Field-level types
// ============================================================================

/** How confident the extraction is for this field. */
export type Confidence = 'high' | 'medium' | 'low'

/** A single extracted value with its confidence and provenance. */
export interface ExtractedField<T> {
  value: T
  confidence: Confidence
  /** URL where this was found, or 'claude-api' for AI-extracted fields. */
  source: string
}

// ============================================================================
// Image types
// ============================================================================

/** Context hint for how an image relates to the artist's profile. */
export type ImageContext = 'product' | 'profile' | 'cover' | 'process' | 'unknown'

/** A reference to an image discovered during scraping (not yet downloaded). */
export interface ScrapedImage {
  url: string
  alt: string | null
  context: ImageContext
  /** The page URL where this image was found. */
  sourcePageUrl: string
}

// ============================================================================
// Listing types
// ============================================================================

/** Parsed physical dimensions. */
export interface ParsedDimensions {
  length: number | null
  width: number | null
  height: number | null
  /** Measurement unit, e.g. 'in' or 'cm'. */
  unit: string
}

/** A product/listing found on the artist's website. */
export interface ScrapedListing {
  title: ExtractedField<string>
  description: ExtractedField<string> | null
  /** Price in cents (e.g. 12500 = $125.00). Null if not found. */
  price: ExtractedField<number> | null
  priceCurrency: string | null
  medium: ExtractedField<string> | null
  dimensions: ExtractedField<ParsedDimensions> | null
  images: ScrapedImage[]
  /** Direct URL to this product's page. */
  sourceUrl: string
  isSoldOut: boolean
}

// ============================================================================
// CV types
// ============================================================================

/** A CV entry parsed from the artist's website. */
export interface ScrapedCvEntry {
  type: ExtractedField<CvEntryTypeType>
  title: ExtractedField<string>
  institution: ExtractedField<string> | null
  year: ExtractedField<number> | null
  /** Original raw text for human review. */
  raw: string
}

// ============================================================================
// Top-level output
// ============================================================================

/** Social link found on the artist's site (not Instagram). */
export interface SocialLink {
  platform: string
  url: string
}

/** Complete output of a scraping run for a single artist. */
export interface ScrapedArtistData {
  /** ISO timestamp of when the scrape was performed. */
  scrapedAt: string
  /** All URLs that were visited during the scrape. */
  sourceUrls: string[]
  /** Detected website platform, or null if unknown. */
  platform: string | null

  // Profile
  name: ExtractedField<string> | null
  bio: ExtractedField<string> | null
  artistStatement: ExtractedField<string> | null
  location: ExtractedField<string> | null
  email: ExtractedField<string> | null
  websiteUrl: string
  /** Passthrough only — no Instagram scraping. */
  instagramUrl: string | null
  otherSocialLinks: SocialLink[]

  // Images (candidates — not yet selected)
  profileImages: ScrapedImage[]
  coverImages: ScrapedImage[]
  processImages: ScrapedImage[]

  // Structured content
  cvEntries: ScrapedCvEntry[]
  listings: ScrapedListing[]

  /** Claude-suggested categories based on bio and listing content. */
  suggestedCategories: ExtractedField<CategoryType[]> | null

  // Diagnostics
  errors: Array<{ url: string; error: string }>
  warnings: string[]
}

// ============================================================================
// Scraper interface
// ============================================================================

/** Result envelope from the orchestrator. */
export interface ScraperResult {
  success: boolean
  data: ScrapedArtistData | null
  /** Path to the output directory (images, JSON, markdown). Null on failure. */
  outputDir: string | null
  /** Duration in milliseconds. */
  duration: number
}

/** Platform detected by the platform detector. */
export interface DetectedPlatform {
  platform: 'squarespace' | 'cargo' | 'wordpress' | 'shopify' | 'generic'
  /** Platform-specific hints (e.g. Squarespace site ID). */
  hints: Record<string, string>
}

/** Options passed to scrapers. */
export interface ScrapeOptions {
  websiteUrl: string
  instagramUrl?: string
  artistName?: string
  outputDir: string
  skipImages: boolean
  skipAi: boolean
  forceBrowser: boolean
  verbose: boolean
}

/** Interface that every platform-specific scraper implements. */
export interface Scraper {
  /** Extract artist data from the given URL. */
  scrape(url: string, options: ScrapeOptions): Promise<ScrapedArtistData>
}
