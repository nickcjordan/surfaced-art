import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site-config'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { JsonLd } from '@/components/JsonLd'
import { ApplicationForm } from './application-form'

export const metadata: Metadata = {
  title: 'Apply to Sell — Surfaced Art',
  description:
    'Apply to join Surfaced Art as a vetted artist. Share your work, process, and vision with our curatorial team.',
  alternates: { canonical: `${SITE_URL}/apply` },
  openGraph: {
    title: 'Apply to Sell — Surfaced Art',
    description:
      'Apply to join Surfaced Art as a vetted artist. Share your work, process, and vision with our curatorial team.',
    url: `${SITE_URL}/apply`,
  },
  robots: { index: false, follow: false },
}

export default function ApplyPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Apply' }]} />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Artist Application',
          description: 'Apply to sell handmade art on Surfaced Art.',
          url: `${SITE_URL}/apply`,
        }}
      />
      <div className="mx-auto max-w-2xl" data-testid="apply-page">
        <h1 className="mb-2">Apply to Sell on Surfaced Art</h1>
        <p className="mb-8 text-muted-foreground">
          We&apos;re looking for talented artists who create exceptional handmade work.
          Tell us about yourself and your practice, and we&apos;ll be in touch.
        </p>
        <ApplicationForm />
      </div>
    </>
  )
}
