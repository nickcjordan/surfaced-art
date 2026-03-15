import type { Metadata } from 'next'
import Image from 'next/image'
import { getArtistProfile } from '@/lib/api'
import { ProfilePhoto } from '@/components/ProfilePhoto'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const artist = await getArtistProfile(slug)
    return {
      title: `${artist.displayName} — About`,
      alternates: { canonical: `/${slug}/about` },
    }
  } catch {
    return { title: 'About' }
  }
}

export default async function PortfolioAboutPage({ params }: Props) {
  const { slug } = await params
  const artist = await getArtistProfile(slug)

  const processPhotos = artist.processMedia
    .filter((m) => m.type === 'photo' && m.url)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const processVideo = artist.processMedia.find(
    (m) => m.type === 'video' && m.videoPlaybackId
  )

  return (
    <div className="space-y-16">
      {/* About — profile photo + bio side-by-side */}
      <section data-testid="portfolio-about">
        <div className="flex flex-col gap-8 md:flex-row md:gap-12">
          {artist.profileImageUrl && (
            <div className="shrink-0">
              <ProfilePhoto
                src={artist.profileImageUrl}
                alt={artist.displayName}
                size="xl"
              />
            </div>
          )}
          <div className="flex-1">
            <p
              data-testid="artist-bio"
              className="max-w-2xl whitespace-pre-line text-body-large text-foreground"
            >
              {artist.bio}
            </p>
            {(artist.instagramUrl || artist.websiteUrl) && (
              <div
                data-testid="artist-social-links"
                className="mt-6 flex flex-wrap gap-6"
              >
                {artist.instagramUrl && (
                  <a
                    href={artist.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-text underline underline-offset-2 transition-colors hover:text-accent-primary"
                  >
                    Instagram
                  </a>
                )}
                {artist.websiteUrl && (
                  <a
                    href={artist.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-text underline underline-offset-2 transition-colors hover:text-accent-primary"
                  >
                    Website
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Process Section */}
      {(processPhotos.length > 0 || processVideo) && (
        <section data-testid="process-section">
          <h2 className="mb-6 font-serif text-2xl text-foreground">
            The Process
          </h2>

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
    </div>
  )
}
