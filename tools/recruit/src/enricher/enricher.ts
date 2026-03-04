/**
 * Notion pipeline enricher orchestrator.
 *
 * Reads pipeline entries with missing fields, scrapes artist websites
 * to find social links, and updates Notion.
 */

import type { HttpClient } from '../shared/http-client.js'
import type { PipelineStage, OutputFormat } from '../shared/types.js'
import { NotionPipeline } from '../shared/notion-pipeline.js'
import { formatOutput } from '../shared/output-formatter.js'
import { canEnrich, findMissingFields } from './enricher-lib.js'
import { scrapeArtistWebsite } from './website-scraper.js'

export interface EnricherOptions {
  stage: PipelineStage | null
  field: 'instagram' | 'website' | null
  limit: number
  dryRun: boolean
  verbose: boolean
}

export interface EnricherResult {
  enriched: Array<{ name: string; field: string; value: string }>
  skipped: number
  failed: number
  total: number
}

export async function runEnricher(
  httpClient: HttpClient,
  pipeline: NotionPipeline,
  options: EnricherOptions
): Promise<EnricherResult> {
  // 1. Query pipeline for entries with missing fields
  if (options.verbose) {
    console.warn('Querying Notion pipeline...')
  }

  const filter: { stage?: PipelineStage; missingField?: 'instagram' | 'website' } = {}
  if (options.stage) filter.stage = options.stage
  if (options.field) filter.missingField = options.field

  const entries = await pipeline.queryEntries(filter)

  if (options.verbose) {
    console.warn(`Found ${entries.length} pipeline entries`)
  }

  // 2. Filter to enrichable entries
  const enrichable = entries.filter(canEnrich).slice(0, options.limit)

  if (options.verbose) {
    console.warn(`${enrichable.length} entries can be enriched (have website but missing other fields)`)
  }

  const result: EnricherResult = {
    enriched: [],
    skipped: entries.length - enrichable.length,
    failed: 0,
    total: entries.length,
  }

  // 3. Enrich each entry
  for (const entry of enrichable) {
    const missing = findMissingFields(entry)

    if (options.verbose) {
      console.warn(`Processing: ${entry.name} (missing: ${missing.join(', ')})`)
    }

    try {
      // Only scrape website → Instagram for now
      if (missing.includes('instagram') && entry.website) {
        const scrapeResult = await scrapeArtistWebsite(
          entry.website,
          httpClient
        )

        if (scrapeResult.instagram) {
          if (options.dryRun) {
            console.log(`  Would update ${entry.name}: Instagram = ${scrapeResult.instagram}`)
          } else {
            await pipeline.updateEntry(entry.id, {
              instagram: scrapeResult.instagram,
            })
            if (options.verbose) {
              console.warn(`  Updated ${entry.name}: Instagram = ${scrapeResult.instagram}`)
            }
          }
          result.enriched.push({
            name: entry.name,
            field: 'instagram',
            value: scrapeResult.instagram,
          })
        } else if (options.verbose) {
          console.warn(`  No Instagram found on ${entry.website}`)
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`  Error enriching ${entry.name}: ${message}`)
      result.failed++
    }
  }

  return result
}

/**
 * Format enricher results for console output.
 */
export function formatEnricherResults(
  result: EnricherResult,
  outputFormat: OutputFormat
): string {
  if (result.enriched.length === 0) {
    return 'No entries were enriched.'
  }

  return formatOutput(
    result.enriched,
    [
      { key: 'name', header: 'Artist', width: 25 },
      { key: 'field', header: 'Field', width: 12 },
      { key: 'value', header: 'Value', width: 40 },
    ],
    outputFormat
  )
}
