import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getListings, getCategories, getFeaturedArtists } from '@/lib/api'
import { categoryLabels } from '@/lib/category-labels'
import { CategoryFilterBar } from '@/components/CategoryFilterBar'
import { CategoryBrowseView } from '@/components/CategoryBrowseView'
import { Category } from '@surfaced-art/types'
import type { CategoryType } from '@surfaced-art/types'

export const dynamic = 'force-dynamic'

const validCategories = new Set(Object.values(Category))

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

  const [listingsResponse, artists, categories] = await Promise.all([
    getListings({ category: categorySlug, status: 'available', limit: 100 }),
    getFeaturedArtists({ category: categorySlug, limit: 50 }),
    getCategories(),
  ])

  const catData = categories.find((c) => c.category === categorySlug)

  // Map to serializable shape for the client component (no Date objects)
  const listings = listingsResponse.data.map((listing) => ({
    id: listing.id,
    title: listing.title,
    medium: listing.medium,
    category: listing.category,
    price: listing.price,
    status: listing.status,
    primaryImageUrl: listing.primaryImage?.url ?? null,
    artistName: listing.artist.displayName,
  }))

  return (
    <div className="space-y-8">
      <CategoryFilterBar
        activeCategory={categorySlug}
        basePath="/category"
      />
      <CategoryBrowseView
        categoryLabel={label}
        listings={listings}
        artists={artists}
        totalListingCount={catData?.count ?? listingsResponse.meta.total}
        totalArtistCount={catData?.artistCount ?? artists.length}
      />
    </div>
  )
}
