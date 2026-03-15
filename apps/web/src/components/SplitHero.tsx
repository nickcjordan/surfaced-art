import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

import { CDN_DOMAINS } from '@/lib/env'

function getCdnBase(): string {
  return CDN_DOMAINS.split(/\s+/)[0]
}

const HERO_IMAGE_PATHS = [
  {
    path: 'uploads/seed/artists/amara-osei/process/studio/1200w.webp',
    alt: 'Amara Osei working in her jewelry studio',
    weight: 3,
  },
  {
    path: 'uploads/seed/artists/elena-cordova/cover/1200w.webp',
    alt: 'Oil paintings by Elena Cordova inspired by the desert landscape',
    weight: 1,
  },
  {
    path: 'uploads/seed/artists/james-okafor/cover/1200w.webp',
    alt: 'Bold acrylic paintings by James Okafor',
    weight: 1,
  },
  {
    path: 'uploads/seed/artists/tomoko-ishida/cover/1200w.webp',
    alt: 'Silver gelatin photography by Tomoko Ishida',
    weight: 1,
  },
]

function pickHeroImage() {
  const totalWeight = HERO_IMAGE_PATHS.reduce((sum, e) => sum + e.weight, 0)
  let roll = Math.random() * totalWeight
  let entry = HERO_IMAGE_PATHS[0]
  for (const e of HERO_IMAGE_PATHS) {
    roll -= e.weight
    if (roll <= 0) {
      entry = e
      break
    }
  }
  const cdnBase = getCdnBase()
  return {
    src: cdnBase ? `${cdnBase}/${entry.path}` : `/${entry.path}`,
    alt: entry.alt,
  }
}

export function SplitHero() {
  const image = pickHeroImage()

  return (
    <section data-testid="hero" className="full-bleed -mt-8 overflow-x-hidden md:-mt-12">
      <div className="grid min-h-[60vh] grid-cols-1 lg:grid-cols-2">
        {/* Artwork image */}
        <div className="relative h-[35vh] lg:h-auto">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            unoptimized
            priority
            className="object-cover"
          />
        </div>

        {/* CTA panel */}
        <div className="flex flex-col justify-center bg-surface px-8 py-12 lg:px-16 lg:py-16">
          <h1 className="text-4xl tracking-tight text-foreground sm:text-5xl">
            A better place
            <br />
            to show your work
          </h1>

          <p className="mt-6 text-lg text-muted-text">
            Stop selling in your DMs.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button asChild size="lg">
              <Link href="/for-artists">See How It Works</Link>
            </Button>
            <Link
              href="/apply"
              className="text-sm text-muted-text transition-colors hover:text-foreground"
            >
              Ready to apply? &rarr;
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
