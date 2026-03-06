/**
 * Etsy category browser orchestrator.
 *
 * Searches Etsy's API for handmade sellers in a specific category,
 * filters by price and quality signals, and outputs structured results.
 */

import type { HttpClient } from '../shared/http-client.js'
import type { ArtistLead, EtsyShop, OutputFormat } from '../shared/types.js'
import { NotionPipeline } from '../shared/notion-pipeline.js'
import { formatOutput } from '../shared/output-formatter.js'
import {
  getTaxonomyIds,
  parseEtsyListing,
  parseEtsyShop,
  groupListingsByShop,
  isLikelyArtist,
} from './etsy-lib.js'

const ETSY_API_BASE = 'https://openapi.etsy.com/v3/application'

/** Redact x-api-key query param from error messages to avoid logging secrets */
function redactApiKey(message: string): string {
  return message.replace(/x-api-key=[^&\s]+/gi, 'x-api-key=REDACTED')
}

export interface BrowserOptions {
  category: string
  minPriceCents: number
  maxPriceCents: number
  limit: number
  pushToNotion: boolean
  dryRun: boolean
  outputFormat: OutputFormat
  verbose: boolean
  apiKey: string
}

export interface BrowserResult {
  shops: EtsyShop[]
  totalListingsFound: number
  shopsFiltered: number
  notionCreated: number
  notionSkipped: number
  notionFailed: number
}

