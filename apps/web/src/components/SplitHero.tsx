'use client'

import { useEffect, useRef } from 'react'
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
  // Elena Cordova — painting
  { slug: 'elena-cordova', listing: 'arroyos-at-dusk', title: 'Arroyos at Dusk' },
  { slug: 'elena-cordova', listing: 'red-earth-blue-shadow', title: 'Red Earth, Blue Shadow' },
  { slug: 'elena-cordova', listing: 'chamisa-in-october', title: 'Chamisa in October' },
  { slug: 'elena-cordova', listing: 'acequia-study-no-3', title: 'Acequia Study No. 3' },
  { slug: 'elena-cordova', listing: 'madre-tierra-sold', title: 'Madre Tierra' },
  // James Okafor — painting
  { slug: 'james-okafor', listing: 'sunday-table', title: 'Sunday Table' },
  { slug: 'james-okafor', listing: 'corner-store', title: 'Corner Store' },
  { slug: 'james-okafor', listing: 'wash-day', title: 'Wash Day' },
  { slug: 'james-okafor', listing: 'lunchtime-decatur', title: 'Lunchtime, Decatur' },
  { slug: 'james-okafor', listing: 'elders', title: 'Elders' },
  // Tomoko Ishida — photography / ceramics
  { slug: 'tomoko-ishida', listing: 'rain-on-glass-puget-sound', title: 'Rain on Glass, Puget Sound' },
  { slug: 'tomoko-ishida', listing: 'three-vessels', title: 'Three Vessels' },
  { slug: 'tomoko-ishida', listing: 'chawan-ash-glaze', title: 'Chawan, Ash Glaze' },
  { slug: 'tomoko-ishida', listing: 'moss-and-stone', title: 'Moss and Stone' },
  { slug: 'tomoko-ishida', listing: 'winter-light-studio', title: 'Winter Light, Studio' },
  // Amara Osei — jewelry
  { slug: 'amara-osei', listing: 'sankofa-cuff', title: 'Sankofa Cuff' },
  { slug: 'amara-osei', listing: 'goldweight-earrings-geometric', title: 'Goldweight Earrings, Geometric' },
  { slug: 'amara-osei', listing: 'adinkra-ring-gye-nyame', title: 'Adinkra Ring, Gye Nyame' },
  { slug: 'amara-osei', listing: 'kente-pendant-large', title: 'Kente Pendant, Large' },
  { slug: 'amara-osei', listing: 'goldweight-brooch-bird', title: 'Goldweight Brooch, Bird' },
]

/**
 * Two rows of artwork, artists interleaved so adjacent images differ.
 * Top row: 10 images, bottom row: 10 images.
 */
const TOP_ROW: Artwork[] = [
  ARTWORKS[0],  // elena
  ARTWORKS[5],  // james
  ARTWORKS[10], // tomoko
  ARTWORKS[15], // amara
  ARTWORKS[1],  // elena
  ARTWORKS[6],  // james
  ARTWORKS[11], // tomoko
  ARTWORKS[16], // amara
  ARTWORKS[2],  // elena
  ARTWORKS[7],  // james
]

const BOTTOM_ROW: Artwork[] = [
  ARTWORKS[12], // tomoko
  ARTWORKS[17], // amara
  ARTWORKS[3],  // elena
  ARTWORKS[8],  // james
  ARTWORKS[13], // tomoko
  ARTWORKS[18], // amara
  ARTWORKS[4],  // elena
  ARTWORKS[9],  // james
  ARTWORKS[14], // tomoko
  ARTWORKS[19], // amara
]

function artworkImageUrl(slug: string, listing: string): string {
  const cdnBase = getCdnBase()
  return `${cdnBase}/uploads/seed/artists/${slug}/listings/${listing}/front/800w.webp`
}

/** Scroll speed in pixels per second. */
const SCROLL_PX_PER_S = 30

/**
 * A single scrolling row of artwork. Renders two copies of the image set
 * and uses rAF to scroll by the exact measured width of one copy.
 */
