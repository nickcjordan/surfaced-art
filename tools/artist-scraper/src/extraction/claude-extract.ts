/**
 * Claude API integration for intelligent data extraction.
 *
 * Uses the Anthropic SDK to parse unstructured text (CV pages, bios)
 * into structured data. Dramatically more accurate than heuristic
 * parsing for free-form text.
 *
 * Requires ANTHROPIC_API_KEY environment variable.
 * Disabled with --no-ai flag.
 */

import { logger } from '@surfaced-art/utils'
import type { ScrapedArtistData, ScrapedCvEntry } from '../types.js'
import type { CategoryType, CvEntryTypeType } from '@surfaced-art/types'

const CLAUDE_TIMEOUT_MS = 120_000
const MODEL = 'claude-haiku-4-5-20251001'

interface ClaudeClient {
  messages: {
    create(params: {
      model: string
      max_tokens: number
      messages: Array<{ role: string; content: string }>
      system?: string
    }): Promise<{
      content: Array<{ type: string; text?: string }>
    }>
  }
}

/**
 * Initialize the Anthropic SDK client.
 * Returns null if ANTHROPIC_API_KEY is not set.
 */
async function getClient(): Promise<ClaudeClient | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null
  }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    return new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: CLAUDE_TIMEOUT_MS,
    }) as unknown as ClaudeClient
  } catch (err) {
    logger.warn('Failed to initialize Anthropic SDK', {
      error: err instanceof Error ? err.message : String(err),
    })
    return null
  }
}

/**
 * Run all Claude API extraction steps on the scraped data.
 * Mutates the data object in place.
 */
export async function runClaudeExtraction(
  data: ScrapedArtistData,
  rawCvText?: string,
  rawAboutText?: string
): Promise<void> {
  const client = await getClient()
  if (!client) {
    data.warnings.push('Claude API unavailable (no ANTHROPIC_API_KEY). Skipping AI extraction.')
    return
  }

  logger.info('Running Claude API extraction')

  // 1. Parse CV entries
  if (rawCvText && rawCvText.length > 50) {
    try {
      const cvEntries = await parseCvWithClaude(client, rawCvText)
      if (cvEntries.length > 0) {
        // Replace heuristic entries with AI-parsed ones
        data.cvEntries = cvEntries
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      data.warnings.push(`Claude CV parsing failed: ${msg}`)
    }
  }

  // 2. Extract clean bio
  if (rawAboutText && rawAboutText.length > 50 && (!data.bio || data.bio.confidence !== 'high')) {
    try {
      const bio = await extractBioWithClaude(client, rawAboutText, data.name?.value)
      if (bio) {
        data.bio = { value: bio, confidence: 'medium', source: 'claude-api' }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      data.warnings.push(`Claude bio extraction failed: ${msg}`)
    }
  }

  // 3. Suggest categories
  try {
    const categories = await suggestCategoriesWithClaude(client, data)
    if (categories && categories.length > 0) {
      data.suggestedCategories = {
        value: categories,
        confidence: 'medium',
        source: 'claude-api',
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    data.warnings.push(`Claude category suggestion failed: ${msg}`)
  }
}

/**
 * Parse unstructured CV text into structured entries.
 */
async function parseCvWithClaude(
  client: ClaudeClient,
  rawText: string
): Promise<ScrapedCvEntry[]> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: `You are a data extraction assistant. Extract structured CV entries from the given artist CV text.

Return a JSON array where each entry has:
- type: one of "education", "exhibition", "residency", "award", "press", "other"
- title: the name/title of the entry
- institution: the institution, venue, or organization (null if not clear)
- year: the year as a number (null if not found)
- raw: the original text this was extracted from

Only return the JSON array, no other text. If the text doesn't contain CV entries, return [].`,
    messages: [
      {
        role: 'user',
        content: `Extract structured CV entries from this artist's CV page text:\n\n${rawText.substring(0, 8000)}`,
      },
    ],
  })

  const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
  if (!text) return []

  // Extract JSON from the response (may be wrapped in markdown code fences)
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return []

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      type: string
      title: string
      institution: string | null
      year: number | null
      raw: string
    }>

    const validTypes: CvEntryTypeType[] = ['education', 'exhibition', 'residency', 'award', 'press', 'other']

    return parsed
      .filter((entry) => entry.title && typeof entry.title === 'string')
      .map((entry) => ({
        type: {
          value: (validTypes.includes(entry.type as CvEntryTypeType) ? entry.type : 'other') as CvEntryTypeType,
          confidence: 'medium' as const,
          source: 'claude-api',
        },
        title: { value: entry.title, confidence: 'medium' as const, source: 'claude-api' },
        institution: entry.institution
          ? { value: entry.institution, confidence: 'medium' as const, source: 'claude-api' }
          : null,
        year: entry.year
          ? { value: entry.year, confidence: 'medium' as const, source: 'claude-api' }
          : null,
        raw: entry.raw || entry.title,
      }))
  } catch {
    return []
  }
}

/**
 * Extract a clean artist bio from an about page.
 */
async function extractBioWithClaude(
  client: ClaudeClient,
  rawText: string,
  artistName?: string
): Promise<string | null> {
  const nameHint = artistName ? ` The artist's name is ${artistName}.` : ''

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: `You are a data extraction assistant. Extract the artist's bio/about paragraph from the given page text.${nameHint}

Return ONLY the bio paragraph text (80-150 words ideal, no more than 200 words). Strip navigation text, footer content, and other non-bio text. If no clear bio is found, return "null".`,
    messages: [
      {
        role: 'user',
        content: `Extract the artist bio from this page text:\n\n${rawText.substring(0, 4000)}`,
      },
    ],
  })

  const text = response.content[0]?.type === 'text' ? response.content[0].text?.trim() : ''
  if (!text || text === 'null' || text.length < 30) return null
  return text
}

/**
 * Suggest platform categories based on the scraped data.
 */
async function suggestCategoriesWithClaude(
  client: ClaudeClient,
  data: ScrapedArtistData
): Promise<CategoryType[] | null> {
  const context: string[] = []
  if (data.bio) context.push(`Bio: ${data.bio.value}`)
  if (data.artistStatement) context.push(`Statement: ${data.artistStatement.value}`)
  const titles = data.listings.slice(0, 10).map((l) => l.title.value)
  if (titles.length > 0) context.push(`Listing titles: ${titles.join(', ')}`)
  const mediums = data.listings
    .filter((l) => l.medium)
    .map((l) => l.medium!.value)
    .slice(0, 10)
  if (mediums.length > 0) context.push(`Mediums: ${mediums.join(', ')}`)

  if (context.length === 0) return null

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 256,
    system: `You are classifying an artist into platform categories.

Available categories: ceramics, painting, print, jewelry, illustration, photography, woodworking, fibers, mixed_media

Return a JSON array of 1-3 category strings that best describe this artist's work. Return ONLY the JSON array.`,
    messages: [
      {
        role: 'user',
        content: context.join('\n'),
      },
    ],
  })

  const text = response.content[0]?.type === 'text' ? response.content[0].text?.trim() : ''
  if (!text) return null

  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return null

  try {
    const parsed = JSON.parse(jsonMatch[0]) as string[]
    const validCategories: CategoryType[] = [
      'ceramics', 'painting', 'print', 'jewelry', 'illustration',
      'photography', 'woodworking', 'fibers', 'mixed_media',
    ]
    return parsed.filter((c) => validCategories.includes(c as CategoryType)) as CategoryType[]
  } catch {
    return null
  }
}