export async function runBrowser(
  httpClient: HttpClient,
  options: BrowserOptions,
  pipeline?: NotionPipeline
): Promise<BrowserResult> {
  const taxonomyIds = getTaxonomyIds(options.category)
  if (!taxonomyIds) {
    throw new Error(
      `Unknown category: ${options.category}. Available: ceramics, painting, print, jewelry, illustration, photography, woodworking, fibers, mixed media`
    )
  }

  // 1. Search listings across all taxonomy IDs
  const allListings: Array<{
    shopId: number
    title: string
    priceCents: number
  }> = []

  for (const taxonomyId of taxonomyIds) {
    if (options.verbose) {
      console.warn(`Searching Etsy taxonomy ${taxonomyId}...`)
    }

    let offset = 0
    const perPage = 25
    let hasMore = true

    while (hasMore && allListings.length < options.limit * 3) {
      const params = new URLSearchParams({
        taxonomy_id: String(taxonomyId),
        min_price: String(options.minPriceCents / 100),
        max_price: String(options.maxPriceCents / 100),
        sort_on: 'score',
        limit: String(perPage),
        offset: String(offset),
      })

      const url = `${ETSY_API_BASE}/listings/active?${params.toString()}`

      try {
        const result = await httpClient.get(
          url + `&x-api-key=${options.apiKey}`
        )

        if (!result.ok) {
          if (result.status === 401 || result.status === 403) {
            throw new Error(
              'Etsy API key is invalid or expired. Register at https://developers.etsy.com/'
            )
          }
          if (result.status === 429) {
            console.warn('  Rate limited by Etsy, pausing...')
            break
          }
          console.warn(`  Etsy API returned HTTP ${result.status}`)
          break
        }

        const json = JSON.parse(result.body) as {
          results?: unknown[]
          count?: number
        }
        const results = json.results ?? []

        for (const raw of results) {
          const listing = parseEtsyListing(raw)
          if (listing) allListings.push(listing)
        }

        hasMore = results.length === perPage
        offset += perPage

        if (options.verbose) {
          console.warn(
            `  Fetched ${results.length} listings (total: ${allListings.length})`
          )
        }
      } catch (err) {
        if (
          err instanceof Error &&
          err.message.includes('Etsy API key')
        ) {
          throw err
        }
        const message = err instanceof Error ? err.message : String(err)
        console.warn(`  Error fetching listings: ${redactApiKey(message)}`)
        break
      }
    }
  }

  if (options.verbose) {
    console.warn(
      `Found ${allListings.length} listings total, grouping by shop...`
    )
  }

  // 2. Group listings by shop
  const shopGroups = groupListingsByShop(allListings)

  // 3. Fetch shop details for unique shops (up to limit)
  const shopIds = Array.from(shopGroups.keys()).slice(0, options.limit)
  const shops: EtsyShop[] = []

  for (const shopId of shopIds) {
    try {
      const url = `${ETSY_API_BASE}/shops/${shopId}?x-api-key=${options.apiKey}`
      const result = await httpClient.get(url)

      if (!result.ok) {
        if (options.verbose) {
          console.warn(`  Could not fetch shop ${shopId}: HTTP ${result.status}`)
        }
        continue
      }

      const shopData = parseEtsyShop(JSON.parse(result.body))
      if (!shopData) continue

      // Merge listing data into shop
      const group = shopGroups.get(shopId)!
      shopData.listingTitles = group.titles
      shopData.priceRangeCents = {
        min: group.minPrice,
        max: group.maxPrice,
      }

      shops.push(shopData)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (options.verbose) {
        console.warn(`  Error fetching shop ${shopId}: ${redactApiKey(message)}`)
      }
    }
  }

  // 4. Filter to likely artists
  const artistShops = shops.filter(isLikelyArtist)
  const shopsFiltered = shops.length - artistShops.length

  if (options.verbose) {
    console.warn(
      `${artistShops.length} shops pass artist heuristic (${shopsFiltered} filtered out)`
    )
  }

  // 5. Optionally push to Notion
  let notionCreated = 0
  let notionSkipped = 0
  let notionFailed = 0

  if (options.pushToNotion && pipeline) {
    for (const shop of artistShops) {
      const lead: ArtistLead = {
        name: shop.shopOwner,
        category: options.category.charAt(0).toUpperCase() + options.category.slice(1),
        website: shop.website,
        instagram: shop.instagram,
        source: 'etsy',
        sourceDetail: `Etsy: ${shop.shopName}`,
        notes: `Etsy shop: ${shop.shopUrl} | ${shop.numFavorers} favorites | Price: $${(shop.priceRangeCents.min / 100).toFixed(0)}-$${(shop.priceRangeCents.max / 100).toFixed(0)}`,
      }

      try {
        const existing = await pipeline.findByName(lead.name)
        if (existing) {
          if (options.verbose) console.warn(`  Skip (exists): ${lead.name}`)
          notionSkipped++
          continue
        }

        if (options.dryRun) {
          console.log(`  Would create: ${lead.name}`)
          notionSkipped++
          continue
        }

        await pipeline.createEntry(lead)
        if (options.verbose) console.warn(`  Created: ${lead.name}`)
        notionCreated++
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`  Failed to create ${lead.name}: ${message}`)
        notionFailed++
      }
    }
  }

  return {
    shops: artistShops,
    totalListingsFound: allListings.length,
    shopsFiltered,
    notionCreated,
    notionSkipped,
    notionFailed,
  }
}

/**
 * Format browser results for console output.
 */
export function formatBrowserResults(
  result: BrowserResult,
  outputFormat: OutputFormat
): string {
  if (result.shops.length === 0) {
    return 'No matching shops found.'
  }

  const data = result.shops.map((shop) => ({
    name: shop.shopOwner,
    shop: shop.shopName,
    favorites: shop.numFavorers,
    priceRange: `$${(shop.priceRangeCents.min / 100).toFixed(0)}-$${(shop.priceRangeCents.max / 100).toFixed(0)}`,
    instagram: shop.instagram ?? '-',
    website: shop.website ?? '-',
    url: shop.shopUrl,
  }))

  return formatOutput(
    data,
    [
      { key: 'name', header: 'Owner', width: 20 },
      { key: 'shop', header: 'Shop', width: 25 },
      { key: 'favorites', header: 'Favs', width: 6 },
      { key: 'priceRange', header: 'Price Range', width: 14 },
      { key: 'instagram', header: 'Instagram', width: 30 },
      { key: 'website', header: 'Website', width: 30 },
    ],
    outputFormat
  )
}
