/**
 * CLI entry point for the art fair roster scraper.
 *
 * Usage:
 *   npx tsx tools/recruit/src/art-fair/cli.ts --url <url> [options]
 *
 * Options:
 *   --url <url>           Art fair artist directory page URL (required)
 *   --adapter <name>      Force adapter: generic (default)
 *   --push-to-notion      Create entries in Notion Artist Pipeline
 *   --output <format>     table|json|csv (default: table)
 *   --dry-run             Show what would be pushed without doing it
 *   --verbose             Detailed logging
 */

import { Client } from '@notionhq/client'
import { RateLimiter } from '../shared/rate-limiter.js'
import { HttpClient } from '../shared/http-client.js'
import { NotionPipeline } from '../shared/notion-pipeline.js'
import type { OutputFormat } from '../shared/types.js'
import { runScraper, formatScraperResults } from './scraper.js'

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

interface CliArgs {
  url: string | null
  adapter: string
  pushToNotion: boolean
  output: OutputFormat
  dryRun: boolean
  verbose: boolean
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2)
  const result: CliArgs = {
    url: null,
    adapter: 'generic',
    pushToNotion: false,
    output: 'table',
    dryRun: false,
    verbose: false,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    switch (arg) {
      case '--url':
        result.url = args[++i] ?? null
        break
      case '--adapter':
        result.adapter = args[++i] ?? 'generic'
        break
      case '--push-to-notion':
        result.pushToNotion = true
        break
      case '--output':
        result.output = (args[++i] ?? 'table') as OutputFormat
        break
      case '--dry-run':
        result.dryRun = true
        break
      case '--verbose':
        result.verbose = true
        break
      default:
        console.error(`Unknown argument: ${arg}`)
        console.error(
          'Usage: npx tsx tools/recruit/src/art-fair/cli.ts --url <url> [--adapter <name>] [--push-to-notion] [--output table|json|csv] [--dry-run] [--verbose]'
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

  if (!cliArgs.url) {
    console.error('ERROR: --url is required.')
    console.error(
      'Usage: npx tsx tools/recruit/src/art-fair/cli.ts --url <url>'
    )
    process.exit(1)
  }

  console.log('Art Fair Roster Scraper')
  console.log('='.repeat(50))
  console.log(`URL:     ${cliArgs.url}`)
  console.log(`Adapter: ${cliArgs.adapter}`)
  if (cliArgs.pushToNotion) console.log('Push:    Notion Artist Pipeline')
  if (cliArgs.dryRun) console.log('Mode:    DRY RUN')
  console.log('')

  // Set up Notion pipeline if pushing
  let pipeline: NotionPipeline | undefined
  if (cliArgs.pushToNotion) {
    const notionToken = process.env.NOTION_API_TOKEN
    if (!notionToken) {
      console.error(
        'ERROR: NOTION_API_TOKEN environment variable is required with --push-to-notion.'
      )
      process.exit(1)
    }
    pipeline = new NotionPipeline(new Client({ auth: notionToken }))
  }

  const rateLimiter = new RateLimiter({ minDelayMs: 1000 })
  const httpClient = new HttpClient({ rateLimiter })

  const result = await runScraper(httpClient, {
    url: cliArgs.url,
    adapterName: cliArgs.adapter,
    pushToNotion: cliArgs.pushToNotion,
    dryRun: cliArgs.dryRun,
    outputFormat: cliArgs.output,
    verbose: cliArgs.verbose,
  }, pipeline)

  console.log(formatScraperResults(result, cliArgs.output))

  console.log('')
  console.log('-'.repeat(50))
  console.log(
    `Adapter: ${result.adapterUsed} | ` +
      `Artists: ${result.leads.length} | ` +
      `Duplicates removed: ${result.duplicatesSkipped}`
  )
  if (cliArgs.pushToNotion) {
    console.log(
      `Notion: ${result.notionCreated} created | ` +
        `${result.notionSkipped} skipped | ` +
        `${result.notionFailed} failed`
    )
  }

  if (result.notionFailed > 0) process.exit(1)
}

main().catch((err: unknown) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
