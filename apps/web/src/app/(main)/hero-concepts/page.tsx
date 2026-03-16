'use client'

/**
 * Temporary hero concept demo page — explore unconventional hero designs.
 * DELETE THIS PAGE before merging to dev.
 */

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CDN_DOMAINS } from '@/lib/env'

function getCdnBase(): string {
  return (CDN_DOMAINS || '').split(/\s+/)[0]
}

function cdnUrl(path: string) {
  const base = getCdnBase()
  return base ? `${base}/${path}` : `/${path}`
}

/* ─── Shared artwork data ─── */
const ARTWORKS = [
  { slug: 'elena-cordova', listing: 'arroyos-at-dusk', title: 'Arroyos at Dusk', artist: 'Elena Cordova', medium: 'Oil on canvas', price: '$2,400' },
  { slug: 'james-okafor', listing: 'sunday-table', title: 'Sunday Table', artist: 'James Okafor', medium: 'Acrylic on canvas', price: '$3,800' },
  { slug: 'elena-cordova', listing: 'red-earth-blue-shadow', title: 'Red Earth, Blue Shadow', artist: 'Elena Cordova', medium: 'Oil & natural pigment', price: '$1,950' },
  { slug: 'tomoko-ishida', listing: 'rain-on-glass-puget-sound', title: 'Rain on Glass, Puget Sound', artist: 'Tomoko Ishida', medium: 'Silver gelatin print', price: '$1,200' },
  { slug: 'elena-cordova', listing: 'chamisa-in-october', title: 'Chamisa in October', artist: 'Elena Cordova', medium: 'Oil on panel', price: '$1,600' },
  { slug: 'james-okafor', listing: 'corner-store', title: 'Corner Store', artist: 'James Okafor', medium: 'Acrylic on canvas', price: '$2,900' },
  { slug: 'tomoko-ishida', listing: 'three-vessels', title: 'Three Vessels', artist: 'Tomoko Ishida', medium: 'Stoneware ceramics', price: '$850' },
  { slug: 'elena-cordova', listing: 'acequia-study-no-3', title: 'Acequia Study No. 3', artist: 'Elena Cordova', medium: 'Oil on cradled panel', price: '$850' },
]

function artworkImageUrl(slug: string, listing: string) {
  return cdnUrl(`uploads/seed/artists/${slug}/listings/${listing}/front/800w.webp`)
}

/* ================================================================== */
/*  CONCEPT A: The Scrolling Gallery Wall                              */
/* ================================================================== */

