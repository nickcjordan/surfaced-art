import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getListings, getCategories, getFeaturedArtists } from '@/lib/api'
import { categoryLabels } from '@/lib/category-labels'
import { CategoryBrowseView, type CategoryListingItem } from '@/components/CategoryBrowseView'
import { JsonLd } from '@/components/JsonLd'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { SITE_URL } from '@/lib/site-config'
import { Category } from '@surfaced-art/types'
import type { CategoryType } from '@surfaced-art/types'

export const revalidate = 60

const validCategories = new Set(Object.values(Category))

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
  const { category } = await params
  if (!validCategories.has(category as CategoryType)) {
    return { title: 'Category — Surfaced Art' }
  }
  const label = categoryLabels[category as CategoryType]
  return {
    title: `${label} — Surfaced Art`,
    description: `Browse handmade ${label.toLowerCase()} from vetted artists on Surfaced Art.`,
    alternates: {
      canonical: `/category/${category}`,
    },
    openGraph: {
      title: `${label} — Surfaced Art`,
      description: `Browse handmade ${label.toLowerCase()} from vetted artists on Surfaced Art.`,
      type: 'website',
      url: `${SITE_URL}/category/${category}`,
      images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
    },
    twitter: {
      images: ['/opengraph-image'],
    },
  }
}

export default async function CategoryBrowsePage({ params }: Props) {
  const { category } = await params

  if (!validCategories.has(category as CategoryType)) {
    notFound()
  }

  const categorySlug = category as CategoryType
  const label = categoryLabels[categorySlug]

  // Errors propagate so ISR preserves the previous good page during
  // revalidation failures instead of caching an error/empty state.
  // On initial render the (main)/error.tsx boundary handles failures.
  // Note: generateStaticParams returns [] so this page is never pre-rendered
  // at build time — no placeholder-API guard needed here.
  const [listingsResponse, artistsData, categories] = await Promise.all([
    getListings({ category: categorySlug, status: 'available', limit: 100 }),
    getFeaturedArtists({ category: categorySlug, limit: 50 }),
    getCategories(),
  ])

  const catData = categories.find((c) => c.category === categorySlug)
  const artists = artistsData
  const totalListingCount = catData?.count ?? listingsResponse.meta.total
  const totalArtistCount = catData?.artistCount ?? artists.length

  const listings: CategoryListingItem[] = listingsResponse.data.map((listing) => ({
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

  return (
    <div className="space-y-8">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${label} — Surfaced Art`,
        description: `Browse handmade ${label.toLowerCase()} from vetted artists on Surfaced Art.`,
        url: `${SITE_URL}/category/${categorySlug}`,
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
      />
    </div>
  )
}
