/**
 * Art fair roster scraper orchestrator.
 *
 * Fetches an art fair's artist directory page, dispatches to the
 * appropriate adapter for HTML parsing, and outputs structured results.
 */

import type { HttpClient } from '../shared/http-client.js'
import type { ArtistLead, OutputFormat } from '../shared/types.js'
import { NotionPipeline } from '../shared/notion-pipeline.js'
import { formatOutput } from '../shared/output-formatter.js'
import { deduplicateLeads } from './art-fair-lib.js'
import type { FairAdapter } from './adapters/types.js'
import { GenericFairAdapter } from './adapters/generic.js'

export interface ScraperOptions {
  url: string
  adapterName: string
  pushToNotion: boolean
  dryRun: boolean
  outputFormat: OutputFormat
  verbose: boolean
}

export interface ScraperResult {
  leads: ArtistLead[]
  adapterUsed: string
  duplicatesSkipped: number
  notionCreated: number
  notionSkipped: number
  notionFailed: number
}

const ADAPTERS: FairAdapter[] = [
  new GenericFairAdapter(),
]

function getAdapter(name: string): FairAdapter {
  const adapter = ADAPTERS.find((a) => a.name === name)
  if (!adapter) {
    throw new Error(
      `Unknown adapter: ${name}. Available: ${ADAPTERS.map((a) => a.name).join(', ')}`
    )
  }
  return adapter
}

function selectAdapter(url: string, forcedName?: string): FairAdapter {
  if (forcedName) return getAdapter(forcedName)

  // Try site-specific adapters first
  for (const adapter of ADAPTERS) {
    if (adapter.name !== 'generic' && adapter.canHandle(url)) {
      return adapter
    }
  }

  // Fall back to generic
  return getAdapter('generic')
}

export async function runScraper(
  httpClient: HttpClient,
  options: ScraperOptions,
  pipeline?: NotionPipeline
): Promise<ScraperResult> {
  // 1. Fetch the page
  if (options.verbose) {
    console.warn(`Fetching ${options.url}...`)
  }

  const result = await httpClient.get(options.url)
  if (!result.ok) {
    throw new Error(`Failed to fetch ${options.url}: HTTP ${result.status}`)
  }

  // 2. Select and run adapter
  const adapter = selectAdapter(options.url, options.adapterName)
  if (options.verbose) {
    console.warn(`Using adapter: ${adapter.name}`)
  }

  const rawLeads = adapter.extract(result.body, options.url)
  const leads = deduplicateLeads(rawLeads)
  const duplicatesSkipped = rawLeads.length - leads.length

  if (options.verbose) {
    console.warn(
      `Extracted ${rawLeads.length} artist(s), ${leads.length} unique`
    )
  }

  // 3. Optionally push to Notion
  let notionCreated = 0
  let notionSkipped = 0
  let notionFailed = 0

  if (options.pushToNotion && pipeline) {
    for (const lead of leads) {
      try {
        const existing = await pipeline.findByName(lead.name)
        if (existing) {
          if (options.verbose) {
            console.warn(`  Skip (exists): ${lead.name}`)
          }
          notionSkipped++
          continue
        }

        if (options.dryRun) {
          console.log(`  Would create: ${lead.name}`)
          notionSkipped++
          continue
        }

        await pipeline.createEntry(lead)
        if (options.verbose) {
          console.warn(`  Created: ${lead.name}`)
        }
        notionCreated++
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`  Failed to create ${lead.name}: ${message}`)
        notionFailed++
      }
    }
  }

  return {
    leads,
    adapterUsed: adapter.name,
    duplicatesSkipped,
    notionCreated,
    notionSkipped,
    notionFailed,
  }
}

/**
 * Format scraper results for console output.
 */
export function formatScraperResults(
  result: ScraperResult,
  outputFormat: OutputFormat
): string {
  if (result.leads.length === 0) {
    return 'No artists found on this page.'
  }

  const data = result.leads.map((lead) => ({
    name: lead.name,
    category: lead.category ?? '-',
    website: lead.website ?? '-',
    instagram: lead.instagram ?? '-',
    notes: lead.notes ?? '-',
  }))

  return formatOutput(
    data,
    [
      { key: 'name', header: 'Name', width: 25 },
      { key: 'category', header: 'Category', width: 15 },
      { key: 'website', header: 'Website', width: 30 },
      { key: 'instagram', header: 'Instagram', width: 30 },
    ],
    outputFormat
  )
}
