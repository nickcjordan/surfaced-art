import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const HERO_IMAGES = [
  {
    src: 'https://dmfu4c7s6z2cc.cloudfront.net/uploads/seed/artists/abbey-peters/cover/1200w.webp',
    alt: 'Ceramics studio of Abbey Peters with handmade stoneware',
  },
  {
    src: 'https://dmfu4c7s6z2cc.cloudfront.net/uploads/seed/artists/david-morrison/cover/1200w.webp',
    alt: 'Woodworking studio of David Morrison',
  },
  {
    src: 'https://dmfu4c7s6z2cc.cloudfront.net/uploads/seed/artists/karina-yanes/cover/1200w.webp',
    alt: 'Artwork by Karina Yanes',
  },
  {
    src: 'https://dmfu4c7s6z2cc.cloudfront.net/uploads/seed/artists/abbey-peters/process/studio/1200w.webp',
    alt: 'Abbey Peters working in her ceramics studio',
  },
]

function pickHeroImage() {
  return HERO_IMAGES[Math.floor(Math.random() * HERO_IMAGES.length)]
}

export function SplitHero() {
  const image = pickHeroImage()

  return (
    <section data-testid="hero" className="full-bleed">
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
              <span className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-accent-primary" />
              Every artist is vetted. Your work stands out, not competes.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-accent-primary" />
              We handle the platform. You focus on creating.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-accent-primary" />
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
