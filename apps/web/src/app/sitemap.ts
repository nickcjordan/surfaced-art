import type { MetadataRoute } from 'next'
import { getListings, getFeaturedArtists } from '@/lib/api'
import { CATEGORIES } from '@/lib/categories'

const BASE_URL = 'https://surfaced.art'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...CATEGORIES.map((cat) => ({
      url: `${BASE_URL}/category/${cat.slug}`,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
  ]

  // Dynamic pages from API
  let artistPages: MetadataRoute.Sitemap = []
  let listingPages: MetadataRoute.Sitemap = []

  try {
    const [artists, listingsResponse] = await Promise.all([
      getFeaturedArtists({ limit: 50 }),
      getListings({ status: 'available', limit: 200 }),
    ])

    artistPages = artists.map((artist) => ({
      url: `${BASE_URL}/artist/${artist.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    listingPages = listingsResponse.data.map((listing) => ({
      url: `${BASE_URL}/listing/${listing.id}`,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))
  } catch {
    // If API is unavailable, return only static pages
  }

  return [...staticPages, ...artistPages, ...listingPages]
}
