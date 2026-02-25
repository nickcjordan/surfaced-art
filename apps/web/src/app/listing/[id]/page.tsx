import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getListingDetail, ApiError } from '@/lib/api'
import { formatCurrency } from '@surfaced-art/utils'
import { formatDimensions } from '@surfaced-art/utils'
import { ImageGallery } from '@/components/ImageGallery'
import { ProfilePhoto } from '@/components/ProfilePhoto'
import { Badge } from '@/components/ui/badge'
import { WaitlistForm } from '@/components/WaitlistForm'
import { categoryLabels } from '@/lib/category-labels'
import type { ListingDetailResponse } from '@surfaced-art/types'

export const revalidate = 60

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  try {
    const listing = await getListingDetail(id)
    const title = `${listing.title} by ${listing.artist.displayName} — Surfaced Art`
    const description = listing.description.length > 155
      ? listing.description.slice(0, 155) + '…'
      : listing.description

    return {
      title,
      description,
      alternates: {
        canonical: `/listing/${id}`,
      },
      openGraph: {
        title,
        description,
        type: 'article',
        url: `https://surfaced.art/listing/${id}`,
        images: listing.images.length > 0 ? [{ url: listing.images[0].url }] : [],
      },
    }
  } catch {
    return { title: 'Listing — Surfaced Art' }
  }
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params

  let listing: ListingDetailResponse
  try {
    listing = await getListingDetail(id)
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
      notFound()
    }
    throw error
  }

  const dimensions = formatDimensions(
    listing.artworkLength,
    listing.artworkWidth,
    listing.artworkHeight
  )

  const hasEdition = listing.editionNumber != null && listing.editionTotal != null

  return (
    <div className="space-y-12">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Image Gallery */}
        <div>
          <ImageGallery images={listing.images} alt={listing.title} />
        </div>

        {/* Details Panel */}
        <div className="space-y-6">
          <div>
            <h1
              data-testid="listing-title"
              className="font-serif text-3xl text-foreground"
            >
              {listing.title}
            </h1>
            <p className="mt-1 text-sm text-muted-text">
              by{' '}
              <Link
                href={`/artist/${listing.artist.slug}`}
                className="transition-colors hover:text-foreground"
              >
                {listing.artist.displayName}
              </Link>
            </p>
          </div>

          {/* Price */}
          <p
            data-testid="listing-price"
            className="font-serif text-2xl text-foreground"
          >
            {formatCurrency(listing.price)}
          </p>

          {/* Details */}
          <dl className="space-y-2 text-sm">
            <div data-testid="listing-medium" className="flex gap-2">
              <dt className="text-muted-text">Medium</dt>
              <dd className="text-foreground">{listing.medium}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-text">Category</dt>
              <dd className="text-foreground">
                {categoryLabels[listing.category] ?? listing.category}
              </dd>
            </div>
            {dimensions && (
              <div data-testid="listing-dimensions" className="flex gap-2">
                <dt className="text-muted-text">Dimensions</dt>
                <dd className="text-foreground">{dimensions}</dd>
              </div>
            )}
            {hasEdition && (
              <div data-testid="edition-info" className="flex gap-2">
                <dt className="text-muted-text">Edition</dt>
                <dd className="text-foreground">
                  {listing.editionNumber} of {listing.editionTotal}
                </dd>
              </div>
            )}
          </dl>

          {/* Documented badge */}
          {listing.isDocumented && (
            <Badge>Documented Work</Badge>
          )}

          {/* Description */}
          {listing.description && (
            <div data-testid="listing-description">
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                {listing.description}
              </p>
            </div>
          )}

          {/* CTA / Waitlist */}
          {listing.status === 'available' && (
            <div className="rounded-md border border-border bg-surface p-6">
              <p className="mb-4 text-center text-sm text-muted-text">
                This gallery opens to buyers soon. Leave your email to be
                the first to know.
              </p>
              <WaitlistForm />
            </div>
          )}

          {listing.status === 'sold' && (
            <div className="rounded-md border border-border bg-surface p-4 text-center">
              <p className="text-sm font-medium text-muted-text">This piece has been sold</p>
            </div>
          )}
        </div>
      </div>

      {/* Artist Card */}
      <section data-testid="artist-card" className="border-t border-border pt-8">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-text">
          About the Artist
        </h2>
        <Link
          href={`/artist/${listing.artist.slug}`}
          className="flex items-center gap-4 rounded-md p-3 transition-colors hover:bg-surface"
        >
          <ProfilePhoto
            src={listing.artist.profileImageUrl}
            alt={listing.artist.displayName}
            size="md"
          />
          <div>
            <p className="font-serif text-base text-foreground">
              {listing.artist.displayName}
            </p>
            <p className="text-sm text-muted-text">{listing.artist.location}</p>
            {listing.artist.categories.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {listing.artist.categories.slice(0, 3).map((cat) => (
                  <Badge key={cat}>
                    {categoryLabels[cat] ?? cat}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </Link>
      </section>

      {/* Back link */}
      <div className="text-center">
        <Link
          href={`/artist/${listing.artist.slug}`}
          className="text-sm text-muted-text transition-colors hover:text-foreground"
        >
          ← More from {listing.artist.displayName}
        </Link>
      </div>
    </div>
  )
}
