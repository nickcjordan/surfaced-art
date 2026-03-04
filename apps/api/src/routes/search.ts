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
    const [listingsResult, artistsResult] = await Promise.all([
      prisma.$queryRaw`
        SELECT
          l.id,
          l.title,
          l.medium,
          l.category,
          l.price,
          l.status,
          (SELECT url FROM listing_images li WHERE li.listing_id = l.id ORDER BY li.sort_order ASC LIMIT 1) AS "primaryImageUrl",
          ap.display_name AS "artistName",
          ap.slug AS "artistSlug",
          ts_rank(l.search_vector, plainto_tsquery('english', ${q})) AS rank,
          COUNT(*) OVER() AS "totalCount"
        FROM listings l
        JOIN artist_profiles ap ON l.artist_id = ap.id
        WHERE l.search_vector @@ plainto_tsquery('english', ${q})
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
          ts_rank(ap.search_vector, plainto_tsquery('english', ${q})) AS rank,
          COUNT(*) OVER() AS "totalCount"
        FROM artist_profiles ap
        WHERE ap.search_vector @@ plainto_tsquery('english', ${q})
          AND ap.status = 'approved'
        ORDER BY rank DESC, ap.created_at DESC
        LIMIT 8
      ` as Promise<RawArtistRow[]>,
    ])

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
