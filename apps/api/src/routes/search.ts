import { Hono } from 'hono'
import type { PrismaClient } from '@surfaced-art/db'
import { searchQuery } from '@surfaced-art/types'
import type { SearchResponse, SearchListingItem, SearchArtistItem } from '@surfaced-art/types'
import { logger } from '@surfaced-art/utils'
import { validationError } from '../errors'

interface RawListingRow extends SearchListingItem {
  totalCount: bigint
}

interface RawArtistRow extends SearchArtistItem {
  totalCount: bigint
}

export function createSearchRoutes(prisma: PrismaClient) {
  const search = new Hono()

  search.get('/', async (c) => {
    const start = Date.now()

    const parsed = searchQuery.safeParse({
      q: c.req.query('q'),
      page: c.req.query('page'),
      limit: c.req.query('limit'),
    })

    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    const { q, page, limit } = parsed.data
    const offset = (page - 1) * limit

    // Two parallel queries: listings (paginated) and artists (top 8)
    // plainto_tsquery safely converts user input to AND-joined lexemes
    // Use Promise.allSettled so one query failure doesn't kill the other (SUR-295)
    const [listingsOutcome, artistsOutcome] = await Promise.allSettled([
      prisma.$queryRaw`
        SELECT
          l.id,
          l.title,
          l.medium,
          l.category,
          l.price,
          l.status,
          (SELECT url FROM listing_images li WHERE li.listing_id = l.id ORDER BY li.sort_order ASC LIMIT 1) AS "primaryImageUrl",
          (SELECT width FROM listing_images li WHERE li.listing_id = l.id ORDER BY li.sort_order ASC LIMIT 1) AS "primaryImageWidth",
          (SELECT height FROM listing_images li WHERE li.listing_id = l.id ORDER BY li.sort_order ASC LIMIT 1) AS "primaryImageHeight",
          ap.display_name AS "artistName",
          ap.slug AS "artistSlug",
          GREATEST(
            ts_rank(l.search_vector, plainto_tsquery('english', ${q})),
            ts_rank(ap.search_vector, plainto_tsquery('english', ${q}))
          ) AS rank,
          COUNT(*) OVER() AS "totalCount"
        FROM listings l
        JOIN artist_profiles ap ON l.artist_id = ap.id
        WHERE (l.search_vector @@ plainto_tsquery('english', ${q})
           OR ap.search_vector @@ plainto_tsquery('english', ${q}))
          AND l.status IN ('available', 'reserved_system')
          AND ap.status = 'approved'
        ORDER BY rank DESC, l.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as Promise<RawListingRow[]>,
      prisma.$queryRaw`
        SELECT
          ap.slug,
          ap.display_name AS "displayName",
          ap.location,
          ap.profile_image_url AS "profileImageUrl",
          ap.cover_image_url AS "coverImageUrl",
          ARRAY(
            SELECT ac.category FROM artist_categories ac WHERE ac.artist_id = ap.id
          ) AS categories,
          COALESCE(
            (SELECT ARRAY_AGG(sub.url ORDER BY sub.rn)
             FROM (
               SELECT url, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS rn
               FROM (
                 SELECT DISTINCT ON (l2.id) li.url, l2.created_at
                 FROM listings l2
                 JOIN listing_images li ON li.listing_id = l2.id AND li.is_process_photo = false
                 WHERE l2.artist_id = ap.id
                   AND l2.status IN ('available', 'reserved_system')
                 ORDER BY l2.id, li.sort_order ASC
               ) deduped
             ) sub
             WHERE sub.rn <= 4),
            '{}'::text[]
          ) AS "artworkImageUrls",
          ts_rank(ap.search_vector, plainto_tsquery('english', ${q})) AS rank,
          COUNT(*) OVER() AS "totalCount"
        FROM artist_profiles ap
        WHERE ap.search_vector @@ plainto_tsquery('english', ${q})
          AND ap.status = 'approved'
        ORDER BY rank DESC, ap.created_at DESC
        LIMIT 8
      ` as Promise<RawArtistRow[]>,
    ])

    // Extract results, falling back to empty on failure (SUR-295)
    const listingsResult = listingsOutcome.status === 'fulfilled'
      ? listingsOutcome.value
      : [] as RawListingRow[]
    const artistsResult = artistsOutcome.status === 'fulfilled'
      ? artistsOutcome.value
      : [] as RawArtistRow[]

    if (listingsOutcome.status === 'rejected') {
      logger.error('Listing search query failed', { query: q, error: String(listingsOutcome.reason) })
    }
    if (artistsOutcome.status === 'rejected') {
      logger.error('Artist search query failed', { query: q, error: String(artistsOutcome.reason) })
    }

    // Raw queries return BigInt for COUNT — convert to number
    const listingsTotal = listingsResult.length > 0 ? Number(listingsResult[0]!.totalCount) : 0
    const artistsTotal = artistsResult.length > 0 ? Number(artistsResult[0]!.totalCount) : 0

    const response: SearchResponse = {
      listings: {
        data: listingsResult.map(({ totalCount: _, ...row }) => ({
          ...row,
          price: Number(row.price),
          rank: Number(row.rank),
        })),
        total: listingsTotal,
      },
      artists: {
        data: artistsResult.map(({ totalCount: _, ...row }) => ({
          ...row,
          rank: Number(row.rank),
        })),
        total: artistsTotal,
      },
      query: q,
    }

    logger.info('Search executed', {
      query: q,
      listingsFound: listingsTotal,
      artistsFound: artistsTotal,
      page,
      limit,
      durationMs: Date.now() - start,
    })

    return c.json(response)
  })

  return search
}
