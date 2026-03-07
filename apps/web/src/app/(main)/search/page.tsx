import type { Metadata } from 'next'
import { searchArt, ApiError } from '@/lib/api'
import { SearchResultsView } from '@/components/SearchResultsView'
import { JsonLd } from '@/components/JsonLd'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { SITE_URL } from '@/lib/site-config'
import { EmptyState } from '@/components/EmptyState'
import type { CategoryListingItem } from '@/components/CategoryBrowseView'
import type { FeaturedArtistItem } from '@surfaced-art/types'

export const revalidate = 0

type Props = {
  searchParams: Promise<{ q?: string; page?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams
  const title = q ? `Search: ${q} — Surfaced Art` : 'Search — Surfaced Art'
  return {
    title,
    description: q
      ? `Search results for "${q}" on Surfaced Art.`
      : 'Search for handmade art and artists on Surfaced Art.',
    alternates: { canonical: '/search' },
    robots: { index: false },
    openGraph: {
      title,
      description: q
        ? `Search results for "${q}" on Surfaced Art.`
        : 'Search for handmade art and artists on Surfaced Art.',
      type: 'website',
      url: `${SITE_URL}/search`,
      images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
    },
    twitter: {
      images: ['/opengraph-image'],
    },
  }
}

export default async function SearchPage({ searchParams }: Props) {
  const { q, page: pageParam } = await searchParams

  // No query — show prompt state
  if (!q || !q.trim()) {
    return (
      <div className="space-y-8">
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'SearchResultsPage',
          name: 'Search — Surfaced Art',
          url: `${SITE_URL}/search`,
        }} />
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: 'Search' },
        ]} />
        <EmptyState
          data-testid="search-prompt"
          title="Search Surfaced Art"
          description="Enter a search term above to find art and artists."
        />
      </div>
    )
  }

  const page = pageParam ? parseInt(pageParam, 10) : 1

  let listings: CategoryListingItem[] = []
  let artists: FeaturedArtistItem[] = []
  let totalListingCount = 0
  let totalArtistCount = 0
  let hasError = false

  try {
    const result = await searchArt({ q, page })

    totalListingCount = result.listings.total
    totalArtistCount = result.artists.total

    listings = result.listings.data.map((item) => ({
      id: item.id,
      title: item.title,
      medium: item.medium,
      category: item.category,
      price: item.price,
      status: item.status,
      primaryImageUrl: item.primaryImageUrl,
      primaryImageWidth: item.primaryImageWidth,
      primaryImageHeight: item.primaryImageHeight,
      artistName: item.artistName,
    }))

    artists = result.artists.data.map((item) => ({
      slug: item.slug,
      displayName: item.displayName,
      location: item.location,
      profileImageUrl: item.profileImageUrl,
      coverImageUrl: item.coverImageUrl,
      categories: item.categories,
    }))
  } catch (error) {
    hasError = true
    if (error instanceof ApiError) {
      console.error(`API error searching: ${error.status} ${error.message}`)
    } else {
      console.error('Unexpected error searching:', error)
    }
  }

  return (
    <div className="space-y-8">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'SearchResultsPage',
        name: `Search: ${q} — Surfaced Art`,
        url: `${SITE_URL}/search?q=${encodeURIComponent(q)}`,
      }} />
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Search' },
      ]} />
      <SearchResultsView
        query={q}
        listings={listings}
        artists={artists}
        totalListingCount={totalListingCount}
        totalArtistCount={totalArtistCount}
        hasError={hasError}
      />
    </div>
  )
}
