/**
 * Core orchestrator for artist data extraction.
 *
 * Coordinates platform detection, scraper dispatch, AI enrichment,
 * and output generation.
 */

import { logger } from '@surfaced-art/utils'
import type { ScrapedArtistData, ScrapeOptions, ScraperResult } from './types.js'
import { fetchPage, createEmptyScrapedData } from './scrapers/base.js'
import { detectPlatform } from './detection/platform-detector.js'
import { SquarespaceScraper } from './scrapers/squarespace.js'
import { GenericHtmlScraper } from './scrapers/generic-html.js'
import { BrowserScraper } from './scrapers/browser.js'
import { runClaudeExtraction } from './extraction/claude-extract.js'
import { writeJson } from './output/json-writer.js'
import { writeMarkdown } from './output/markdown-writer.js'
import { downloadImages } from './output/image-downloader.js'
import { slugify, normalizeUrl } from './utils/url.js'
import { loadHtml } from './utils/html.js'
import path from 'node:path'

/**
 * Run the full extraction pipeline for a single artist.
 */
export async function scrapeArtist(options: ScrapeOptions): Promise<ScraperResult> {
  const startTime = Date.now()

  // Normalize the URL
  const url = normalizeUrl(options.websiteUrl)
  if (!url) {
    return {
      success: false,
      data: null,
      outputDir: null,
      duration: Date.now() - startTime,
    }
  }

  logger.info('Starting artist scrape', { url, options: { ...options, websiteUrl: url } })

  // Step 1: Detect platform
  logger.info('Detecting platform...')
  const homeResult = await fetchPage(url, { verbose: options.verbose })

  let data: ScrapedArtistData

  if (!homeResult.ok) {
    logger.error('Failed to fetch website', { url, status: homeResult.status })

    if (options.forceBrowser) {
      // Try browser scraper even if initial fetch failed
      logger.info('Trying browser scraper...')
      const browserScraper = new BrowserScraper()
      data = await browserScraper.scrape(url, options)
    } else {
      data = createEmptyScrapedData(url, options.instagramUrl) as ScrapedArtistData
      data.errors.push({ url, error: `HTTP ${homeResult.status}: Failed to fetch` })
      return {
        success: false,
        data,
        outputDir: null,
        duration: Date.now() - startTime,
      }
    }
  } else {
    const platform = detectPlatform(homeResult.headers, homeResult.body, homeResult.url)
    logger.info('Platform detected', { platform: platform.platform })

    // Step 2: Run the appropriate scraper
    if (options.forceBrowser) {
      const scraper = new BrowserScraper()
      data = await scraper.scrape(url, options)
    } else {
      switch (platform.platform) {
        case 'squarespace': {
          const scraper = new SquarespaceScraper()
          data = await scraper.scrape(url, options)
          break
        }
        case 'cargo': {
          // Cargo sites need browser rendering
          logger.info('Cargo site detected — using browser scraper')
          const scraper = new BrowserScraper()
          data = await scraper.scrape(url, options)
          break
        }
        default: {
          const scraper = new GenericHtmlScraper()
          data = await scraper.scrape(url, options)

          // Check if we got meaningful content — if not, try browser
          const hasContent = data.listings.length > 0 || data.cvEntries.length > 0 || data.bio
          if (!hasContent) {
            logger.info('Generic scraper found little content — trying browser fallback')
            const browserScraper = new BrowserScraper()
            const browserData = await browserScraper.scrape(url, options)

            // Use browser data if it found more content
            const browserHasMore =
              browserData.listings.length > data.listings.length ||
              browserData.cvEntries.length > data.cvEntries.length ||
              (browserData.bio && !data.bio)

            if (browserHasMore) {
              data = browserData
            }
          }
          break
        }
      }
    }
  }

  // Step 3: Claude API enrichment
  if (!options.skipAi) {
    // Gather raw text for AI processing
    let rawCvText: string | undefined
    let rawAboutText: string | undefined

    // Try to get raw CV text from visited pages
    for (const sourceUrl of data.sourceUrls) {
      if (/cv|resume|exhibition/i.test(sourceUrl)) {
        const result = await fetchPage(sourceUrl)
        if (result.ok) {
          const $ = loadHtml(result.body)
          rawCvText = $('body').text().trim()
        }
        break
      }
    }

    // Try to get raw about text
    for (const sourceUrl of data.sourceUrls) {
      if (/about|bio|artist/i.test(sourceUrl)) {
        const result = await fetchPage(sourceUrl)
        if (result.ok) {
          const $ = loadHtml(result.body)
          rawAboutText = $('body').text().trim()
        }
        break
      }
    }

    await runClaudeExtraction(data, rawCvText, rawAboutText)
  }

  // Step 4: Determine output directory
  const artistSlug =
    options.artistName ? slugify(options.artistName) :
    data.name ? slugify(data.name.value) :
    slugify(new URL(url).hostname)

  const outputDir = path.join(options.outputDir, artistSlug)

  // Step 5: Write outputs
  logger.info('Writing outputs', { outputDir })

  const jsonPath = await writeJson(data, outputDir)
  logger.info('JSON written', { path: jsonPath })

  const mdPath = await writeMarkdown(data, outputDir)
  logger.info('Markdown written', { path: mdPath })

  // Step 6: Download images
  if (!options.skipImages) {
    logger.info('Downloading images...')
    const imageStats = await downloadImages(data, outputDir, options.verbose)
    logger.info('Images downloaded', imageStats)
  }

  const duration = Date.now() - startTime
  logger.info('Scrape complete', {
    duration: `${(duration / 1000).toFixed(1)}s`,
    listings: data.listings.length,
    cvEntries: data.cvEntries.length,
    errors: data.errors.length,
  })

  return {
    success: data.errors.length === 0,
    data,
    outputDir,
    duration,
  }
}
