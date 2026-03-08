import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

function getCdnBase(): string {
  const domains = process.env.NEXT_PUBLIC_CDN_DOMAINS || ''
  const first = domains.split(/\s+/)[0]
  return first || ''
}

const HERO_IMAGE_PATHS = [
  {
    path: 'uploads/seed/artists/elena-cordova/cover/1200w.webp',
    alt: 'Oil paintings by Elena Cordova inspired by the desert landscape',
  },
  {
    path: 'uploads/seed/artists/james-okafor/cover/1200w.webp',
    alt: 'Bold acrylic paintings by James Okafor',
  },
  {
    path: 'uploads/seed/artists/tomoko-ishida/cover/1200w.webp',
    alt: 'Silver gelatin photography by Tomoko Ishida',
  },
  {
    path: 'uploads/seed/artists/amara-osei/process/studio/1200w.webp',
    alt: 'Amara Osei working in her jewelry studio',
  },
]

function pickHeroImage() {
  const entry = HERO_IMAGE_PATHS[Math.floor(Math.random() * HERO_IMAGE_PATHS.length)]
  const cdnBase = getCdnBase()
  return {
    src: cdnBase ? `${cdnBase}/${entry.path}` : `/${entry.path}`,
    alt: entry.alt,
  }
}

export function SplitHero() {
  const image = pickHeroImage()

  return (
    <section data-testid="hero" className="full-bleed overflow-x-hidden">
      <div className="grid min-h-[60vh] grid-cols-1 lg:grid-cols-2">
        {/* Artwork image */}
        <div className="relative h-[50vh] lg:h-auto">
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
        <div className="flex flex-col justify-center bg-background px-8 py-12 lg:px-16 lg:py-16">
          <h1 className="text-4xl tracking-tight text-foreground sm:text-5xl">
            A curated gallery
            <br />
            for real makers
          </h1>

          <ul className="mt-8 space-y-3 text-muted-text">
            <li className="flex items-start gap-2">
              <span aria-hidden="true" className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-accent-primary" />
              Every artist is vetted. Your work stands out, not competes.
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden="true" className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-accent-primary" />
              We handle the platform. You focus on creating.
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden="true" className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-accent-primary" />
              Your own gallery page — profile, process, and portfolio.
            </li>
          </ul>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button asChild size="lg">
              <Link href="/apply">Join the Gallery</Link>
            </Button>
            <Link
              href="/for-artists"
              className="text-sm text-muted-text transition-colors hover:text-foreground"
            >
              Learn More &rarr;
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
