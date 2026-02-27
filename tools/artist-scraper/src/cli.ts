/**
 * CLI entry point for the artist data extraction tool.
 *
 * Usage:
 *   npx tsx tools/artist-scraper/src/cli.ts --website "https://abbey-peters.com" --name "Abbey Peters"
 *
 * See --help for all options.
 */

import { parseArgs } from 'node:util'
import { logger } from '@surfaced-art/utils'
import { scrapeArtist } from './scrape.js'
import type { ScrapeOptions } from './types.js'

const HELP_TEXT = `
Artist Data Extraction Tool — Surfaced Art
=============================================

Extracts structured artist data (bio, CV, listings, images) from an artist's
website and produces a local output bundle for seed data generation.

Usage:
  npx tsx tools/artist-scraper/src/cli.ts [options]

Options:
  --website <url>    Artist website URL (required)
  --instagram <url>  Instagram profile URL (passthrough, no scraping)
  --name <name>      Artist name (helps AI extraction)
  --output <dir>     Output directory (default: ./artist-scraper-output)
  --no-images        Skip image downloads (JSON + markdown only)
  --no-ai            Skip Claude API enrichment
  --browser          Force Playwright browser mode
  --verbose          Detailed logging
  --help             Show this help message

Examples:
  npx tsx tools/artist-scraper/src/cli.ts \\
    --website "https://abbey-peters.com" \\
    --name "Abbey Peters"

  npx tsx tools/artist-scraper/src/cli.ts \\
    --website "https://karinayanesceramics.squarespace.com" \\
    --name "Karina Yanes" \\
    --instagram "https://instagram.com/karinayanes.ceramics"

  npx tsx tools/artist-scraper/src/cli.ts \\
    --website "https://makomud.com" \\
    --browser --no-ai
`

function main() {
  let args

  try {
    args = parseArgs({
      options: {
        website: { type: 'string' },
        instagram: { type: 'string' },
        name: { type: 'string' },
        output: { type: 'string', default: './artist-scraper-output' },
        'no-images': { type: 'boolean', default: false },
        'no-ai': { type: 'boolean', default: false },
        browser: { type: 'boolean', default: false },
        verbose: { type: 'boolean', default: false },
        help: { type: 'boolean', default: false },
      },
      strict: true,
    })
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`)
    console.log(HELP_TEXT)
    process.exit(1)
  }

  if (args.values.help) {
    console.log(HELP_TEXT)
    process.exit(0)
  }

  if (!args.values.website) {
    console.error('Error: --website is required')
    console.log(HELP_TEXT)
    process.exit(1)
  }

  const options: ScrapeOptions = {
    websiteUrl: args.values.website,
    instagramUrl: args.values.instagram,
    artistName: args.values.name,
    outputDir: args.values.output || './artist-scraper-output',
    skipImages: args.values['no-images'] || false,
    skipAi: args.values['no-ai'] || false,
    forceBrowser: args.values.browser || false,
    verbose: args.values.verbose || false,
  }

  logger.info('Artist Scraper starting', {
    website: options.websiteUrl,
    name: options.artistName || 'not provided',
    options: {
      skipImages: options.skipImages,
      skipAi: options.skipAi,
      forceBrowser: options.forceBrowser,
    },
  })

  scrapeArtist(options)
    .then((result) => {
      console.log('')
      console.log('='.repeat(60))
      console.log('  Artist Scrape Complete')
      console.log('='.repeat(60))
      console.log('')

      if (result.data) {
        const d = result.data
        console.log(`  Name:       ${d.name?.value || 'Unknown'}`)
        console.log(`  Platform:   ${d.platform || 'unknown'}`)
        console.log(`  Listings:   ${d.listings.length}`)
        console.log(`  CV Entries:  ${d.cvEntries.length}`)
        console.log(`  Bio:        ${d.bio ? 'Found' : 'Not found'}`)
        console.log(`  Categories: ${d.suggestedCategories?.value.join(', ') || 'None'}`)
        console.log(`  Errors:     ${d.errors.length}`)
        console.log(`  Warnings:   ${d.warnings.length}`)
      }

      console.log('')
      console.log(`  Output:     ${result.outputDir || 'None'}`)
      console.log(`  Duration:   ${(result.duration / 1000).toFixed(1)}s`)
      console.log('')

      process.exit(result.success ? 0 : 1)
    })
    .catch((err) => {
      logger.error('Scraper failed', {
        error: err instanceof Error ? err.message : String(err),
      })
      process.exit(1)
    })
}

main()
