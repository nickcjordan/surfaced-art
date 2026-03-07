import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getArtistProfile, ApiError } from '@/lib/api'
import { ProfilePhoto } from '@/components/ProfilePhoto'
import { ListingCard } from '@/components/ListingCard'
import { MasonryGrid } from '@/components/MasonryGrid'
import { Badge } from '@/components/ui/badge'
import { categoryLabels } from '@/lib/category-labels'
import { JsonLd } from '@/components/JsonLd'
import { StudioTopBar } from '@/components/StudioTopBar'
import { SITE_URL } from '@/lib/site-config'
import type { ArtistProfileResponse, CvEntryTypeType } from '@surfaced-art/types'

export const revalidate = 60

export async function generateStaticParams() {
  return []
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
      title: artist.displayName,
      description,
      alternates: {
        canonical: `/studio/${slug}`,
      },
      openGraph: {
        title: artist.displayName,
        description,
        type: 'profile',
        url: `${SITE_URL}/studio/${slug}`,
        images: artist.coverImageUrl
          ? [{ url: artist.coverImageUrl, width: 1200, height: 630 }]
          : artist.profileImageUrl
            ? [{ url: artist.profileImageUrl, width: 400, height: 400 }]
            : [],
      },
    }
  } catch {
    return { title: 'Artist Studio' }
  }
}

export default async function StudioPage({ params }: Props) {
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

  const cvByType = new Map<CvEntryTypeType, typeof artist.cvEntries>()
  for (const entry of artist.cvEntries) {
    const existing = cvByType.get(entry.type) ?? []
    existing.push(entry)
    cvByType.set(entry.type, existing)
  }

  const sameAs = [artist.instagramUrl, artist.websiteUrl].filter(Boolean)

  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: artist.displayName,
        jobTitle: 'Artist',
        description: artist.bio.length > 155 ? artist.bio.slice(0, 155) + '…' : artist.bio,
        url: `${SITE_URL}/studio/${slug}`,
        ...(artist.profileImageUrl && { image: artist.profileImageUrl }),
        ...(sameAs.length > 0 && { sameAs }),
      }} />

      <StudioTopBar artistName={artist.displayName} artistSlug={slug} />

      {/* Hero — full-bleed cover */}
      <section data-testid="artist-hero">
        <div className="relative h-56 sm:h-72 md:h-96 overflow-hidden bg-border">
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
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background to-transparent" />
        </div>

        {/* Profile info */}
        <div className="mx-auto max-w-6xl px-6">
          <div className="relative -mt-16 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:gap-6">
            <ProfilePhoto
              src={artist.profileImageUrl}
              alt={artist.displayName}
              size="xl"
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
        </div>
      </section>

      {/* Remaining content — constrained width */}
      <div className="mx-auto max-w-6xl px-6 space-y-16 py-12">

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

        {/* CV / Background */}
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

        {/* Work */}
        {availableListings.length > 0 && (
          <section data-testid="available-work">
            <h2 className="mb-6 font-serif text-2xl text-foreground">Work</h2>
            <MasonryGrid columns={[2, 2, 3, 3]}>
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
                    primaryImageWidth: listing.images[0]?.width ?? null,
                    primaryImageHeight: listing.images[0]?.height ?? null,
                  }}
                  artistName={artist.displayName}
                  variant="studio"
                />
              ))}
            </MasonryGrid>
          </section>
        )}

        {/* Archive */}
        {soldListings.length > 0 && (
          <section data-testid="archive-section">
            <h2 className="mb-6 font-serif text-2xl text-foreground">Archive</h2>
            <MasonryGrid columns={[2, 2, 3, 3]} className="opacity-75">
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
                    primaryImageWidth: listing.images[0]?.width ?? null,
                    primaryImageHeight: listing.images[0]?.height ?? null,
                  }}
                  artistName={artist.displayName}
                  variant="studio"
                />
              ))}
            </MasonryGrid>
          </section>
        )}
      </div>
    </>
  )
}
