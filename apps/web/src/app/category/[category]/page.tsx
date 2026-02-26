import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getListings, getCategories, getFeaturedArtists, ApiError } from '@/lib/api'
import { categoryLabels } from '@/lib/category-labels'
import { CategoryFilterBar } from '@/components/CategoryFilterBar'
import { CategoryBrowseView, type CategoryListingItem } from '@/components/CategoryBrowseView'
import { JsonLd } from '@/components/JsonLd'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { CATEGORIES } from '@/lib/categories'
import { Category } from '@surfaced-art/types'
import type { CategoryType } from '@surfaced-art/types'

export const revalidate = 60

const validCategories = new Set(Object.values(Category))

export function generateStaticParams() {
  return CATEGORIES.map((cat) => ({ category: cat.slug }))
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
      url: `https://surfaced.art/category/${category}`,
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

  let listings: CategoryListingItem[] = []
  let artists: Awaited<ReturnType<typeof getFeaturedArtists>> = []
  let totalListingCount = 0
  let totalArtistCount = 0

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
      artistName: listing.artist.displayName,
    }))
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`API error fetching category data: ${error.status} ${error.message}`)
    } else {
      console.error('Unexpected error fetching category data:', error)
    }
  }

  return (
    <div className="space-y-8">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${label} — Surfaced Art`,
        description: `Browse handmade ${label.toLowerCase()} from vetted artists on Surfaced Art.`,
        url: `https://surfaced.art/category/${categorySlug}`,
      }} />
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label },
      ]} />
      <CategoryFilterBar
        activeCategory={categorySlug}
        basePath="/category"
      />
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