function ScrollRow({
  artworks,
  height,
  speedMultiplier = 1,
  visible,
}: {
  artworks: Artwork[]
  height: string
  speedMultiplier?: number
  visible: React.RefObject<boolean>
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const setARef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let offset = 0
    let lastTime = 0
    let raf = 0

    const tick = (now: number) => {
      if (lastTime === 0) {
        lastTime = now
      }

      const delta = now - lastTime
      lastTime = now

      if (visible.current && trackRef.current && setARef.current) {
        const setWidth = setARef.current.offsetWidth
        if (setWidth > 0) {
          offset = (offset + (delta / 1000) * SCROLL_PX_PER_S * speedMultiplier) % setWidth
          trackRef.current.style.transform = `translateX(-${offset}px)`
        }
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [speedMultiplier, visible])

  function renderSet(keyPrefix: string) {
    return (
      <div
        ref={keyPrefix === 'a' ? setARef : undefined}
        className="flex flex-shrink-0 items-center gap-4 pr-4"
        aria-hidden={keyPrefix === 'b' || undefined}
      >
        {artworks.map((art, i) => (
          <Image
            key={`${keyPrefix}-${art.listing}-${i}`}
            src={artworkImageUrl(art.slug, art.listing)}
            alt={art.title}
            width={800}
            height={800}
            unoptimized
            loading={keyPrefix === 'a' && i < 3 ? 'eager' : 'lazy'}
            className={`${height} w-auto flex-shrink-0 rounded-sm`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex" ref={trackRef} style={{ willChange: 'transform' }}>
      {renderSet('a')}
      {renderSet('b')}
    </div>
  )
}

export function SplitHero() {
  const sectionRef = useRef<HTMLElement>(null)
  const visibleRef = useRef(true)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting
      },
      { threshold: 0 },
    )
    observer.observe(section)

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (motionQuery.matches) {
      visibleRef.current = false
    }
    const onMotionChange = (e: MediaQueryListEvent) => {
      visibleRef.current = !e.matches
    }
    motionQuery.addEventListener('change', onMotionChange)

    return () => {
      observer.disconnect()
      motionQuery.removeEventListener('change', onMotionChange)
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      data-testid="hero"
      className="full-bleed relative -mt-8 overflow-hidden md:-mt-12"
      style={{
        minHeight: '65vh',
        background:
          'linear-gradient(to bottom, color-mix(in srgb, var(--accent-primary) 25%, var(--background)) 0%, color-mix(in srgb, var(--accent-primary) 10%, var(--background)) 50%, var(--background) 85%, transparent 100%)',
      }}
    >
      {/* Two staggered rows of scrolling artwork */}
      <div
        data-testid="hero-scroll-track"
        className="absolute inset-0 flex flex-col items-start justify-center gap-4 overflow-hidden"
      >
        <ScrollRow
          artworks={TOP_ROW}
          height="h-[28vh]"
          speedMultiplier={1}
          visible={visibleRef}
        />
        <ScrollRow
          artworks={BOTTOM_ROW}
          height="h-[24vh]"
          speedMultiplier={0.7}
          visible={visibleRef}
        />
      </div>

      {/* Frosted-glass CTA overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="mx-6 max-w-md rounded-xl bg-background/90 px-8 py-10 text-center"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--background) 82%, transparent)',
            backdropFilter: 'blur(24px) saturate(1.2)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.2)',
            boxShadow:
              'inset 0 0 40px rgba(0, 0, 0, 0.05), 0 0 60px color-mix(in srgb, var(--background) 50%, transparent)',
            border: '1px solid color-mix(in srgb, var(--border) 30%, transparent)',
          }}
        >
          <h1 className="text-3xl tracking-tight text-foreground sm:text-4xl">
            A Place for Artists
          </h1>

          <div className="mt-8 grid grid-cols-4 gap-2 sm:gap-6">
            <div className="flex flex-col items-center gap-2">
              <Images className="h-7 w-7 text-accent-primary" strokeWidth={1.5} />
              <span className="text-xs sm:text-sm font-medium text-foreground">Portfolio</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <BadgeDollarSign className="h-7 w-7 text-accent-primary" strokeWidth={1.5} />
              <span className="text-xs sm:text-sm font-medium text-foreground">Sales</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Users className="h-7 w-7 text-accent-primary" strokeWidth={1.5} />
              <span className="text-xs sm:text-sm font-medium text-foreground">Community</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Search className="h-7 w-7 text-accent-primary" strokeWidth={1.5} />
              <span className="text-xs sm:text-sm font-medium text-foreground">Discovery</span>
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
    </section>
  )
}
