'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Images, BadgeDollarSign, Users, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CDN_DOMAINS } from '@/lib/env'

function getCdnBase(): string {
  return CDN_DOMAINS.split(/\s+/)[0]
}

type Artwork = { slug: string; listing: string; title: string }

const ARTWORKS: Artwork[] = [
  { slug: 'elena-cordova', listing: 'arroyos-at-dusk', title: 'Arroyos at Dusk' },
  { slug: 'james-okafor', listing: 'sunday-table', title: 'Sunday Table' },
  { slug: 'elena-cordova', listing: 'red-earth-blue-shadow', title: 'Red Earth, Blue Shadow' },
  { slug: 'tomoko-ishida', listing: 'rain-on-glass-puget-sound', title: 'Rain on Glass, Puget Sound' },
  { slug: 'elena-cordova', listing: 'chamisa-in-october', title: 'Chamisa in October' },
  { slug: 'james-okafor', listing: 'corner-store', title: 'Corner Store' },
  { slug: 'tomoko-ishida', listing: 'three-vessels', title: 'Three Vessels' },
  { slug: 'elena-cordova', listing: 'acequia-study-no-3', title: 'Acequia Study No. 3' },
]

/**
 * Collage layout: columns with varying image counts for a salon-wall feel.
 * Heights: tall ≈ 53vh, medium ≈ 34vh, small ≈ 17vh.
 * Pattern avoids adjacent columns with the same type.
 */
type CollageColumn =
  | { type: 'tall'; images: [Artwork] }
  | { type: 'double'; images: [Artwork, Artwork] }
  | { type: 'triple'; images: [Artwork, Artwork, Artwork] }
  | { type: 'tall-short'; images: [Artwork, Artwork] }
  | { type: 'short-tall'; images: [Artwork, Artwork] }

const COLLAGE_COLUMNS: CollageColumn[] = [
  { type: 'tall', images: [ARTWORKS[0]] },
  { type: 'triple', images: [ARTWORKS[1], ARTWORKS[2], ARTWORKS[3]] },
  { type: 'short-tall', images: [ARTWORKS[4], ARTWORKS[5]] },
  { type: 'double', images: [ARTWORKS[6], ARTWORKS[7]] },
  { type: 'tall-short', images: [ARTWORKS[3], ARTWORKS[1]] },
  { type: 'triple', images: [ARTWORKS[5], ARTWORKS[0], ARTWORKS[4]] },
  { type: 'tall', images: [ARTWORKS[2]] },
  { type: 'double', images: [ARTWORKS[7], ARTWORKS[6]] },
]

const COL_HEIGHTS: Record<CollageColumn['type'], string[]> = {
  tall: ['h-[53vh]'],
  double: ['h-[25vh]', 'h-[25vh]'],
  triple: ['h-[16vh]', 'h-[16vh]', 'h-[16vh]'],
  'tall-short': ['h-[35vh]', 'h-[16vh]'],
  'short-tall': ['h-[16vh]', 'h-[35vh]'],
}

function artworkImageUrl(slug: string, listing: string): string {
  const cdnBase = getCdnBase()
  return `${cdnBase}/uploads/seed/artists/${slug}/listings/${listing}/front/800w.webp`
}

/**
 * Duration for one full scroll cycle in seconds.
 * The track contains duplicated artwork images; this controls how long it takes
 * to scroll through one full set before seamlessly looping.
 */
const SCROLL_DURATION_S = 60

export function SplitHero() {
  const sectionRef = useRef<HTMLElement>(null)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setPaused(!entry.isIntersecting)
      },
      { threshold: 0 },
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  // Duplicate columns for seamless infinite loop
  const allColumns = [...COLLAGE_COLUMNS, ...COLLAGE_COLUMNS]

  return (
    <section
      ref={sectionRef}
      data-testid="hero"
      className="full-bleed relative -mt-8 overflow-hidden md:-mt-12"
      style={{
        minHeight: '65vh',
        background: 'linear-gradient(to bottom, color-mix(in srgb, var(--accent-primary) 25%, var(--background)) 0%, color-mix(in srgb, var(--accent-primary) 10%, var(--background)) 50%, var(--background) 85%, transparent 100%)',
      }}
    >
      {/* Scrolling artwork track */}
      <div className="absolute inset-0 flex items-center overflow-hidden">
        <div
          data-testid="hero-scroll-track"
          className="flex gap-4 px-4"
          style={{
            willChange: 'transform',
            animation: `hero-scroll ${SCROLL_DURATION_S}s linear infinite`,
            animationPlayState: paused ? 'paused' : 'running',
          }}
        >
          {allColumns.map((col, colIdx) => {
            const heights = COL_HEIGHTS[col.type]
            return (
              <div
                key={`${col.type}-${colIdx}`}
                className="flex flex-shrink-0 flex-col items-center justify-center gap-3"
              >
                {col.images.map((art, imgIdx) => (
                  <Image
                    key={`${art.listing}-${colIdx}-${imgIdx}`}
                    src={artworkImageUrl(art.slug, art.listing)}
                    alt={art.title}
                    width={col.images.length === 1 ? 800 : 400}
                    height={col.images.length === 1 ? 800 : 400}
                    unoptimized
                    loading={colIdx < 3 ? 'eager' : 'lazy'}
                    className={`${heights[imgIdx]} w-auto rounded-sm object-contain shadow-md`}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Frosted-glass CTA overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="mx-6 max-w-md rounded-xl border border-border bg-background px-8 py-10 text-center"
          style={{
            boxShadow: '0 8px 40px rgba(0, 0, 0, 0.25), 0 0 80px rgba(0, 0, 0, 0.1)',
          }}
        >
          <h1 className="text-3xl tracking-tight text-foreground sm:text-4xl">
            A Place for Artists
          </h1>

          <div className="mt-8 grid grid-cols-4 gap-4 sm:gap-6">
            <div className="flex flex-col items-center gap-2">
              <Images className="h-7 w-7 text-accent-primary" strokeWidth={1.5} />
              <span className="text-sm font-medium text-foreground">Portfolio</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <BadgeDollarSign className="h-7 w-7 text-accent-primary" strokeWidth={1.5} />
              <span className="text-sm font-medium text-foreground">Sales</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Users className="h-7 w-7 text-accent-primary" strokeWidth={1.5} />
              <span className="text-sm font-medium text-foreground">Community</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Search className="h-7 w-7 text-accent-primary" strokeWidth={1.5} />
              <span className="text-sm font-medium text-foreground">Discovery</span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/for-artists">See How It Works</Link>
            </Button>
          </div>

          <div className="mt-4">
            <Link
              href="/apply"
              className="text-sm text-muted-text transition-colors hover:text-foreground"
            >
              Ready to apply? &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* CSS keyframes for the scroll animation */}
      <style>{`
        @keyframes hero-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-testid="hero-scroll-track"] {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  )
}