function ConceptScrollingWall() {
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    let offset = 0
    let animFrame: number
    const speed = 0.5

    const animate = () => {
      offset += speed
      const halfWidth = track.scrollWidth / 2
      if (offset >= halfWidth) {
        offset = 0
      }
      track.style.transform = `translateX(-${offset}px)`
      animFrame = requestAnimationFrame(animate)
    }
    animFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animFrame)
  }, [])

  return (
    <section className="relative overflow-hidden" style={{ minHeight: '80vh' }}>
      {/* Scrolling artwork wall */}
      <div className="absolute inset-0 flex items-center overflow-hidden py-8">
        <div
          ref={trackRef}
          className="flex gap-3"
          style={{ willChange: 'transform' }}
        >
          {[...ARTWORKS, ...ARTWORKS].map((art, i) => (
            <div key={i} className="relative flex-shrink-0 w-64 md:w-80" style={{ height: '70vh' }}>
              <Image
                src={artworkImageUrl(art.slug, art.listing)}
                alt={art.title}
                width={400}
                height={500}
                unoptimized
                className="h-full w-full rounded-sm object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Frosted glass CTA overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="mx-6 max-w-lg rounded-xl border border-border/50 px-10 py-12 text-center shadow-2xl"
          style={{
            background: 'color-mix(in srgb, var(--background) 85%, transparent)',
            backdropFilter: 'blur(20px) saturate(1.2)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
          }}
        >
          <h1 className="text-4xl tracking-tight text-foreground sm:text-5xl">
            A better place
            <br />
            to show your work
          </h1>
          <p className="mt-4 text-lg text-muted-text">
            Stop selling in your DMs.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
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

/* ================================================================== */
/*  CONCEPT A2: Scrolling Wall — Slower & Shorter                      */
/* ================================================================== */

function ConceptScrollingWallSlow() {
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    let offset = 0
    let animFrame: number
    const speed = 0.2

    const animate = () => {
      offset += speed
      // Reset when we've scrolled past half (since content is duplicated)
      const halfWidth = track.scrollWidth / 2
      if (offset >= halfWidth) {
        offset = 0
      }
      track.style.transform = `translateX(-${offset}px)`
      animFrame = requestAnimationFrame(animate)
    }
    animFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animFrame)
  }, [])

  return (
    <section className="relative overflow-hidden" style={{ minHeight: '65vh' }}>
      {/* Scrolling artwork wall — uses translateX for smooth infinite scroll */}
      <div className="absolute inset-0 flex items-center overflow-hidden">
        <div
          ref={trackRef}
          className="flex gap-4 px-4"
          style={{ willChange: 'transform' }}
        >
          {[...ARTWORKS, ...ARTWORKS].map((art, i) => (
            <div key={i} className="relative flex-shrink-0 w-56 md:w-72" style={{ height: '55vh' }}>
              <Image
                src={artworkImageUrl(art.slug, art.listing)}
                alt={art.title}
                width={400}
                height={500}
                unoptimized
                className="h-full w-full rounded-sm object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Frosted glass CTA overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="mx-6 max-w-md rounded-xl border border-border/50 px-8 py-10 text-center shadow-2xl"
          style={{
            background: 'color-mix(in srgb, var(--background) 85%, transparent)',
            backdropFilter: 'blur(20px) saturate(1.2)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
          }}
        >
          <h1 className="text-3xl tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            A better place
            <br />
            to show your work
          </h1>
          <p className="mt-4 text-lg text-muted-text">
            Stop selling in your DMs.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
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

/* ================================================================== */
/*  CONCEPT B: The Portfolio Preview                                    */
/* ================================================================== */

function ConceptPortfolioPreview() {
  return (
    <section className="relative overflow-hidden bg-surface" style={{ minHeight: '80vh' }}>
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
          {/* Left: copy */}
          <div>
            <h1 className="text-4xl tracking-tight text-foreground sm:text-5xl">
              A better place
              <br />
              to show your work
            </h1>
            <p className="mt-4 text-lg text-muted-text">
              Stop selling in your DMs.
            </p>
            <p className="mt-6 text-base text-muted-text">
              Every artist gets a dedicated portfolio page &mdash; your own URL, your work presented
              gallery-quality, zero website building.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
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

          {/* Right: mini portfolio mockup */}
          <div className="relative">
            {/* Warm glow behind */}
            <div
              className="absolute -inset-4 -z-10 rounded-3xl opacity-20 blur-2xl"
              style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}
              aria-hidden="true"
            />

            <div className="overflow-hidden rounded-xl border border-border bg-background shadow-2xl">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 border-b border-border bg-surface/50 px-4 py-2.5">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--accent-secondary)', opacity: 0.4 }} />
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--accent-primary)', opacity: 0.3 }} />
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--accent-secondary)', opacity: 0.2 }} />
                </div>
                <div className="flex-1 rounded-md px-3 py-1" style={{ background: 'color-mix(in srgb, var(--accent-primary) 5%, var(--surface))' }}>
                  <p className="text-[11px] text-muted-text/60">surfaced.art/<span className="font-medium" style={{ color: 'var(--accent-primary)' }}>elena-cordova</span></p>
                </div>
              </div>

              {/* Portfolio content */}
              <div className="p-5">
                {/* Cover */}
                <div className="relative h-28 overflow-hidden rounded-lg">
                  <Image
                    src={cdnUrl('uploads/seed/artists/elena-cordova/cover/800w.webp')}
                    alt="Elena Cordova's studio"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>

                {/* Profile info */}
                <div className="-mt-6 ml-4 flex items-end gap-3">
                  <div className="relative h-14 w-14 overflow-hidden rounded-full border-[3px] shadow-sm" style={{ borderColor: 'var(--background)' }}>
                    <Image
                      src={cdnUrl('uploads/seed/artists/elena-cordova/profile/400w.webp')}
                      alt="Elena Cordova"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <div className="mb-1">
                    <p className="text-sm font-semibold text-foreground">Elena Cordova</p>
                    <p className="text-xs text-muted-text">Santa Fe, NM &middot; Painting</p>
                  </div>
                </div>

                {/* Artwork grid */}
                <div className="mt-5">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-text">Available Work</p>
                  <div className="grid grid-cols-3 gap-2">
                    {ARTWORKS.filter(a => a.slug === 'elena-cordova').slice(0, 3).map((art) => (
                      <div key={art.listing} className="relative aspect-square overflow-hidden rounded-sm">
                        <Image
                          src={artworkImageUrl(art.slug, art.listing)}
                          alt={art.title}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* "This could be yours" badge */}
            <div className="absolute -bottom-3 -right-3 rounded-full border border-accent-primary/30 bg-background px-4 py-2 text-sm font-medium shadow-lg"
              style={{ color: 'var(--accent-primary)' }}>
              This could be yours &rarr;
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ================================================================== */
/*  CONCEPT C: The Feed vs. The Gallery                                */
/* ================================================================== */

function ConceptFeedVsGallery() {
  const [showGallery, setShowGallery] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowGallery(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section className="relative overflow-hidden bg-background" style={{ minHeight: '80vh' }}>
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        {/* Headline centered above the comparison */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl tracking-tight text-foreground sm:text-5xl">
            A better place to show your work
          </h1>
          <p className="mt-4 text-lg text-muted-text">Stop selling in your DMs.</p>
        </div>

        {/* Side by side comparison */}
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
          {/* LEFT: The chaotic feed */}
          <div>
            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-muted-text">Now</p>
            <div className="relative overflow-hidden rounded-xl border border-border bg-white p-4 shadow-inner dark:bg-neutral-900"
              style={{ minHeight: 360 }}>
              {/* Fake Instagram-style interface */}
              <div className="space-y-3">
                {/* DM notification */}
                <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 dark:bg-red-950/30">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <p className="text-xs text-red-700 dark:text-red-300">23 unread DMs</p>
                </div>

                {/* A "sale" attempt in DMs */}
                <div className="rounded-lg border border-border/50 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-6 w-6 rounded-full bg-muted" />
                    <span className="text-xs font-medium">buyer_2847</span>
                    <span className="text-[10px] text-muted-text">3h ago</span>
                  </div>
                  <p className="text-xs text-foreground">&ldquo;hey is this still available? can u do $200 instead of $400?&rdquo;</p>
                </div>

                {/* Algorithm warning */}
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-950/30">
                  <p className="text-xs text-amber-700 dark:text-amber-300">Your reach is down 43% this week</p>
                </div>

                {/* Another DM */}
                <div className="rounded-lg border border-border/50 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-6 w-6 rounded-full bg-muted" />
                    <span className="text-xs font-medium">artlover_99</span>
                    <span className="text-[10px] text-muted-text">1d ago</span>
                  </div>
                  <p className="text-xs text-foreground">&ldquo;do you ship to canada? also whats the size? and can i pay venmo?&rdquo;</p>
                </div>

                {/* Ghost */}
                <div className="rounded-lg border border-border/50 p-3 opacity-50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-6 w-6 rounded-full bg-muted" />
                    <span className="text-xs font-medium">collector_vibes</span>
                    <span className="text-[10px] text-muted-text">5d ago</span>
                  </div>
                  <p className="text-xs text-foreground italic">&ldquo;I&apos;ll definitely buy this Friday!&rdquo;</p>
                  <p className="text-[10px] text-muted-text mt-1">Seen &middot; No reply</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: The gallery */}
          <div>
            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--accent-primary)' }}>With Surfaced Art</p>
            <div
              className="relative overflow-hidden rounded-xl border-2 bg-background p-4 shadow-lg transition-all duration-700"
              style={{
                minHeight: 360,
                borderColor: showGallery ? 'var(--accent-primary)' : 'var(--border)',
                opacity: showGallery ? 1 : 0.6,
                transform: showGallery ? 'scale(1)' : 'scale(0.98)',
              }}
            >
              {/* Clean gallery layout */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Elena Cordova</p>
                    <p className="text-xs text-muted-text">Santa Fe, NM</p>
                  </div>
                  <span className="rounded-full px-2.5 py-1 text-[10px] font-medium" style={{ background: 'color-mix(in srgb, var(--accent-primary) 10%, var(--background))', color: 'var(--accent-primary)' }}>
                    Vetted Artist
                  </span>
                </div>

                {/* Gallery grid */}
                <div className="grid grid-cols-2 gap-2">
                  {ARTWORKS.filter(a => a.slug === 'elena-cordova').slice(0, 4).map((art) => (
                    <div key={art.listing} className="group relative overflow-hidden rounded-sm">
                      <div className="relative aspect-square">
                        <Image
                          src={artworkImageUrl(art.slug, art.listing)}
                          alt={art.title}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                      <div className="mt-1.5">
                        <p className="text-xs font-medium text-foreground truncate">{art.title}</p>
                        <p className="text-[10px] text-muted-text">{art.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA below */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
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
    </section>
  )
}

/* ================================================================== */
/*  CONCEPT D: The Handwritten Invitation                              */
/* ================================================================== */

function ConceptHandwrittenInvitation() {
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 300)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section
      className="relative flex items-center justify-center overflow-hidden"
      style={{
        minHeight: '80vh',
        background: 'var(--surface)',
      }}
    >
      {/* Canvas texture */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage: `radial-gradient(circle, var(--border) 0.5px, transparent 0.5px)`,
          backgroundSize: '16px 16px',
          opacity: 0.3,
        }}
      />

      {/* Subtle watercolor blobs */}
      <div
        className="pointer-events-none absolute -left-[20%] -top-[10%] h-[600px] w-[600px] rounded-full blur-[150px]"
        style={{ background: 'var(--accent-primary)', opacity: 0.06 }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-[10%] -right-[20%] h-[500px] w-[500px] rounded-full blur-[120px]"
        style={{ background: 'var(--accent-secondary)', opacity: 0.05 }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-2xl px-6 py-24 text-center">
        <h1
          ref={headlineRef}
          className="text-5xl tracking-tight text-foreground transition-all duration-1000 ease-out sm:text-6xl lg:text-7xl"
          style={{
            opacity: revealed ? 1 : 0,
            transform: revealed ? 'translateY(0)' : 'translateY(20px)',
          }}
        >
          A better place
          <br />
          <span className="relative inline-block">
            to show your work
            {/* Hand-drawn underline */}
            <svg
              viewBox="0 0 200 12"
              preserveAspectRatio="none"
              className="absolute -bottom-2 left-0 h-2 w-full md:h-3"
              aria-hidden="true"
              style={{
                opacity: revealed ? 0.4 : 0,
                transition: 'opacity 0.8s ease-out 0.6s',
              }}
            >
              <path
                d="M2,8 C30,3 60,10 100,6 C140,2 170,9 198,5"
                fill="none"
                stroke="var(--accent-primary)"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </h1>

        <p
          className="mt-8 text-xl text-muted-text transition-all duration-700 ease-out"
          style={{
            opacity: revealed ? 1 : 0,
            transform: revealed ? 'translateY(0)' : 'translateY(12px)',
            transitionDelay: '0.4s',
          }}
        >
          Stop selling in your DMs.
        </p>

        <div
          className="mt-12 flex flex-wrap items-center justify-center gap-4 transition-all duration-700 ease-out"
          style={{
            opacity: revealed ? 1 : 0,
            transform: revealed ? 'translateY(0)' : 'translateY(12px)',
            transitionDelay: '0.7s',
          }}
        >
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
    </section>
  )
}

/* ================================================================== */
/*  CONCEPT E: Current (for comparison)                                */
/* ================================================================== */

function ConceptCurrent() {
  const image = cdnUrl('uploads/seed/artists/amara-osei/process/studio/1200w.webp')

  return (
    <section className="overflow-hidden">
      <div className="grid min-h-[60vh] grid-cols-1 lg:grid-cols-2">
        <div className="relative h-[35vh] lg:h-auto">
          <Image
            src={image}
            alt="Amara Osei working in her jewelry studio"
            fill
            unoptimized
            className="object-cover"
          />
        </div>
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

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */

export default function HeroConceptsPage() {
  return (
    <div className="-mt-8 space-y-0 md:-mt-12">
      {/* Nav */}
      <div className="sticky top-14 z-20 border-b border-border bg-background/95 backdrop-blur-sm md:top-16">
        <div className="mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-6 py-3">
          <span className="shrink-0 text-sm font-medium text-foreground">Hero Concepts</span>
          <div className="h-4 border-l border-border" />
          {['current', 'scrolling-wall', 'scrolling-wall-v2', 'portfolio-preview', 'feed-vs-gallery', 'handwritten'].map((id) => (
            <a
              key={id}
              href={`#${id}`}
              className="shrink-0 text-sm text-muted-text transition-colors hover:text-foreground"
            >
              {id.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}
            </a>
          ))}
        </div>
      </div>

      {/* Current (baseline) */}
      <div id="current" className="relative">
        <div className="absolute left-6 top-4 z-10 rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background shadow-lg">
          Current (baseline)
        </div>
        <ConceptCurrent />
      </div>

      {/* Divider */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-sm font-medium text-muted-text">New Concepts</span>
          <div className="h-px flex-1 bg-border" />
        </div>
      </div>

      {/* A: Scrolling Wall */}
      <div id="scrolling-wall" className="relative">
        <div className="absolute left-6 top-4 z-10 rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background shadow-lg">
          A: The Scrolling Wall
        </div>
        <ConceptScrollingWall />
      </div>

      <div className="h-px bg-border" />

      {/* A2: Scrolling Wall — Slower & Shorter */}
      <div id="scrolling-wall-v2" className="relative">
        <div className="absolute left-6 top-4 z-10 rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background shadow-lg">
          A2: Scrolling Wall — Slower &amp; Shorter
        </div>
        <ConceptScrollingWallSlow />
      </div>

      <div className="h-px bg-border" />

      {/* B: Portfolio Preview */}
      <div id="portfolio-preview" className="relative">
        <div className="absolute left-6 top-4 z-10 rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background shadow-lg">
          B: The Portfolio Preview
        </div>
        <ConceptPortfolioPreview />
      </div>

      <div className="h-px bg-border" />

      {/* C: Feed vs Gallery */}
      <div id="feed-vs-gallery" className="relative">
        <div className="absolute left-6 top-4 z-10 rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background shadow-lg">
          C: The Feed vs. The Gallery
        </div>
        <ConceptFeedVsGallery />
      </div>

      <div className="h-px bg-border" />

      {/* D: Handwritten Invitation */}
      <div id="handwritten" className="relative">
        <div className="absolute left-6 top-4 z-10 rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background shadow-lg">
          D: The Handwritten Invitation
        </div>
        <ConceptHandwrittenInvitation />
      </div>

      {/* Footer note */}
      <div className="mx-auto max-w-7xl px-6 py-12 text-center">
        <p className="text-sm italic text-muted-text">
          Temporary demo page &mdash; delete before merging. These concepts can be mixed and matched.
        </p>
      </div>
    </div>
  )
}
