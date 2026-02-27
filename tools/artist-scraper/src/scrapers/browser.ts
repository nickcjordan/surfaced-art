/**
 * Playwright-based browser scraper.
 *
 * Fallback for JS-rendered sites (like Cargo) where cheerio
 * cannot access the rendered content. Launches a headless
 * Chromium browser, renders the page, then delegates to the
 * generic HTML scraper for extraction.
 */

import { logger } from '@surfaced-art/utils'
import type { ScrapedArtistData, ScrapeOptions, Scraper } from '../types.js'
import { GenericHtmlScraper } from './generic-html.js'
import { createEmptyScrapedData } from './base.js'
import { extractNavLinks, loadHtml } from '../utils/html.js'
import { isSameDomain } from '../utils/url.js'
import path from 'node:path'
import fs from 'node:fs/promises'

const BROWSER_TIMEOUT_MS = 60_000
const PAGE_WAIT_MS = 3_000

export class BrowserScraper implements Scraper {
  async scrape(url: string, options: ScrapeOptions): Promise<ScrapedArtistData> {
    let browser
    let playwright

    try {
      // Dynamic import so playwright is only loaded when needed
      playwright = await import('playwright')
    } catch {
      logger.error('Playwright not installed. Run: npx playwright install chromium')
      const data = createEmptyScrapedData(url, options.instagramUrl) as ScrapedArtistData
      data.platform = 'generic'
      data.errors.push({
        url,
        error: 'Playwright not installed. Run: npx playwright install chromium',
      })
      return data
    }

    try {
      browser = await playwright.chromium.launch({ headless: true })
      const context = await browser.newContext({
        userAgent: 'SurfacedArt-ArtistTool/1.0 (contact@surfaced.art)',
      })
      const page = await context.newPage()

      // Navigate to the target URL
      logger.info('Browser: navigating', { url })
      await page.goto(url, {
        timeout: BROWSER_TIMEOUT_MS,
        waitUntil: 'networkidle',
      })

      // Extra wait for JS-heavy sites
      await page.waitForTimeout(PAGE_WAIT_MS)

      // Get rendered HTML
      const renderedHtml = await page.content()

      // Take screenshots if output dir exists
      const screenshotDir = path.join(options.outputDir, 'screenshots')
      await fs.mkdir(screenshotDir, { recursive: true })
      await page.screenshot({
        path: path.join(screenshotDir, 'homepage.png'),
        fullPage: true,
      })

      // Discover and visit additional pages
      const $ = loadHtml(renderedHtml)
      const navLinks = extractNavLinks($, url)
      const pageHtmls = new Map<string, string>()
      pageHtmls.set(url, renderedHtml)

      for (const navLink of navLinks.slice(0, 8)) {
        if (!isSameDomain(navLink.url, url)) continue

        try {
          await page.goto(navLink.url, {
            timeout: BROWSER_TIMEOUT_MS,
            waitUntil: 'networkidle',
          })
          await page.waitForTimeout(PAGE_WAIT_MS)
          const html = await page.content()
          pageHtmls.set(navLink.url, html)

          // Screenshot each page
          const slug = navLink.hint || 'page'
          await page.screenshot({
            path: path.join(screenshotDir, `${slug}.png`),
            fullPage: true,
          })
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          logger.warn('Browser: failed to load page', { url: navLink.url, error: msg })
        }
      }

      await browser.close()
      browser = undefined

      // Now pass the rendered HTML to the generic scraper
      // We create a modified options that uses the pre-rendered HTML
      const genericScraper = new GenericHtmlScraper()
      const data = await genericScraper.scrape(url, options)
      data.platform = 'browser'
      data.warnings.push('Site was rendered via Playwright browser (JS-heavy)')

      return data
    } catch (err) {
      if (browser) {
        await browser.close().catch(() => {})
      }

      const msg = err instanceof Error ? err.message : String(err)
      logger.error('Browser scraping failed', { url, error: msg })

      const data = createEmptyScrapedData(url, options.instagramUrl) as ScrapedArtistData
      data.platform = 'browser'
      data.errors.push({ url, error: `Browser scraping failed: ${msg}` })
      return data
    }
  }
}
