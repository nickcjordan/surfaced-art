import type { Metadata } from 'next'
import { JsonLd } from '@/components/JsonLd'
import { SITE_URL } from '@/lib/site-config'
import ForArtistsContent from './ForArtistsContent'

export const metadata: Metadata = {
  title: 'For Artists — Surfaced Art',
  description:
    'Join a curated gallery for real makers. Vetted artists, dedicated profiles, transparent commission, and a platform that handles the rest.',
  alternates: { canonical: `${SITE_URL}/for-artists` },
  openGraph: {
    title: 'For Artists — Surfaced Art',
    description:
      'Join a curated gallery for real makers. Vetted artists, dedicated profiles, transparent commission, and a platform that handles the rest.',
    url: `${SITE_URL}/for-artists`,
  },
}

export default function ForArtistsPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'For Artists — Surfaced Art',
          url: `${SITE_URL}/for-artists`,
          description: metadata.description as string,
          isPartOf: {
            '@type': 'WebSite',
            name: 'Surfaced Art',
            url: SITE_URL,
          },
        }}
      />
      <ForArtistsContent />
    </>
  )
}
