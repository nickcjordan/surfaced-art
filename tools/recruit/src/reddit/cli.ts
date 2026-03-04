/**
 * CLI entry point for the Reddit keyword monitor.
 *
 * Usage:
 *   npx tsx tools/recruit/src/reddit/cli.ts [options]
 *
 * Options:
 *   --subreddits <list>   Comma-separated subreddit list
 *   --keywords <list>     Comma-separated keyword list
 *   --days <n>            Posts from last N days (default: 30)
 *   --min-score <n>       Minimum post score (default: 1)
 *   --output <format>     table|json|csv (default: table)
 *   --limit <n>           Max posts per subreddit (default: 100)
 *   --verbose             Detailed logging
 */

import { RateLimiter } from '../shared/rate-limiter.js'
import { HttpClient } from '../shared/http-client.js'
import type { OutputFormat } from '../shared/types.js'
import { DEFAULT_SUBREDDITS, DEFAULT_KEYWORDS } from './reddit-lib.js'
import { runMonitor, formatMonitorResults } from './monitor.js'

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

interface CliArgs {
  subreddits: string[]
  keywords: string[]
  days: number
  minScore: number
  output: OutputFormat
  limit: number
  verbose: boolean
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2)
  const result: CliArgs = {
    subreddits: DEFAULT_SUBREDDITS,
    keywords: DEFAULT_KEYWORDS,
    days: 30,
    minScore: 1,
    output: 'table',
    limit: 100,
    verbose: false,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    switch (arg) {
      case '--subreddits':
        result.subreddits = (args[++i] ?? '').split(',').map((s) => s.trim()).filter(Boolean)
        break
      case '--keywords':
        result.keywords = (args[++i] ?? '').split(',').map((s) => s.trim()).filter(Boolean)
        break
      case '--days':
        result.days = parseInt(args[++i] ?? '30', 10)
        break
      case '--min-score':
        result.minScore = parseInt(args[++i] ?? '1', 10)
        break
      case '--output':
        result.output = (args[++i] ?? 'table') as OutputFormat
        break
      case '--limit':
        result.limit = parseInt(args[++i] ?? '100', 10)
        break
      case '--verbose':
        result.verbose = true
        break
      default:
        console.error(`Unknown argument: ${arg}`)
        console.error('Usage: npx tsx tools/recruit/src/reddit/cli.ts [--subreddits <list>] [--keywords <list>] [--days <n>] [--min-score <n>] [--output table|json|csv] [--limit <n>] [--verbose]')
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

  console.log('Reddit Keyword Monitor')
  console.log('='.repeat(50))
  console.log(`Subreddits: ${cliArgs.subreddits.join(', ')}`)
  console.log(`Keywords:   ${cliArgs.keywords.length} phrase(s)`)
  console.log(`Max age:    ${cliArgs.days} day(s)`)
  console.log(`Min score:  ${cliArgs.minScore}`)
  console.log('')

  const rateLimiter = new RateLimiter({ minDelayMs: 2000 })
  const httpClient = new HttpClient({ rateLimiter })

  const result = await runMonitor(httpClient, {
    subreddits: cliArgs.subreddits,
    keywords: cliArgs.keywords,
    maxAgeDays: cliArgs.days,
    minScore: cliArgs.minScore,
    limit: cliArgs.limit,
    outputFormat: cliArgs.output,
    verbose: cliArgs.verbose,
  })

  console.log(
    formatMonitorResults(result, cliArgs.keywords, cliArgs.output)
  )

  console.log('')
  console.log('-'.repeat(50))
  console.log(
    `Searched ${result.subredditsSearched} subreddit(s) | ` +
      `Skipped ${result.subredditsSkipped} | ` +
      `Found ${result.posts.length} matching post(s)`
  )
}

main().catch((err: unknown) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
