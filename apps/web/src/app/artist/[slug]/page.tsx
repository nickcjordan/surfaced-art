import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getArtistProfile, getFeaturedArtists, ApiError } from '@/lib/api'
import { ProfilePhoto } from '@/components/ProfilePhoto'
import { ListingCard } from '@/components/ListingCard'
import { Badge } from '@/components/ui/badge'
import { categoryLabels } from '@/lib/category-labels'
import { JsonLd } from '@/components/JsonLd'
import type { ArtistProfileResponse, CvEntryTypeType } from '@surfaced-art/types'

export const revalidate = 60

export async function generateStaticParams() {
  try {
    const artists = await getFeaturedArtists({ limit: 50 })
    return artists.map((artist) => ({ slug: artist.slug }))
  } catch {
    return []
  }
}

const cvEntryTypeLabels: Record<CvEntryTypeType, string> = {
  exhibition: 'Exhibitions',
  award: 'Awards',
  education: 'Education',
  press: 'Press',
  residency: 'Residencies',
  other: 'Other',
}

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const artist = await getArtistProfile(slug)
    const description = artist.bio.length > 155
      ? artist.bio.slice(0, 155) + '…'
      : artist.bio

    return {
      title: `${artist.displayName} — Surfaced Art`,
      description,
      alternates: {
        canonical: `/artist/${slug}`,
      },
      openGraph: {
        title: `${artist.displayName} — Surfaced Art`,
        description,
        type: 'profile',
        url: `https://surfaced.art/artist/${slug}`,
        images: artist.profileImageUrl ? [{ url: artist.profileImageUrl, width: 400, height: 400 }] : [],
      },
      twitter: {
        images: artist.profileImageUrl ? [artist.profileImageUrl] : [],
      },
    }
  } catch {
    return { title: 'Artist — Surfaced Art' }
  }
}

