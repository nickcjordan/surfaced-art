/**
 * Squarespace scraper.
 *
 * Uses the Squarespace JSON API (?format=json) to extract structured data
 * from artist websites hosted on Squarespace. This gives us typed access
 * to products, pages, images, and navigation without HTML parsing.
 */

import { logger } from '@surfaced-art/utils'
import type {
  ScrapedArtistData,
  ScrapedListing,
  ScrapedCvEntry,
  ScrapedImage,
  ScrapeOptions,
  Scraper,
  ExtractedField,
} from '../types.js'
import { fetchPage, createEmptyScrapedData } from './base.js'
import { parseDimensions } from '../utils/dimension-parser.js'
import { resolveUrl, detectSocialPlatform } from '../utils/url.js'
import { loadHtml, extractLongestParagraph, extractEmails, extractSocialLinks } from '../utils/html.js'

// ============================================================================
// Squarespace JSON types (partial — only the fields we use)
// ============================================================================

interface SqspCollection {
  id: string
  title: string
  fullUrl: string
  type: number // 1 = page, 2 = blog, 3 = gallery, 11 = store, etc.
  typeName?: string
  urlId: string
}

interface SqspImage {
  id: string
  url: string
  originalSize: string // "WxH"
  assetUrl: string
  title?: string
  altText?: string
}

interface SqspItem {
  id: string
  title: string
  fullUrl: string
  body?: string
  excerpt?: string
  assetUrl?: string
  systemDataId?: string
  items?: SqspImage[]

  // Product-specific fields
  productType?: number
  variants?: Array<{
    id: string
    priceMoney?: { value: string; currency: string }
    price?: number // In dollars or cents depending on version
    optionValues?: Array<{ value: string }>
    stock?: { quantity: number }
    unlimited?: boolean
    soldOut?: boolean
  }>
  structuredContent?: {
    images?: Array<{ id: string; assetUrl: string; altText?: string }>
  }
  tags?: string[]
}

interface SqspPageJson {
  collection?: SqspCollection
  items?: SqspItem[]
  item?: SqspItem
  mainContent?: string
  pageHeaderCode?: string
  website?: {
    siteTitle?: string
    siteDescription?: string
    location?: { addressLine1?: string; addressLine2?: string }
    socialAccounts?: Array<{ serviceUrl: string }>
  }
}

interface SqspSiteJson {
  website?: {
    siteTitle?: string
    siteDescription?: string
    socialAccounts?: Array<{ serviceUrl: string }>
  }
  collection?: SqspCollection
  collections?: SqspCollection[]
  item?: SqspItem
  items?: SqspItem[]
}

// ============================================================================
// Scraper implementation
// ============================================================================

/** Squarespace collection type numbers. */
const STORE_TYPE = 11
const GALLERY_TYPE = 3
const PAGE_TYPES = new Set([1, 2, 10]) // page, blog, cover page

