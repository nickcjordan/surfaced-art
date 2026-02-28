/**
 * Generic HTML scraper (cheerio-based).
 *
 * Fallback for artist websites on unknown platforms. Crawls the site
 * navigation, visits key pages (About, Shop, CV), and extracts
 * structured data using HTML patterns and heuristics.
 */

import type {
  ScrapedArtistData,
  ScrapedListing,
  ScrapedImage,
  ScrapeOptions,
  Scraper,
  ExtractedField,
} from '../types.js'
import { fetchPage, createEmptyScrapedData, isAllowedByRobots, fetchRobotsTxt } from './base.js'
import { parsePrice } from '../utils/price-parser.js'
import { resolveUrl, isSameDomain } from '../utils/url.js'
import {
  loadHtml,
  extractNavLinks,
  extractImages,
  extractSocialLinks,
  extractLongestParagraph,
  extractEmails,
} from '../utils/html.js'

export class GenericHtmlScraper implements Scraper {
  async scrape(url: string, options: ScrapeOptions): Promise<ScrapedArtistData> {
    const data = createEmptyScrapedData(url, options.instagramUrl) as ScrapedArtistData
    data.platform = 'generic'

    if (options.artistName) {
      data.name = { value: options.artistName, confidence: 'high', source: 'cli-input' }
    }

    // Fetch robots.txt
    const disallowPaths = await fetchRobotsTxt(url)

    // Fetch the homepage
    const homeResult = await fetchPage(url, { verbose: options.verbose })
    if (!homeResult.ok) {
      data.errors.push({ url, error: `HTTP ${homeResult.status}` })
      return data
    }

    data.sourceUrls.push(homeResult.url)
    const $ = loadHtml(homeResult.body)

    // Extract social links from homepage
    const socialLinks = extractSocialLinks($, url)
    for (const link of socialLinks) {
      if (link.platform === 'instagram' && !data.instagramUrl) {
        data.instagramUrl = link.url
      } else {
        data.otherSocialLinks.push(link)
      }
    }

    // Extract site title as name fallback
    if (!data.name) {
      const title = $('title').text().trim()
      if (title && title.length < 60) {
        data.name = { value: title, confidence: 'low', source: url }
      }
    }

    // Extract emails from homepage
    const emails = extractEmails($)
    if (emails.length > 0) {
      data.email = { value: emails[0]!, confidence: 'medium', source: url }
    }

    // Discover navigation links
    const navLinks = extractNavLinks($, url)

    // Collect cover image candidates from homepage
    const homeImages = extractImages($, url, 'cover')
    data.coverImages.push(...homeImages.slice(0, 5)) // Top 5 images

    // Visit each discovered page
    for (const navLink of navLinks) {
      if (!isSameDomain(navLink.url, url)) continue
      if (!isAllowedByRobots(navLink.url, disallowPaths)) {
        data.warnings.push(`Skipped ${navLink.url} (blocked by robots.txt)`)
        continue
      }

      try {
        await this.scrapePage(navLink, data, options, disallowPaths)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        data.errors.push({ url: navLink.url, error: msg })
      }
    }

    return data
  }

  /**
   * Scrape a discovered page based on its classification hint.
   */
  private async scrapePage(
    navLink: { url: string; hint: string },
    data: ScrapedArtistData,
    options: ScrapeOptions,
    disallowPaths: string[]
  ): Promise<void> {
    const result = await fetchPage(navLink.url, { verbose: options.verbose })
    if (!result.ok) return

    data.sourceUrls.push(result.url)
    const $ = loadHtml(result.body)

    switch (navLink.hint) {
      case 'about':
        this.scrapeAboutPage($, result.url, data)
        break
      case 'cv':
      case 'exhibitions':
        this.scrapeCvPage($, result.url, data)
        break
      case 'shop':
        this.scrapeShopPage($, result.url, data, options, disallowPaths)
        break
      case 'work':
        this.scrapeWorkPage($, result.url, data)
        break
      case 'process':
        this.scrapeProcessPage($, result.url, data)
        break
      case 'contact':
        this.scrapeContactPage($, result.url, data)
        break
      case 'press':
        this.scrapePressPage($, result.url, data)
        break
    }
  }