export default async function ArtistProfilePage({ params }: Props) {
  const { slug } = await params

  let artist: ArtistProfileResponse
  try {
    artist = await getArtistProfile(slug)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound()
    }
    throw error
  }

  const availableListings = artist.listings.filter((l) => l.status === 'available')
  const soldListings = artist.listings.filter((l) => l.status === 'sold')
  const processPhotos = artist.processMedia
    .filter((m) => m.type === 'photo' && m.url)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const processVideo = artist.processMedia.find(
    (m) => m.type === 'video' && m.videoPlaybackId
  )

  // Group CV entries by type
  const cvByType = new Map<CvEntryTypeType, typeof artist.cvEntries>()
  for (const entry of artist.cvEntries) {
    const existing = cvByType.get(entry.type) ?? []
    existing.push(entry)
    cvByType.set(entry.type, existing)
  }

  const sameAs = [artist.instagramUrl, artist.websiteUrl].filter(Boolean)

  return (
    <div className="space-y-16">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: artist.displayName,
        jobTitle: 'Artist',
        description: artist.bio.length > 155 ? artist.bio.slice(0, 155) + '…' : artist.bio,
        url: `https://surfaced.art/artist/${slug}`,
        ...(artist.profileImageUrl && { image: artist.profileImageUrl }),
        ...(sameAs.length > 0 && { sameAs }),
      }} />

      {/* Hero */}
      <section data-testid="artist-hero">
        {/* Cover image */}
        <div className="relative -mx-4 -mt-8 h-48 overflow-hidden bg-border sm:h-64 md:-mx-0 md:-mt-12 md:h-80 md:rounded-lg">
          {artist.coverImageUrl ? (
            <Image
              src={artist.coverImageUrl}
              alt={`${artist.displayName}'s studio`}
              fill
              unoptimized
              className="object-cover"
              priority
            />
          ) : (
            <div className="size-full bg-border" />
          )}
        </div>

        {/* Profile info */}
        <div className="relative -mt-12 flex flex-col items-start gap-4 px-2 sm:flex-row sm:items-end sm:gap-6">
          <ProfilePhoto
            src={artist.profileImageUrl}
            alt={artist.displayName}
            size="lg"
            bordered
          />
          <div className="flex-1">
            <h1
              data-testid="artist-name"
              className="font-serif text-3xl text-foreground sm:text-4xl"
            >
              {artist.displayName}
            </h1>
            {artist.location && (
              <p data-testid="artist-location" className="mt-1 text-sm text-muted-text">
                {artist.location}
              </p>
            )}
            {artist.categories.length > 0 && (
              <div data-testid="artist-categories" className="mt-2 flex flex-wrap gap-1.5">
                {artist.categories.map((cat) => (
                  <Badge key={cat}>{categoryLabels[cat] ?? cat}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bio */}
      <section data-testid="artist-bio">
        <p className="max-w-2xl whitespace-pre-line text-base leading-relaxed text-foreground">
          {artist.bio}
        </p>
      </section>

      {/* Social links */}
      {(artist.instagramUrl || artist.websiteUrl) && (
        <section data-testid="artist-social-links" className="flex flex-wrap gap-4">
          {artist.instagramUrl && (
            <a
              href={artist.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-text transition-colors hover:text-foreground"
            >
              Instagram →
            </a>
          )}
          {artist.websiteUrl && (
            <a
              href={artist.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-text transition-colors hover:text-foreground"
            >
              Website →
            </a>
          )}
        </section>
      )}

      {/* Process Section */}
      {(processPhotos.length > 0 || processVideo) && (
        <section data-testid="process-section">
          <h2 className="mb-6 font-serif text-2xl text-foreground">The Process</h2>

          {/* Process video */}
          {processVideo && processVideo.videoPlaybackId && (
            <div className="mb-6 aspect-video overflow-hidden rounded-md bg-surface">
              <iframe
                src={`https://stream.mux.com/${processVideo.videoPlaybackId}`}
                title={`${artist.displayName}'s process video`}
                allow="autoplay; fullscreen"
                allowFullScreen
                className="size-full"
              />
            </div>
          )}

          {/* Process photos grid */}
          {processPhotos.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {processPhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="relative aspect-square overflow-hidden rounded-md bg-surface"
                >
                  <Image
                    src={photo.url!}
                    alt={`${artist.displayName} process photo ${index + 1} of ${processPhotos.length}`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* CV / History */}
      {cvByType.size > 0 && (
        <section data-testid="cv-section">
          <h2 className="mb-6 font-serif text-2xl text-foreground">Background</h2>
          <div className="space-y-8">
            {Array.from(cvByType.entries()).map(([type, entries]) => (
              <div key={type}>
                <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-text">
                  {cvEntryTypeLabels[type] ?? type}
                </h3>
                <ul className="space-y-2">
                  {entries
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((entry) => (
                      <li key={entry.id} className="flex items-baseline gap-3">
                        <span className="shrink-0 text-sm tabular-nums text-muted-text">
                          {entry.year}
                        </span>
                        <div>
                          <span className="text-sm text-foreground">{entry.title}</span>
                          {entry.institution && (
                            <span className="text-sm text-muted-text">
                              {' '}— {entry.institution}
                            </span>
                          )}
                          {entry.description && (
                            <p className="mt-0.5 text-xs text-muted-text">
                              {entry.description}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Available Work */}
      <section data-testid="available-work">
        <h2 className="mb-6 font-serif text-2xl text-foreground">Available Work</h2>
        {availableListings.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
            {availableListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={{
                  id: listing.id,
                  title: listing.title,
                  medium: listing.medium,
                  category: listing.category,
                  price: listing.price,
                  status: listing.status,
                  primaryImageUrl: listing.images[0]?.url ?? null,
                }}
                artistName={artist.displayName}
                variant="profile"
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-text">
            No pieces currently available. Check back soon.
          </p>
        )}
      </section>

      {/* Archive (Sold) */}
      {soldListings.length > 0 && (
        <section data-testid="archive-section">
          <h2 className="mb-6 font-serif text-2xl text-foreground">Collection Archive</h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 opacity-75">
            {soldListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={{
                  id: listing.id,
                  title: listing.title,
                  medium: listing.medium,
                  category: listing.category,
                  price: listing.price,
                  status: listing.status,
                  primaryImageUrl: listing.images[0]?.url ?? null,
                }}
                artistName={artist.displayName}
                variant="profile"
              />
            ))}
          </div>
        </section>
      )}

      {/* Back link */}
      <div className="text-center">
        <Link
          href="/"
          className="text-sm text-muted-text transition-colors hover:text-foreground"
        >
          ← Back to gallery
        </Link>
      </div>
    </div>
  )
}
