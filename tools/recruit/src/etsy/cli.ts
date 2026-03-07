/**
 * CLI entry point for the Etsy category browser.
 *
 * Usage:
 *   npx tsx tools/recruit/src/etsy/cli.ts --category <name> [options]
 *
 * Options:
 *   --category <name>     SA category: ceramics, painting, print, jewelry, etc. (required)
 *   --min-price <cents>   Min listing price in cents (default: 4000 = $40)
 *   --max-price <cents>   Max listing price in cents (default: 80000 = $800)
 *   --limit <n>           Max shops to return (default: 50)
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
import { runBrowser, formatBrowserResults } from './browser.js'

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

interface CliArgs {
  category: string | null
  minPrice: number
  maxPrice: number
  limit: number
  pushToNotion: boolean
  output: OutputFormat
  dryRun: boolean
  verbose: boolean
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2)
  const result: CliArgs = {
    category: null,
    minPrice: 4000,
    maxPrice: 80000,
    limit: 50,
    pushToNotion: false,
    output: 'table',
    dryRun: false,
    verbose: false,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    switch (arg) {
      case '--category':
        result.category = args[++i] ?? null
        break
      case '--min-price':
        result.minPrice = parseInt(args[++i] ?? '4000', 10)
        break
      case '--max-price':
        result.maxPrice = parseInt(args[++i] ?? '80000', 10)
        break
      case '--limit':
        result.limit = parseInt(args[++i] ?? '50', 10)
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
          'Usage: npx tsx tools/recruit/src/etsy/cli.ts --category <name> [--min-price <cents>] [--max-price <cents>] [--limit <n>] [--push-to-notion] [--output table|json|csv] [--dry-run] [--verbose]'
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

  if (!cliArgs.category) {
    console.error('ERROR: --category is required.')
    console.error(
      'Available: ceramics, painting, print, jewelry, illustration, photography, woodworking, fibers, mixed media'
    )
    process.exit(1)
  }

  const apiKey = process.env.ETSY_API_KEY
  if (!apiKey) {
    console.error(
      'ERROR: ETSY_API_KEY environment variable is required.\n' +
        'Register a free Etsy app at https://developers.etsy.com/ to get an API key.'
    )
    process.exit(1)
  }

  console.log('Etsy Category Browser')
  console.log('='.repeat(50))
  console.log(`Category:    ${cliArgs.category}`)
  console.log(
    `Price range: $${(cliArgs.minPrice / 100).toFixed(0)} - $${(cliArgs.maxPrice / 100).toFixed(0)}`
  )
  console.log(`Max shops:   ${cliArgs.limit}`)
  if (cliArgs.pushToNotion) console.log('Push:        Notion Artist Pipeline')
  if (cliArgs.dryRun) console.log('Mode:        DRY RUN')
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

  const rateLimiter = new RateLimiter({ minDelayMs: 100 })
  const httpClient = new HttpClient({ rateLimiter })

  const result = await runBrowser(httpClient, {
    category: cliArgs.category,
    minPriceCents: cliArgs.minPrice,
    maxPriceCents: cliArgs.maxPrice,
    limit: cliArgs.limit,
    pushToNotion: cliArgs.pushToNotion,
    dryRun: cliArgs.dryRun,
    outputFormat: cliArgs.output,
    verbose: cliArgs.verbose,
    apiKey,
  }, pipeline)

  console.log(formatBrowserResults(result, cliArgs.output))

  console.log('')
  console.log('-'.repeat(50))
  console.log(
    `Listings: ${result.totalListingsFound} | ` +
      `Shops: ${result.shops.length} | ` +
      `Filtered: ${result.shopsFiltered}`
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
  const message = err instanceof Error ? err.message : String(err)
  // Redact API keys from error output to avoid logging secrets
  const safe = message.replace(/x-api-key=[^&\s]+/gi, 'x-api-key=REDACTED')
  console.error('Unexpected error:', safe)
  process.exit(1)
})