  private scrapeAboutPage(
    $: ReturnType<typeof loadHtml>,
    pageUrl: string,
    data: ScrapedArtistData
  ): void {
    // Bio extraction
    const bio = extractLongestParagraph($)
    if (bio && !data.bio) {
      data.bio = { value: bio, confidence: 'medium', source: pageUrl }
    }

    // Also try to find the artist statement (second longest paragraph)
    const paragraphs: string[] = []
    $('p').each((_i, el) => {
      const text = $(el).text().trim()
      if (text.length >= 50) paragraphs.push(text)
    })
    paragraphs.sort((a, b) => b.length - a.length)
    if (paragraphs.length >= 2 && !data.artistStatement) {
      data.artistStatement = { value: paragraphs[1]!, confidence: 'low', source: pageUrl }
    }

    // Profile image candidates
    const images = extractImages($, pageUrl, 'profile')
    data.profileImages.push(...images.slice(0, 3))

    // Emails
    const emails = extractEmails($)
    if (emails.length > 0 && !data.email) {
      data.email = { value: emails[0]!, confidence: 'medium', source: pageUrl }
    }

    // Location (look for common patterns)
    const bodyText = $('body').text()
    const locationMatch = bodyText.match(
      /(?:based in|located in|lives? in|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2})/i
    )
    if (locationMatch?.[1] && !data.location) {
      data.location = { value: locationMatch[1], confidence: 'low', source: pageUrl }
    }
  }

  private scrapeCvPage(
    $: ReturnType<typeof loadHtml>,
    pageUrl: string,
    data: ScrapedArtistData
  ): void {
    // Store raw CV text for Claude API processing
    const rawText = $('body').text().trim()
    if (rawText.length > 50) {
      data.warnings.push(
        `CV page found at ${pageUrl} with ${rawText.length} chars. Use Claude API for structured extraction.`
      )
    }

    // Basic heuristic: look for year patterns in list items
    const listItems = $('li, p')
    listItems.each((_i, el) => {
      const text = $(el).text().trim()
      if (!text || text.length < 10) return

      const yearMatch = text.match(/\b(19|20)\d{2}\b/)
      if (!yearMatch) return

      data.cvEntries.push({
        type: { value: 'other', confidence: 'low', source: pageUrl },
        title: { value: text, confidence: 'low', source: pageUrl },
        institution: null,
        year: { value: parseInt(yearMatch[0], 10), confidence: 'medium', source: pageUrl },
        raw: text,
      })
    })
  }

  private scrapeShopPage(
    $: ReturnType<typeof loadHtml>,
    pageUrl: string,
    data: ScrapedArtistData,
    _options: ScrapeOptions,
    disallowPaths: string[]
  ): void {
    // Look for product-like elements (cards with image + title + price)
    // Common patterns: .product, .product-card, .grid-item, article with img
    const productSelectors = [
      '.product',
      '.product-card',
      '.product-item',
      '.grid-item',
      '[class*="product"]',
      'article',
    ]

    const seenTitles = new Set<string>()

    for (const selector of productSelectors) {
      $(selector).each((_i, el) => {
        const $el = $(el)
        const listing = this.parseProductCard($, $el, pageUrl)
        if (listing && !seenTitles.has(listing.title.value)) {
          seenTitles.add(listing.title.value)
          data.listings.push(listing)
        }
      })

      // If we found products with this selector, stop trying others
      if (data.listings.length > 0) break
    }

    // Also try to find individual product links for deeper scraping
    if (data.listings.length === 0) {
      // Look for links that could be product pages
      $('a').each((_i, el) => {
        const href = $(el).attr('href')
        if (!href) return
        const resolved = resolveUrl(href, pageUrl)
        if (!resolved || !isSameDomain(resolved, pageUrl)) return
        if (!isAllowedByRobots(resolved, disallowPaths)) return

        // Heuristic: links with images that aren't navigation
        const hasImage = $(el).find('img').length > 0
        const text = $(el).text().trim()
        if (hasImage && text && text.length > 3 && text.length < 100) {
          // Found a potential product link — add it as a basic listing
          const price = this.findNearbyPrice($, el)
          const imgSrc = $(el).find('img').first().attr('src')
          const images: ScrapedImage[] = []
          if (imgSrc) {
            const fullSrc = resolveUrl(imgSrc, pageUrl)
            if (fullSrc) {
              images.push({
                url: fullSrc,
                alt: text,
                context: 'product',
                sourcePageUrl: pageUrl,
              })
            }
          }

          if (!seenTitles.has(text)) {
            seenTitles.add(text)
            data.listings.push({
              title: { value: text, confidence: 'low', source: pageUrl },
              description: null,
              price,
              priceCurrency: null,
              medium: null,
              dimensions: null,
              images,
              sourceUrl: resolved,
              isSoldOut: false,
            })
          }
        }
      })
    }
  }

  /**
   * Parse a product card element into a ScrapedListing.
   */
  private parseProductCard(
    _$: ReturnType<typeof loadHtml>,
    $el: ReturnType<ReturnType<typeof loadHtml>>,
    pageUrl: string
  ): ScrapedListing | null {
    // Find title — common patterns
    const titleEl = $el.find('h1, h2, h3, h4, .product-title, .title, [class*="title"]').first()
    const title = titleEl.text().trim() || $el.find('a').first().text().trim()
    if (!title || title.length < 2) return null

    // Find price
    const priceEl = $el.find('.price, [class*="price"], .money, [class*="money"]').first()
    let price: ExtractedField<number> | null = null
    let isSoldOut = false

    if (priceEl.length) {
      const priceText = priceEl.text().trim()
      const parsed = parsePrice(priceText)
      if (parsed.cents !== null) {
        price = { value: parsed.cents, confidence: 'medium', source: pageUrl }
      }
      isSoldOut = parsed.isSoldOut
    }

    // Find image
    const images: ScrapedImage[] = []
    const imgEl = $el.find('img').first()
    if (imgEl.length) {
      const src = imgEl.attr('src') || imgEl.attr('data-src')
      if (src) {
        const fullSrc = resolveUrl(src, pageUrl)
        if (fullSrc) {
          images.push({
            url: fullSrc,
            alt: imgEl.attr('alt') || null,
            context: 'product',
            sourcePageUrl: pageUrl,
          })
        }
      }
    }

    // Find link
    const linkEl = $el.find('a').first()
    const href = linkEl.attr('href')
    const sourceUrl = href ? resolveUrl(href, pageUrl) || pageUrl : pageUrl

    return {
      title: { value: title, confidence: 'medium', source: pageUrl },
      description: null,
      price,
      priceCurrency: null,
      medium: null,
      dimensions: null,
      images,
      sourceUrl,
      isSoldOut,
    }
  }

  /**
   * Find a price element near a given element.
   */
  private findNearbyPrice(
    $: ReturnType<typeof loadHtml>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    el: any
  ): ExtractedField<number> | null {
    const parent = $(el).parent()
    const priceText = parent.find('.price, [class*="price"]').first().text().trim()
    if (priceText) {
      const parsed = parsePrice(priceText)
      if (parsed.cents !== null) {
        return { value: parsed.cents, confidence: 'low', source: '' }
      }
    }
    return null
  }

  private scrapeWorkPage(
    $: ReturnType<typeof loadHtml>,
    pageUrl: string,
    data: ScrapedArtistData
  ): void {
    // Work/portfolio pages — collect images as cover or process candidates
    const images = extractImages($, pageUrl, 'cover')
    data.coverImages.push(...images.slice(0, 10))
  }

  private scrapeProcessPage(
    $: ReturnType<typeof loadHtml>,
    pageUrl: string,
    data: ScrapedArtistData
  ): void {
    const images = extractImages($, pageUrl, 'process')
    data.processImages.push(...images)
  }

  private scrapeContactPage(
    $: ReturnType<typeof loadHtml>,
    pageUrl: string,
    data: ScrapedArtistData
  ): void {
    const emails = extractEmails($)
    if (emails.length > 0 && !data.email) {
      data.email = { value: emails[0]!, confidence: 'high', source: pageUrl }
    }

    // Also look for location
    const bodyText = $('body').text()
    const locationMatch = bodyText.match(
      /(?:based in|located in|lives? in|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2})/i
    )
    if (locationMatch?.[1] && !data.location) {
      data.location = { value: locationMatch[1], confidence: 'medium', source: pageUrl }
    }
  }

  private scrapePressPage(
    $: ReturnType<typeof loadHtml>,
    pageUrl: string,
    data: ScrapedArtistData
  ): void {
    // Press pages — extract as CV entries of type 'press'
    $('li, article, .press-item, [class*="press"]').each((_i, el) => {
      const text = $(el).text().trim()
      if (!text || text.length < 10) return

      const yearMatch = text.match(/\b(19|20)\d{2}\b/)

      data.cvEntries.push({
        type: { value: 'press', confidence: 'medium', source: pageUrl },
        title: { value: text, confidence: 'low', source: pageUrl },
        institution: null,
        year: yearMatch ? { value: parseInt(yearMatch[0], 10), confidence: 'medium', source: pageUrl } : null,
        raw: text,
      })
    })
  }
}

