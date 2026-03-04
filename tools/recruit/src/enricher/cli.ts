/**
 * CLI entry point for the Notion pipeline enricher.
 *
 * Usage:
 *   npx tsx tools/recruit/src/enricher/cli.ts [options]
 *
 * Options:
 *   --stage <stage>       Only enrich entries at this stage (default: all)
 *   --field <field>       Only enrich: instagram, website (default: all missing)
 *   --limit <n>           Max entries to process (default: 50)
 *   --dry-run             Show what would be updated without doing it
 *   --verbose             Detailed logging
 */

import { Client } from '@notionhq/client'
import { RateLimiter } from '../shared/rate-limiter.js'
import { HttpClient } from '../shared/http-client.js'
import { NotionPipeline } from '../shared/notion-pipeline.js'
import type { OutputFormat, PipelineStage } from '../shared/types.js'
import { runEnricher, formatEnricherResults } from './enricher.js'

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

interface CliArgs {
  stage: PipelineStage | null
  field: 'instagram' | 'website' | null
  limit: number
  dryRun: boolean
  output: OutputFormat
  verbose: boolean
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2)
  const result: CliArgs = {
    stage: null,
    field: null,
    limit: 50,
    dryRun: false,
    output: 'table',
    verbose: false,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    switch (arg) {
      case '--stage':
        result.stage = (args[++i] ?? null) as PipelineStage | null
        break
      case '--field':
        result.field = (args[++i] ?? null) as 'instagram' | 'website' | null
        break
      case '--limit':
        result.limit = parseInt(args[++i] ?? '50', 10)
        break
      case '--dry-run':
        result.dryRun = true
        break
      case '--output':
        result.output = (args[++i] ?? 'table') as OutputFormat
        break
      case '--verbose':
        result.verbose = true
        break
      default:
        console.error(`Unknown argument: ${arg}`)
        console.error(
          'Usage: npx tsx tools/recruit/src/enricher/cli.ts [--stage <stage>] [--field instagram|website] [--limit <n>] [--dry-run] [--verbose]'
        )
        process.exit(1)
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const cliArgs = parseArgs()

  const notionToken = process.env.NOTION_API_TOKEN
  if (!notionToken) {
    console.error(
      'ERROR: NOTION_API_TOKEN environment variable is required.\n' +
        'Create a Notion integration at https://www.notion.so/my-integrations\n' +
        'and share the Artist Pipeline database with it.'
    )
    process.exit(1)
  }

  console.log('Notion Pipeline Enricher')
  console.log('='.repeat(50))
  if (cliArgs.stage) console.log(`Stage:   ${cliArgs.stage}`)
  if (cliArgs.field) console.log(`Field:   ${cliArgs.field}`)
  console.log(`Limit:   ${cliArgs.limit}`)
  if (cliArgs.dryRun) console.log('Mode:    DRY RUN')
  console.log('')

  const pipeline = new NotionPipeline(new Client({ auth: notionToken }))
  const rateLimiter = new RateLimiter({ minDelayMs: 1500 })
  const httpClient = new HttpClient({ rateLimiter })

  const result = await runEnricher(httpClient, pipeline, {
    stage: cliArgs.stage,
    field: cliArgs.field,
    limit: cliArgs.limit,
    dryRun: cliArgs.dryRun,
    verbose: cliArgs.verbose,
  })

  console.log(formatEnricherResults(result, cliArgs.output))

  console.log('')
  console.log('-'.repeat(50))
  console.log(
    `Total: ${result.total} | ` +
      `Enriched: ${result.enriched.length} | ` +
      `Skipped: ${result.skipped} | ` +
      `Failed: ${result.failed}`
  )

  if (result.failed > 0) process.exit(1)
}

main().catch((err: unknown) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
