import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getArtistProfile, ApiError } from '@/lib/api'
import { PortfolioTopBar } from '@/components/PortfolioTopBar'
import { PortfolioNav } from '@/components/PortfolioNav'
import { JsonLd } from '@/components/JsonLd'
import { SITE_URL } from '@/lib/site-config'

export const revalidate = 60

type Props = {
  params: Promise<{ slug: string }>
  children: React.ReactNode
}

export async function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const artist = await getArtistProfile(slug)
    const description =
      artist.bio.length > 155 ? artist.bio.slice(0, 155) + '…' : artist.bio

    return {
      title: artist.displayName,
      description,
      alternates: {
        canonical: `/${slug}`,
      },
      openGraph: {
        title: artist.displayName,
        description,
        type: 'profile',
        url: `${SITE_URL}/${slug}`,
        images: artist.coverImageUrl
          ? [{ url: artist.coverImageUrl, width: 1200, height: 630 }]
          : artist.profileImageUrl
            ? [{ url: artist.profileImageUrl, width: 400, height: 400 }]
            : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: artist.displayName,
        description,
        images: artist.coverImageUrl
          ? [artist.coverImageUrl]
          : artist.profileImageUrl
            ? [artist.profileImageUrl]
            : [],
      },
    }
  } catch {
    return { title: 'Artist Portfolio' }
  }
}

export default async function PortfolioSlugLayout({ params, children }: Props) {
  const { slug } = await params

  let artist
  try {
    artist = await getArtistProfile(slug)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound()
    }
    throw error
  }

  const sameAs = [artist.instagramUrl, artist.websiteUrl].filter(Boolean)
  const hasCv = artist.cvEntries.length > 0

  // Build CSS custom property overrides for per-artist accent color theming
  const accentStyle = artist.accentColor
    ? ({
        '--primary': artist.accentColor,
        '--accent-primary': artist.accentColor,
        '--ring': artist.accentColor,
      } as React.CSSProperties)
    : undefined

  return (
    <div style={accentStyle}>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: artist.displayName,
          jobTitle: 'Artist',
          description:
            artist.bio.length > 155
              ? artist.bio.slice(0, 155) + '…'
              : artist.bio,
          url: `${SITE_URL}/${slug}`,
          ...(artist.profileImageUrl && { image: artist.profileImageUrl }),
          ...(sameAs.length > 0 && { sameAs }),
        }}
      />

      <PortfolioTopBar artistName={artist.displayName} artistSlug={slug} />

      {/* Portfolio Header — art-forward: name + location only */}
      <header data-testid="portfolio-header" className="mx-auto max-w-6xl px-6 pt-8 pb-4">
        <h1
          data-testid="artist-name"
          className="font-serif text-4xl text-foreground sm:text-5xl"
        >
          {artist.displayName}
        </h1>
        {artist.location && (
          <p
            data-testid="artist-location"
            className="mt-1 text-sm text-muted-text"
          >
            {artist.location}
          </p>
        )}
      </header>

      {/* Section navigation */}
      <PortfolioNav slug={slug} hasCv={hasCv} />

      {/* Sub-page content */}
      <div className="mx-auto max-w-6xl px-6 py-12">{children}</div>
    </div>
  )
}
