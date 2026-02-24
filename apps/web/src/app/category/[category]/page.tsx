import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getListings, getCategories, ApiError } from '@/lib/api'
import { ListingCard } from '@/components/ListingCard'
import { CATEGORIES } from '@/lib/categories'
import { Category } from '@surfaced-art/types'
import type { CategoryType } from '@surfaced-art/types'

export const revalidate = 60

const validCategories = new Set(Object.values(Category))

const categoryLabels = Object.fromEntries(
  Object.values(Category).map((c) => [
    c,
    c
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
  ])
) as Record<CategoryType, string>

export function generateStaticParams() {
  return Object.values(Category).map((category) => ({ category }))
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
    openGraph: {
      title: `${label} — Surfaced Art`,
      description: `Browse handmade ${label.toLowerCase()} from vetted artists on Surfaced Art.`,
      type: 'website',
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

  let listings: Awaited<ReturnType<typeof getListings>>['data'] = []
  let totalCount = 0
  try {
    const [listingsResponse, categories] = await Promise.all([
      getListings({ category: categorySlug, status: 'available', limit: 100 }),
      getCategories(),
    ])
    listings = listingsResponse.data
    totalCount = categories.find((c) => c.category === categorySlug)?.count ?? listingsResponse.meta.total
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`API error fetching category data: ${error.status} ${error.message}`)
    }
    listings = []
  }

  return (
    <div className="space-y-8">
      {/* Category Header */}
      <section data-testid="category-header">
        <h1 className="font-serif text-3xl text-foreground sm:text-4xl">{label}</h1>
        <p className="mt-2 text-sm text-muted-text">
          {totalCount} {totalCount === 1 ? 'piece' : 'pieces'} available
        </p>
      </section>

      {/* Category Navigation */}
      <nav aria-label="Category navigation" className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={cat.href}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              cat.slug === categorySlug
                ? 'bg-accent-primary text-white'
                : 'border border-border text-muted-text hover:border-accent-primary hover:text-foreground'
            }`}
          >
            {cat.label}
          </Link>
        ))}
      </nav>

      {/* Listings Grid */}
      <section data-testid="category-content">
        {listings.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={{
                  id: listing.id,
                  title: listing.title,
                  medium: listing.medium,
                  category: listing.category,
                  price: listing.price,
                  status: listing.status,
                  primaryImageUrl: listing.primaryImage?.url ?? null,
                }}
                artistName={listing.artist.displayName}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[30vh] flex-col items-center justify-center text-center">
            <p className="font-serif text-lg text-foreground">
              No pieces in this category yet
            </p>
            <p className="mt-2 text-sm text-muted-text">
              Check back soon — new work is added regularly.
            </p>
            <Link
              href="/"
              className="mt-4 text-sm text-muted-text transition-colors hover:text-foreground"
            >
              ← Back to gallery
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