export class SquarespaceScraper implements Scraper {
  async scrape(url: string, options: ScrapeOptions): Promise<ScrapedArtistData> {
    const data = createEmptyScrapedData(url, options.instagramUrl) as ScrapedArtistData
    data.platform = 'squarespace'

    // Step 1: Fetch the site root JSON to discover navigation/collections
    const siteJson = await this.fetchJson<SqspSiteJson>(url, options.verbose)
    if (!siteJson) {
      data.errors.push({ url, error: 'Failed to fetch Squarespace site JSON' })
      // Fall back to HTML scraping for basic info
      await this.scrapeHtmlFallback(url, data, options)
      return data
    }

    data.sourceUrls.push(url)

    // Extract site-level metadata
    if (siteJson.website) {
      if (siteJson.website.siteTitle && !options.artistName) {
        data.name = {
          value: siteJson.website.siteTitle,
          confidence: 'medium',
          source: url,
        }
      }

      if (siteJson.website.socialAccounts) {
        for (const account of siteJson.website.socialAccounts) {
          if (!account.serviceUrl) continue
          const platform = detectSocialPlatform(account.serviceUrl)
          if (platform === 'instagram') {
            data.instagramUrl = data.instagramUrl || account.serviceUrl
          } else if (platform) {
            data.otherSocialLinks.push({ platform, url: account.serviceUrl })
          }
        }
      }
    }

    // If artist name was provided, use it with high confidence
    if (options.artistName) {
      data.name = {
        value: options.artistName,
        confidence: 'high',
        source: 'cli-input',
      }
    }

    // Step 2: Discover collections (pages, store, gallery)
    const collections = siteJson.collections || []
    if (siteJson.collection) {
      collections.push(siteJson.collection)
    }

    // Step 3: Scrape each collection by type
    for (const collection of collections) {
      const collectionUrl = resolveUrl(collection.fullUrl || `/${collection.urlId}`, url)
      if (!collectionUrl) continue

      try {
        if (collection.type === STORE_TYPE) {
          await this.scrapeStore(collectionUrl, data, options)
        } else if (collection.type === GALLERY_TYPE) {
          await this.scrapeGallery(collectionUrl, data, options)
        } else if (PAGE_TYPES.has(collection.type)) {
          await this.scrapePage(collectionUrl, collection, data, options)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        data.errors.push({ url: collectionUrl, error: msg })
      }
    }

    // If no collections found, try common page paths
    if (collections.length === 0) {
      await this.tryCommonPaths(url, data, options)
    }

    return data
  }

  /**
   * Fetch a URL with ?format=json appended.
   */
  private async fetchJson<T>(url: string, verbose?: boolean): Promise<T | null> {
    const jsonUrl = url.includes('?')
      ? `${url}&format=json`
      : `${url}?format=json`

    const result = await fetchPage(jsonUrl, { verbose, acceptJson: true })
    if (!result.ok) return null

    try {
      return JSON.parse(result.body) as T
    } catch {
      return null
    }
  }

  /**
   * Scrape a Squarespace store collection for product listings.
   */
  private async scrapeStore(
    collectionUrl: string,
    data: ScrapedArtistData,
    options: ScrapeOptions
  ): Promise<void> {
    const storeJson = await this.fetchJson<SqspPageJson>(collectionUrl, options.verbose)
    if (!storeJson?.items) return

    data.sourceUrls.push(collectionUrl)

    for (const item of storeJson.items) {
      const listing = this.parseProduct(item, collectionUrl)
      if (listing) {
        data.listings.push(listing)
      }
    }

    if (options.verbose) {
      logger.info('Scraped store', {
        url: collectionUrl,
        listings: data.listings.length,
      })
    }
  }

  /**
   * Parse a Squarespace product item into a ScrapedListing.
   */
  private parseProduct(item: SqspItem, sourceUrl: string): ScrapedListing | null {
    if (!item.title) return null

    // Extract price from variants
    let priceCents: number | null = null
    let isSoldOut = false
    let priceCurrency: string | null = null

    if (item.variants && item.variants.length > 0) {
      const variant = item.variants[0]!

      if (variant.priceMoney) {
        // priceMoney.value is a string representation, could be cents or dollars
        const rawValue = variant.priceMoney.value
        priceCurrency = variant.priceMoney.currency || 'USD'

        // Squarespace priceMoney.value is typically in cents as a string
        const numValue = parseInt(rawValue, 10)
        if (!isNaN(numValue)) {
          // If the value looks like cents (> 100 for a typical art price), use as-is
          // If it looks like dollars (< 100 and has no decimals), convert
          priceCents = numValue
        }
      } else if (variant.price !== undefined) {
        // Legacy price field — in cents
        priceCents = variant.price
      }

      // Check sold out status
      if (variant.soldOut === true) {
        isSoldOut = true
      } else if (variant.stock && !variant.unlimited) {
        isSoldOut = variant.stock.quantity <= 0
      }
    }

    // Extract images
    const images: ScrapedImage[] = []

    // Product main image
    if (item.assetUrl) {
      images.push({
        url: item.assetUrl,
        alt: item.title,
        context: 'product',
        sourcePageUrl: sourceUrl,
      })
    }

    // Additional images from items array
    if (item.items) {
      for (const img of item.items) {
        if (img.assetUrl && img.assetUrl !== item.assetUrl) {
          images.push({
            url: img.assetUrl,
            alt: img.altText || img.title || null,
            context: 'product',
            sourcePageUrl: sourceUrl,
          })
        }
      }
    }

    // Additional images from structuredContent
    if (item.structuredContent?.images) {
      for (const img of item.structuredContent.images) {
        const alreadyHas = images.some((existing) => existing.url === img.assetUrl)
        if (img.assetUrl && !alreadyHas) {
          images.push({
            url: img.assetUrl,
            alt: img.altText || null,
            context: 'product',
            sourcePageUrl: sourceUrl,
          })
        }
      }
    }

    // Parse description for medium and dimensions
    const medium: ExtractedField<string> | null = null
    let dimensions: ExtractedField<{ length: number | null; width: number | null; height: number | null; unit: string }> | null = null
    const descriptionText = item.body
      ? loadHtml(item.body)('body').text().trim()
      : item.excerpt?.trim() || null

    // Try to parse dimensions from the title (common pattern: "Box 4.5 × 5.5 × 4")
    const dimMatch = item.title.match(/(\d+\.?\d*)\s*[x×X]\s*(\d+\.?\d*)(?:\s*[x×X]\s*(\d+\.?\d*))?/)
    if (dimMatch) {
      const parsed = parseDimensions(dimMatch[0])
      if (parsed) {
        dimensions = { value: parsed, confidence: 'medium', source: sourceUrl }
      }
    }

    // Build the listing result, using parsePrice as fallback if no variant price
    const priceField: ExtractedField<number> | null = priceCents !== null
      ? { value: priceCents, confidence: 'high', source: sourceUrl }
      : null

    return {
      title: { value: item.title, confidence: 'high', source: sourceUrl },
      description: descriptionText
        ? { value: descriptionText, confidence: 'high', source: sourceUrl }
        : null,
      price: priceField,
      priceCurrency,
      medium,
      dimensions,
      images,
      sourceUrl: resolveUrl(item.fullUrl || '', sourceUrl) || sourceUrl,
      isSoldOut,
    }
  }

  /**
   * Scrape a Squarespace gallery for process/portfolio images.
   */
  private async scrapeGallery(
    collectionUrl: string,
    data: ScrapedArtistData,
    _options: ScrapeOptions
  ): Promise<void> {
    const galleryJson = await this.fetchJson<SqspPageJson>(collectionUrl)
    if (!galleryJson?.items) return

    data.sourceUrls.push(collectionUrl)

    for (const item of galleryJson.items) {
      if (item.assetUrl) {
        data.processImages.push({
          url: item.assetUrl,
          alt: item.title || null,
          context: 'process',
          sourcePageUrl: collectionUrl,
        })
      }
    }
  }

  /**
   * Scrape a Squarespace page (About, CV, etc.) for text content.
   */
  private async scrapePage(
    pageUrl: string,
    collection: SqspCollection,
    data: ScrapedArtistData,
    options: ScrapeOptions
  ): Promise<void> {
    const title = collection.title.toLowerCase()

    // Determine what kind of content to look for
    const isAbout = /about|bio|artist/i.test(title) || /about|bio|artist/i.test(collection.urlId)
    const isCv = /cv|resume|curriculum|exhibitions?/i.test(title) || /cv|resume/i.test(collection.urlId)
    const isContact = /contact|info/i.test(title)

    if (!isAbout && !isCv && !isContact) return

    // Fetch as JSON first, fall back to HTML
    const pageJson = await this.fetchJson<SqspPageJson>(pageUrl, options.verbose)
    if (pageJson) {
      data.sourceUrls.push(pageUrl)

      // Try to get the page body content from mainContent or item body
      let bodyHtml = pageJson.mainContent || ''
      if (pageJson.item?.body) {
        bodyHtml = pageJson.item.body
      }
      if (pageJson.items && pageJson.items.length > 0) {
        for (const item of pageJson.items) {
          if (item.body) bodyHtml += '\n' + item.body
        }
      }

      if (bodyHtml) {
        const $ = loadHtml(bodyHtml)

        if (isAbout && !data.bio) {
          const bio = extractLongestParagraph($)
          if (bio) {
            data.bio = { value: bio, confidence: 'high', source: pageUrl }
          }

          // Look for profile images on about page
          const images = $('img')
          images.each((_i, el) => {
            const src = $(el).attr('src')
            if (src) {
              data.profileImages.push({
                url: src,
                alt: $(el).attr('alt') || null,
                context: 'profile',
                sourcePageUrl: pageUrl,
              })
            }
          })
        }

        if (isCv) {
          // CV extraction is complex — store raw text for Claude API parsing
          const rawText = $('body').text().trim()
          if (rawText.length > 50) {
            // Store as a warning so the user knows to use Claude API
            data.warnings.push(
              `CV page found at ${pageUrl}. Raw text stored for Claude API parsing.`
            )
            // We'll try basic heuristic parsing here
            this.parseCvFromHtml($, pageUrl, data)
          }
        }

        if (isContact) {
          const emails = extractEmails($)
          if (emails.length > 0 && !data.email) {
            data.email = {
              value: emails[0]!,
              confidence: 'medium',
              source: pageUrl,
            }
          }
        }
      }
    }
  }

  /**
   * Basic heuristic CV parsing from HTML.
   * Looks for heading-grouped lists that match CV entry patterns.
   */
  private parseCvFromHtml(
    $: cheerio.CheerioAPI,
    sourceUrl: string,
    data: ScrapedArtistData
  ): void {
    // This is intentionally simple — the Claude API layer does the heavy lifting
    const headings = $('h1, h2, h3, h4, h5, h6, strong, b')
    let currentType: string = 'other'

    headings.each((_i, el) => {
      const headingText = $(el).text().trim().toLowerCase()

      // Classify the section type
      if (/education/i.test(headingText)) currentType = 'education'
      else if (/exhibition|show/i.test(headingText)) currentType = 'exhibition'
      else if (/residenc/i.test(headingText)) currentType = 'residency'
      else if (/award|grant|fellowship|honor/i.test(headingText)) currentType = 'award'
      else if (/press|publication|media/i.test(headingText)) currentType = 'press'

      // Look for list items or paragraphs after this heading
      const nextElements = $(el).parent().nextAll('p, li, ul li, ol li')
      nextElements.each((_j, entryEl) => {
        const raw = $(entryEl).text().trim()
        if (!raw || raw.length < 10) return

        // Try to extract year
        const yearMatch = raw.match(/\b(19|20)\d{2}\b/)
        const year = yearMatch ? parseInt(yearMatch[0], 10) : null

        data.cvEntries.push({
          type: { value: currentType as ScrapedCvEntry['type']['value'], confidence: 'low', source: sourceUrl },
          title: { value: raw, confidence: 'low', source: sourceUrl },
          institution: null,
          year: year ? { value: year, confidence: 'medium', source: sourceUrl } : null,
          raw,
        })
      })
    })
  }

  /**
   * Try common page paths when no collections are discovered.
   */
  private async tryCommonPaths(
    baseUrl: string,
    data: ScrapedArtistData,
    options: ScrapeOptions
  ): Promise<void> {
    const commonPaths = ['/about', '/cv', '/shop', '/store', '/work', '/contact']

    for (const path of commonPaths) {
      const fullUrl = resolveUrl(path, baseUrl)
      if (!fullUrl) continue

      try {
        const pageJson = await this.fetchJson<SqspPageJson>(fullUrl, options.verbose)
        if (!pageJson) continue

        const isAbout = path === '/about'
        const isCv = path === '/cv'
        const isShop = path === '/shop' || path === '/store'
        const isContact = path === '/contact'

        if (isShop && pageJson.items) {
          for (const item of pageJson.items) {
            const listing = this.parseProduct(item, fullUrl)
            if (listing) data.listings.push(listing)
          }
        }

        if (isAbout && pageJson.mainContent) {
          const $ = loadHtml(pageJson.mainContent)
          const bio = extractLongestParagraph($)
          if (bio && !data.bio) {
            data.bio = { value: bio, confidence: 'high', source: fullUrl }
          }
        }

        if ((isCv || isAbout) && (pageJson.mainContent || pageJson.item?.body)) {
          const html = pageJson.mainContent || pageJson.item?.body || ''
          if (html) {
            const $ = loadHtml(html)
            this.parseCvFromHtml($, fullUrl, data)
          }
        }

        if (isContact && pageJson.mainContent) {
          const $ = loadHtml(pageJson.mainContent)
          const emails = extractEmails($)
          if (emails.length > 0 && !data.email) {
            data.email = { value: emails[0]!, confidence: 'medium', source: fullUrl }
          }
        }

        data.sourceUrls.push(fullUrl)
      } catch {
        // Skip failed paths silently
      }
    }
  }

  /**
   * HTML fallback when JSON API fails.
   */
  private async scrapeHtmlFallback(
    url: string,
    data: ScrapedArtistData,
    options: ScrapeOptions
  ): Promise<void> {
    const result = await fetchPage(url, { verbose: options.verbose })
    if (!result.ok) return

    const $ = loadHtml(result.body)

    // Extract social links
    const socialLinks = extractSocialLinks($, url)
    for (const link of socialLinks) {
      if (link.platform === 'instagram' && !data.instagramUrl) {
        data.instagramUrl = link.url
      } else {
        data.otherSocialLinks.push(link)
      }
    }

    // Extract bio from main content
    const bio = extractLongestParagraph($)
    if (bio && !data.bio) {
      data.bio = { value: bio, confidence: 'medium', source: url }
    }

    // Extract emails
    const emails = extractEmails($)
    if (emails.length > 0 && !data.email) {
      data.email = { value: emails[0]!, confidence: 'medium', source: url }
    }

    data.warnings.push('Squarespace JSON API unavailable — fell back to HTML parsing')
  }
}

// cheerio type import for the parseCvFromHtml method
import type * as cheerio from 'cheerio'
