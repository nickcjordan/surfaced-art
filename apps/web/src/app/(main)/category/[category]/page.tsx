import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getListings, getCategories, getFeaturedArtists, ApiError } from '@/lib/api'
import { categoryLabels } from '@/lib/category-labels'
import { CategoryBrowseView, type CategoryListingItem } from '@/components/CategoryBrowseView'
import { JsonLd } from '@/components/JsonLd'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { SITE_URL } from '@/lib/site-config'
import { urlSlugToCategory, categoryToUrlSlug } from '@/lib/category-slugs'

export const revalidate = 60

// Return empty array so no category pages are pre-rendered at build time.
// Pages render on first visitor request and are cached via ISR (revalidate = 60).
// Use POST /api/revalidate to bust the cache on demand after content changes.
export function generateStaticParams() {
  return []
}

type Props = {
  params: Promise<{ category: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: urlSlug } = await params
  const categorySlug = urlSlugToCategory(urlSlug)
  if (!categorySlug) {
    return { title: 'Category — Surfaced Art' }
  }
  const label = categoryLabels[categorySlug]
  const canonicalSlug = categoryToUrlSlug(categorySlug)
  return {
    title: `${label} — Surfaced Art`,
    description: `Browse handmade ${label.toLowerCase()} from vetted artists on Surfaced Art.`,
    alternates: {
      canonical: `/category/${canonicalSlug}`,
    },
    openGraph: {
      title: `${label} — Surfaced Art`,
      description: `Browse handmade ${label.toLowerCase()} from vetted artists on Surfaced Art.`,
      type: 'website',
      url: `${SITE_URL}/category/${canonicalSlug}`,
      images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
    },
    twitter: {
      images: ['/opengraph-image'],
    },
  }
}

export default async function CategoryBrowsePage({ params }: Props) {
  const { category: urlSlug } = await params
  const categorySlug = urlSlugToCategory(urlSlug)

  if (!categorySlug) {
    notFound()
  }

  const label = categoryLabels[categorySlug]

  let listings: CategoryListingItem[] = []
  let artists: Awaited<ReturnType<typeof getFeaturedArtists>> = []
  let totalListingCount = 0
  let totalArtistCount = 0
  let hasError = false

  try {
    const [listingsResponse, artistsData, categories] = await Promise.all([
      getListings({ category: categorySlug, status: 'available', limit: 100 }),
      getFeaturedArtists({ category: categorySlug, limit: 50 }),
      getCategories(),
    ])

    const catData = categories.find((c) => c.category === categorySlug)
    artists = artistsData
    totalListingCount = catData?.count ?? listingsResponse.meta.total
    totalArtistCount = catData?.artistCount ?? artists.length

    listings = listingsResponse.data.map((listing) => ({
      id: listing.id,
      title: listing.title,
      medium: listing.medium,
      category: listing.category,
      price: listing.price,
      status: listing.status,
      primaryImageUrl: listing.primaryImage?.url ?? null,
      primaryImageWidth: listing.primaryImage?.width ?? null,
      primaryImageHeight: listing.primaryImage?.height ?? null,
      artistName: listing.artist.displayName,
    }))
  } catch (error) {
    hasError = true
    if (error instanceof ApiError) {
      console.error(`API error fetching category data: ${error.status} ${error.message}`)
    } else {
      console.error('Unexpected error fetching category data:', error)
    }
  }

  const canonicalSlug = categoryToUrlSlug(categorySlug)

  return (
    <div className="space-y-8">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${label} — Surfaced Art`,
        description: `Browse handmade ${label.toLowerCase()} from vetted artists on Surfaced Art.`,
        url: `${SITE_URL}/category/${canonicalSlug}`,
      }} />
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label },
      ]} />
      <CategoryBrowseView
        categoryLabel={label}
        listings={listings}
        artists={artists}
        totalListingCount={totalListingCount}
        totalArtistCount={totalArtistCount}
        hasError={hasError}
      />
    </div>
  )
}
