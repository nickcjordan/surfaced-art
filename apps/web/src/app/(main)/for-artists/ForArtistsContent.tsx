'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { Container } from '@/components/ui/container'
import { CanvasDotOverlay } from '@/components/ui/canvas-texture'

/* ================================================================== */
/*  ANIMATION PRIMITIVES                                               */
/* ================================================================== */

function FadeIn({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      el.style.opacity = '1'
      el.style.transform = 'none'
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            el.style.transition = 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)'
            el.style.opacity = '1'
            el.style.transform = 'translateY(0)'
          }, delay)
          observer.unobserve(el)
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])
  return (
    <div ref={ref} className={className} style={{ opacity: 0, transform: 'translateY(24px)' }}>
      {children}
    </div>
  )
}

/* ================================================================== */
/*  DECORATIVE COMPONENTS                                              */
/* ================================================================== */

function WatercolorWash({ color1 = 'var(--accent-primary)', color2 = 'var(--accent-secondary)', opacity1 = 0.06, opacity2 = 0.04 }: { color1?: string; color2?: string; opacity1?: number; opacity2?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="absolute h-[600px] w-[600px] rounded-full blur-[120px] md:h-[800px] md:w-[800px]" style={{ background: color1, opacity: opacity1, top: '-10%', right: '-15%' }} />
      <div className="absolute h-[500px] w-[500px] rounded-full blur-[100px] md:h-[700px] md:w-[700px]" style={{ background: color2, opacity: opacity2, bottom: '-10%', left: '-15%' }} />
    </div>
  )
}

/* FloatingAccents removed — tiny dots/dashes looked like artifacts */

function OutlinedBlob({ className = '', color = 'var(--accent-primary)', variant = 0 }: { className?: string; color?: string; variant?: number }) {
  const paths = [
    'M44.5,-62.3C55.9,-53.1,62.2,-37.5,66.8,-21.4C71.4,-5.3,74.2,11.3,68.7,24.5C63.2,37.7,49.4,47.5,35.5,55.3C21.6,63.1,7.7,68.9,-7.4,68.4C-22.5,67.9,-38.8,61.1,-50.4,50.1C-62,39.1,-68.9,23.9,-70.5,8.1C-72.1,-7.7,-68.4,-24.1,-59.2,-35.5C-50,-46.9,-35.3,-53.3,-21.2,-61.1C-7.1,-68.9,6.4,-78.1,19.9,-76.7C33.4,-75.3,33.1,-71.5,44.5,-62.3Z',
    'M42.1,-55.8C52.8,-48.6,58.8,-33.7,62.6,-18.3C66.4,-2.9,68,12.9,62.3,25.7C56.6,38.5,43.6,48.3,29.8,54.7C16,61.1,1.4,64.1,-14.3,62.8C-30,61.5,-46.8,55.9,-56.8,44.5C-66.8,33.1,-70,15.9,-68.1,0C-66.2,-15.9,-59.2,-30.7,-48.3,-40.5C-37.4,-50.3,-22.6,-55.1,-7.5,-56.6C7.6,-58.1,31.4,-63,42.1,-55.8Z',
  ]
  return (
    <div className={`pointer-events-none absolute ${className}`} aria-hidden="true">
      <svg viewBox="-80 -80 160 160" className="h-full w-full">
        <path d={paths[variant % paths.length]} fill="none" stroke={color} strokeWidth="0.5" opacity="0.08" />
      </svg>
    </div>
  )
}

const MORPHING_BLOB_PATHS = [
  'M44.5,-62.3C55.9,-53.1,62.2,-37.5,66.8,-21.4C71.4,-5.3,74.2,11.3,68.7,24.5C63.2,37.7,49.4,47.5,35.5,55.3C21.6,63.1,7.7,68.9,-7.4,68.4C-22.5,67.9,-38.8,61.1,-50.4,50.1C-62,39.1,-68.9,23.9,-70.5,8.1C-72.1,-7.7,-68.4,-24.1,-59.2,-35.5C-50,-46.9,-35.3,-53.3,-21.2,-61.1C-7.1,-68.9,6.4,-78.1,19.9,-76.7C33.4,-75.3,33.1,-71.5,44.5,-62.3Z',
  'M38.9,-51.5C49.5,-44.3,56.5,-31.5,61.1,-17.4C65.7,-3.3,67.9,12.1,62.4,24.1C56.9,36.1,43.7,44.7,30.2,51.4C16.7,58.1,2.9,62.9,-12.1,62.5C-27.1,62.1,-43.3,56.5,-53.1,45.5C-62.9,34.5,-66.3,18.1,-65.4,2.3C-64.5,-13.5,-59.3,-28.7,-49.3,-38.5C-39.3,-48.3,-24.5,-52.7,-10.1,-55.5C4.3,-58.3,28.3,-58.7,38.9,-51.5Z',
  'M42.1,-55.8C52.8,-48.6,58.8,-33.7,62.6,-18.3C66.4,-2.9,68,12.9,62.3,25.7C56.6,38.5,43.6,48.3,29.8,54.7C16,61.1,1.4,64.1,-14.3,62.8C-30,61.5,-46.8,55.9,-56.8,44.5C-66.8,33.1,-70,15.9,-68.1,0C-66.2,-15.9,-59.2,-30.7,-48.3,-40.5C-37.4,-50.3,-22.6,-55.1,-7.5,-56.6C7.6,-58.1,31.4,-63,42.1,-55.8Z',
]

function MorphingBlob({ className = '', color = 'var(--accent-primary)' }: { className?: string; color?: string }) {
  const ref = useRef<SVGPathElement>(null)
  useEffect(() => {
    const path = ref.current
    if (!path) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return
    const onScroll = () => {
      const scrollY = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? scrollY / docHeight : 0
      const index = Math.min(Math.floor(progress * (MORPHING_BLOB_PATHS.length - 1)), MORPHING_BLOB_PATHS.length - 1)
      path.setAttribute('d', MORPHING_BLOB_PATHS[index])
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div className={`pointer-events-none absolute ${className}`} aria-hidden="true">
      <svg viewBox="-80 -80 160 160" className="h-full w-full">
        <path ref={ref} d={MORPHING_BLOB_PATHS[0]} fill={color} opacity="0.07" className="transition-[d] duration-[2s] ease-in-out" />
      </svg>
    </div>
  )
}

function BrushstrokeDivider({ flip = false, color = 'var(--accent-primary)', className = '', opacity = 1 }: { flip?: boolean; color?: string; className?: string; opacity?: number }) {
  return (
    <div className={`pointer-events-none w-full overflow-hidden leading-[0] ${flip ? 'rotate-180' : ''} ${className}`} aria-hidden="true">
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="block h-8 w-full md:h-12 lg:h-14">
        <path d="M0,30 C120,45 200,15 360,28 C520,41 580,10 720,25 C860,40 950,12 1080,30 C1210,48 1320,18 1440,32 L1440,60 L0,60 Z" fill={color} opacity={0.08 * opacity} />
        <path d="M0,35 C180,50 280,20 440,33 C600,46 700,15 860,30 C1020,45 1150,20 1440,38 L1440,60 L0,60 Z" fill={color} opacity={0.05 * opacity} />
      </svg>
    </div>
  )
}

function HandwrittenUnderline({ color = 'var(--accent-primary)' }: { color?: string }) {
  const ref = useRef<SVGSVGElement>(null)
  useEffect(() => {
    const svg = ref.current
    if (!svg) return
    const path = svg.querySelector('path')
    if (!path) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const length = path.getTotalLength()
    path.style.strokeDasharray = `${length}`
    if (prefersReduced) { path.style.strokeDashoffset = '0'; return }
    path.style.strokeDashoffset = `${length}`
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          path.style.transition = 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s'
          path.style.strokeDashoffset = '0'
          observer.unobserve(svg)
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(svg)
    return () => observer.disconnect()
  }, [])
  return (
    <svg ref={ref} viewBox="0 0 200 12" preserveAspectRatio="none" className="absolute bottom-0 left-0 h-2 w-full md:h-3" aria-hidden="true">
      <path d="M2,8 C30,3 60,10 100,6 C140,2 170,9 198,5" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.4" />
    </svg>
  )
}

/* Shimmer gradient text: animated flowing gradient for accented headings */
function ShimmerText({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`bg-clip-text text-transparent motion-safe:animate-[text-shimmer_6s_ease_infinite] ${className}`}
      style={{
        backgroundImage: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 30%, var(--accent-primary) 50%, var(--accent-secondary) 70%, var(--accent-primary) 100%)',
        backgroundSize: '300% 100%',
      }}
    >
      {children}
    </span>
  )
}

function HighlightMarker({ children, color = 'var(--accent-primary)' }: { children: ReactNode; color?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      // Use rAF to avoid synchronous setState in effect
      requestAnimationFrame(() => setWidth(100))
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const start = performance.now()
          const animate = (now: number) => {
            const elapsed = now - start
            const progress = Math.min(elapsed / 600, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setWidth(eased * 100)
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
          observer.unobserve(el)
        }
      },
      { threshold: 0.8 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return (
    <span ref={ref} className="relative inline">
      <span
        className="absolute inset-x-0 -z-10 rounded-sm"
        style={{ background: color, opacity: 0.15, width: `${width}%`, top: '50%', height: '0.75em', transform: 'translateY(-45%)' }}
        aria-hidden="true"
      />
      {children}
    </span>
  )
}

function LivingPalette({ className = '' }: { className?: string }) {
  const blobs = [
    { color: 'var(--accent-primary)', size: 64, path: 'M32,6C42,6,54,14,56,26C58,38,50,54,38,58C26,62,10,54,6,42C2,30,8,14,20,8C26,5,28,6,32,6Z' },
    { color: 'var(--accent-secondary)', size: 56, path: 'M28,4C38,2,50,10,54,22C58,34,52,50,40,54C28,58,12,50,6,38C0,26,6,14,16,8C20,5,24,4,28,4Z' },
    { color: 'color-mix(in srgb, var(--accent-primary) 60%, var(--foreground))', size: 44, path: 'M22,4C30,2,40,8,44,18C48,28,44,42,34,46C24,50,10,44,5,34C0,24,4,12,12,6C16,3,18,4,22,4Z' },
    { color: 'color-mix(in srgb, var(--accent-secondary) 40%, var(--background))', size: 56, path: 'M30,4C40,4,52,12,55,24C58,36,48,52,36,56C24,60,8,52,4,40C0,28,10,12,22,6C26,4,28,4,30,4Z' },
    { color: 'color-mix(in srgb, var(--accent-primary) 30%, var(--accent-secondary))', size: 48, path: 'M24,3C34,1,46,10,48,22C50,34,42,48,30,50C18,52,4,42,2,30C0,18,8,8,16,4C20,2,22,3,24,3Z' },
  ]
  return (
    <div className={`flex items-center gap-2 md:gap-3 ${className}`} aria-hidden="true">
      {blobs.map((blob, i) => (
        <svg
          key={i}
          width={blob.size}
          height={blob.size}
          viewBox={`-4 -4 ${blob.size + 8} ${blob.size + 8}`}
          className="md:scale-110"
          style={{ opacity: 0.7, animation: `breathe ${4 + i * 0.8}s ease-in-out infinite`, animationDelay: `${i * 0.5}s` }}
        >
          <path d={blob.path} fill={blob.color} />
        </svg>
      ))}
    </div>
  )
}

/* Small organic blob for use as bullet markers / step indicators */
const BLOB_PATHS = [
  'M32,6C42,6,54,14,56,26C58,38,50,54,38,58C26,62,10,54,6,42C2,30,8,14,20,8C26,5,28,6,32,6Z',
  'M28,4C38,2,50,10,54,22C58,34,52,50,40,54C28,58,12,50,6,38C0,26,6,14,16,8C20,5,24,4,28,4Z',
  'M30,5C40,3,52,12,56,24C60,36,54,50,42,56C30,60,14,54,6,42C0,30,4,14,16,7C22,4,26,5,30,5Z',
  'M30,4C40,4,52,12,55,24C58,36,48,52,36,56C24,60,8,52,4,40C0,28,10,12,22,6C26,4,28,4,30,4Z',
]

function BlobMarker({ size = 24, color = 'var(--accent-primary)', index = 0, children, className = '' }: { size?: number; color?: string; index?: number; children?: ReactNode; className?: string }) {
  const path = BLOB_PATHS[index % BLOB_PATHS.length]
  return (
    <div className={`relative inline-flex flex-shrink-0 items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 62 62" className="absolute inset-0" aria-hidden="true">
        <path d={path} fill={color} />
      </svg>
      {children && (
        <span className="relative z-10 text-center font-serif font-medium leading-none" style={{ fontSize: size * 0.38 }}>
          {children}
        </span>
      )}
    </div>
  )
}

/* ================================================================== */
/*  INTERACTIVE COMPONENTS                                             */
/* ================================================================== */

function HorizontalTimeline() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [fillProgress, setFillProgress] = useState(0)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onScroll = () => {
      const rect = el.getBoundingClientRect()
      const viewportH = window.innerHeight
      const start = viewportH * 0.8
      const end = viewportH * 0.2
      const progress = Math.max(0, Math.min(1, (start - rect.top) / (start - end)))
      setFillProgress(progress)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const steps = [
    { num: '1', title: 'Apply', desc: 'Show us what you make and how you make it' },
    { num: '2', title: 'Get reviewed', desc: 'A real person looks at your work, not an algorithm' },
    { num: '3', title: 'Set up your page', desc: 'Photos, bio, pricing. About 20 minutes' },
    { num: '4', title: 'Start selling', desc: 'Share your link and let the gallery do the rest' },
  ]

  return (
    <div ref={containerRef} className="mx-auto max-w-4xl">
      <div className="hidden md:block">
        <div className="relative">
          <div className="absolute left-0 right-0 top-5 h-0.5" style={{ background: 'var(--border)' }} />
          <div className="absolute left-0 top-5 h-0.5 transition-[width] duration-100" style={{ width: `${fillProgress * 100}%`, background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))' }} />
          <div className="relative grid grid-cols-4 gap-4">
            {steps.map((step, i) => {
              const isActive = fillProgress >= i / (steps.length - 1) - 0.05
              return (
                <div key={step.num} className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center transition-transform duration-500" style={{ transform: isActive ? 'scale(1.15)' : 'scale(1)' }}>
                    <BlobMarker
                      size={56}
                      index={i}
                      color={isActive ? 'var(--accent-primary)' : 'var(--border)'}
                    >
                      <span style={{ color: isActive ? 'var(--primary-foreground)' : 'var(--muted)' }}>{step.num}</span>
                    </BlobMarker>
                  </div>
                  <p className="font-serif text-base transition-colors duration-500" style={{ color: isActive ? 'var(--foreground)' : 'var(--muted)' }}>{step.title}</p>
                  <p className="text-body-small mt-1 transition-colors duration-500" style={{ color: isActive ? 'var(--muted)' : 'color-mix(in srgb, var(--muted) 50%, var(--background))' }}>{step.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div className="space-y-8 md:hidden">
        {steps.map((step, i) => (
          <FadeIn key={step.num} delay={i * 80}>
            <div className="flex gap-5">
              <BlobMarker size={56} index={i} color="var(--accent-primary)">
                <span style={{ color: 'var(--primary-foreground)' }}>{step.num}</span>
              </BlobMarker>
              <div className="pt-0.5">
                <p className="font-serif text-lg text-foreground">{step.title}</p>
                <p className="text-body-default mt-1 text-muted-text">{step.desc}</p>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  )
}

/* Card fan: overlapping roadmap cards */
function CardFan({ cards }: { cards: { icon: 'analytics' | 'venue' | 'commission' | 'discovery' | 'more'; title: string; desc: string }[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const rotations = [-4, -2, 0, 2, 4]
  const offsets = [-10, -5, 0, 5, 10]
  return (
    <div className="relative mx-auto flex max-w-3xl items-center justify-center py-8">
      {cards.map((card, i) => {
        const isHovered = hoveredIndex === i
        const rotation = isHovered ? 0 : rotations[i]
        const xOffset = isHovered ? 0 : offsets[i]
        const zIndex = isHovered ? 50 : 10 + i
        return (
          <div
            key={card.title}
            className="w-64 flex-shrink-0 cursor-default transition-all duration-300 ease-out first:ml-0 md:-ml-12 md:w-72"
            style={{ transform: `rotate(${rotation}deg) translateX(${xOffset}px) ${isHovered ? 'translateY(-12px) scale(1.05)' : ''}`, zIndex }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div
              className="rounded-lg border bg-background p-5 shadow-sm transition-shadow duration-300"
              style={{
                borderColor: isHovered ? 'color-mix(in srgb, var(--accent-primary) 40%, var(--border))' : 'var(--border)',
                boxShadow: isHovered ? '0 12px 32px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: 'color-mix(in srgb, var(--accent-primary) 10%, var(--background))' }}>
                  <RoadmapIcon type={card.icon} />
                </div>
                <div>
                  <p className="font-serif text-base text-foreground">{card.title}</p>
                  <p className="text-body-small mt-1.5 text-muted-text">{card.desc}</p>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function RoadmapIcon({ type }: { type: 'analytics' | 'venue' | 'commission' | 'discovery' | 'more' }) {
  const m = {
    analytics: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="14" width="4" height="7" rx="1" fill="var(--accent-primary)" opacity="0.5" /><rect x="10" y="9" width="4" height="12" rx="1" fill="var(--accent-primary)" opacity="0.7" /><rect x="17" y="4" width="4" height="17" rx="1" fill="var(--accent-primary)" /></svg>),
    venue: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="6" cy="12" r="3" fill="var(--accent-secondary)" opacity="0.6" /><circle cx="18" cy="12" r="3" fill="var(--accent-secondary)" opacity="0.6" /><circle cx="12" cy="6" r="3" fill="var(--accent-secondary)" /><line x1="8.5" y1="10.5" x2="10.5" y2="8" stroke="var(--accent-secondary)" strokeWidth="1.5" opacity="0.4" /><line x1="15.5" y1="10.5" x2="13.5" y2="8" stroke="var(--accent-secondary)" strokeWidth="1.5" opacity="0.4" /></svg>),
    commission: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 8h12a2 2 0 012 2v8a2 2 0 01-2 2H4" stroke="var(--accent-primary)" strokeWidth="1.5" opacity="0.5" /><path d="M8 4h12a2 2 0 012 2v8a2 2 0 01-2 2H8" stroke="var(--accent-primary)" strokeWidth="1.5" /><circle cx="14" cy="10" r="2" fill="var(--accent-primary)" opacity="0.6" /></svg>),
    discovery: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="6" stroke="var(--accent-secondary)" strokeWidth="2" /><line x1="14.5" y1="14.5" x2="20" y2="20" stroke="var(--accent-secondary)" strokeWidth="2" strokeLinecap="round" /><circle cx="10" cy="10" r="2" fill="var(--accent-secondary)" opacity="0.3" /></svg>),
    more: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="6" cy="12" r="2" fill="var(--accent-primary)" opacity="0.5" /><circle cx="12" cy="12" r="2" fill="var(--accent-primary)" opacity="0.7" /><circle cx="18" cy="12" r="2" fill="var(--accent-primary)" /></svg>),
  }
  return m[type]
}

/* Depictive icons for the "On Your Own" section */
function PainPointIcon({ type }: { type: 'dms' | 'website' | 'invisible' | 'trust' }) {
  const icons = {
    dms: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        {/* Overlapping chat bubbles = juggling messages */}
        <rect x="2" y="6" width="16" height="12" rx="3" fill="var(--foreground)" opacity="0.08" />
        <rect x="14" y="12" width="16" height="12" rx="3" fill="var(--foreground)" opacity="0.12" />
        <rect x="8" y="2" width="14" height="10" rx="3" fill="var(--foreground)" opacity="0.06" />
        <path d="M6 18l-2 4 4-2" fill="var(--foreground)" opacity="0.08" />
        <path d="M26 24l2 4-4-2" fill="var(--foreground)" opacity="0.12" />
      </svg>
    ),
    website: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        {/* Browser window with broken/incomplete content */}
        <rect x="3" y="5" width="26" height="22" rx="3" stroke="var(--foreground)" strokeWidth="1.5" opacity="0.15" />
        <line x1="3" y1="11" x2="29" y2="11" stroke="var(--foreground)" strokeWidth="1" opacity="0.1" />
        <circle cx="7" cy="8" r="1" fill="var(--foreground)" opacity="0.12" />
        <circle cx="10.5" cy="8" r="1" fill="var(--foreground)" opacity="0.12" />
        <circle cx="14" cy="8" r="1" fill="var(--foreground)" opacity="0.12" />
        <rect x="7" y="15" width="18" height="2" rx="1" fill="var(--foreground)" opacity="0.06" />
        <rect x="7" y="19" width="12" height="2" rx="1" fill="var(--foreground)" opacity="0.06" />
        <line x1="20" y1="14" x2="26" y2="26" stroke="var(--foreground)" strokeWidth="1" opacity="0.08" strokeDasharray="2 2" />
      </svg>
    ),
    invisible: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        {/* Eye with a line through it = not seen */}
        <ellipse cx="16" cy="16" rx="10" ry="7" stroke="var(--foreground)" strokeWidth="1.5" opacity="0.12" />
        <circle cx="16" cy="16" r="3" fill="var(--foreground)" opacity="0.1" />
        <line x1="6" y1="26" x2="26" y2="6" stroke="var(--foreground)" strokeWidth="1.5" opacity="0.15" strokeLinecap="round" />
      </svg>
    ),
    trust: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        {/* Question mark in a shield outline = no credibility */}
        <path d="M16 3L5 8v8c0 7.5 4.7 12.5 11 15 6.3-2.5 11-7.5 11-15V8L16 3z" stroke="var(--foreground)" strokeWidth="1.5" opacity="0.1" fill="none" />
        <text x="16" y="20" textAnchor="middle" fontSize="13" fontFamily="var(--active-font-serif)" fill="var(--foreground)" opacity="0.15">?</text>
      </svg>
    ),
  }
  return icons[type]
}

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */

export default function ForArtistsContent() {
  return (
    <div className="-mt-8 md:-mt-12">

      {/* ============================================================ */}
      {/*  HERO                                                        */}
      {/* ============================================================ */}
      <section id="v14-hero" data-testid="for-artists-hero" className="full-bleed overflow-hidden relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'var(--surface)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(155deg, var(--surface) 50%, color-mix(in srgb, var(--accent-primary) 5%, var(--surface)) 50%)' }} />
        <CanvasDotOverlay />
        <WatercolorWash opacity1={0.08} opacity2={0.06} />

        <MorphingBlob className="absolute -right-16 bottom-4 h-80 w-80 md:-right-8 md:bottom-0 md:h-[28rem] md:w-[28rem]" color="var(--accent-primary)" />
        <MorphingBlob className="absolute -left-20 -top-16 h-72 w-72 md:h-96 md:w-96" color="var(--accent-secondary)" />

        <div
          className="relative h-1 w-full motion-safe:animate-[gradient-shift_6s_ease_infinite]"
          style={{ background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary), var(--accent-primary))', backgroundSize: '200% 100%' }}
        />

        <Container className="relative py-20 md:py-28 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <FadeIn>
              <p className="text-body-small mb-4 font-medium uppercase tracking-widest" style={{ color: 'var(--accent-primary)' }}>
                For Artists
              </p>
            </FadeIn>

            <FadeIn delay={100}>
              <h1 className="text-foreground">
                The platform <ShimmerText>built for artists</ShimmerText>
              </h1>
            </FadeIn>

            <FadeIn delay={300}>
              <p className="text-body-large mx-auto mt-6 max-w-xl text-muted-text">
                Every other profession has a platform that takes it seriously.
              </p>
              <p className="text-body-large mx-auto mt-2 max-w-xl font-medium text-foreground">
                Now you do too!
              </p>

              <div className="mt-8 flex justify-center">
                <LivingPalette />
              </div>

              <div className="mt-10">
                <Link
                  href="/apply"
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-10 py-4 text-lg font-medium tracking-wide text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.05] active:scale-[0.97] motion-safe:animate-[btn-shimmer_3s_ease_infinite]"
                  style={{
                    backgroundImage: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 20%, color-mix(in srgb, var(--accent-primary) 70%, #fff) 40%, var(--accent-secondary) 60%, var(--accent-primary) 80%, var(--accent-secondary) 100%)',
                    backgroundSize: '400% 100%',
                  }}
                >
                  <span className="relative z-10">Apply to Join</span>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="relative z-10 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
                    <path d="M4 10h12m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>
            </FadeIn>
          </div>
        </Container>

        {/* Fade-out bottom edge */}
        <div className="full-bleed pointer-events-none relative h-24 md:h-32" aria-hidden="true" style={{ background: 'linear-gradient(to bottom, transparent, var(--background))' }} />
      </section>

      {/* ============================================================ */}
      {/*  SECTION 1: Artist Studio                                    */}
      {/* ============================================================ */}
      <section id="v14-profile" data-testid="for-artists-profile" className="full-bleed relative overflow-hidden py-16 md:py-24">
        <CanvasDotOverlay />
        <OutlinedBlob className="absolute -left-[18rem] top-8 h-[36rem] w-[36rem] md:-left-[20rem] md:h-[44rem] md:w-[44rem]" color="var(--accent-secondary)" variant={0} />

        <Container>
          {/* Section header */}
          <FadeIn>
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-body-small mb-3 font-medium uppercase tracking-widest" style={{ color: 'var(--accent-secondary)' }}>Your Artist Studio</p>
              <h2 className="text-foreground">
                A website for your art.{' '}
                <span className="relative inline-block"><ShimmerText>No building required</ShimmerText><HandwrittenUnderline color="var(--accent-secondary)" /></span>
              </h2>
              <p className="text-body-default mx-auto mt-5 max-w-2xl text-muted-text">
                Your studio page is a standalone website dedicated entirely to you and your work. No ads, no links to other artists, no distractions. Just your name and your art.
              </p>
            </div>
          </FadeIn>

          {/* Studio mockup with integrated feature points */}
          <div className="mx-auto mt-14 max-w-5xl">
            <FadeIn delay={150}>
              <div className="grid items-start gap-8 lg:grid-cols-[1fr_auto_1fr]">

                {/* Left feature column */}
                <div className="hidden flex-col justify-center gap-6 pt-16 lg:flex">
                  {[
                    { title: 'Your clean URL', desc: 'surfacedart.com/your-name. A short, memorable link that goes straight to your studio', accent: 'var(--accent-primary)' },
                    { title: 'Replace your website', desc: 'Bio, CV, artist statement, process photos. Everything a custom site would have, zero maintenance', accent: 'var(--accent-secondary)' },
                    { title: 'Pure showcase', desc: 'Your studio presents your work without prices or checkout. Visitors who want to buy click through to the listing', accent: 'var(--accent-primary)' },
                  ].map((item, i) => (
                    <div key={item.title} className="text-right">
                      <div className="inline-flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <div className="h-2 w-2 rounded-full" style={{ background: item.accent, opacity: 0.6 }} />
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-text">{item.desc}</p>
                      {i < 2 && <div className="ml-auto mt-4 h-px w-12" style={{ background: item.accent, opacity: 0.15 }} />}
                    </div>
                  ))}
                </div>

                {/* Center: the mockup (screenshot placeholder) */}
                <div className="relative mx-auto w-full max-w-sm lg:mx-0">
                  {/* Warm glow */}
                  <div className="absolute -inset-4 -z-10 rounded-3xl opacity-20 blur-2xl" style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }} aria-hidden="true" />

                  <div className="overflow-hidden rounded-xl border border-border bg-background shadow-xl">
                    {/* Browser bar */}
                    <div className="flex items-center gap-2 border-b border-border bg-surface/50 px-4 py-2.5">
                      <div className="flex gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--accent-secondary)', opacity: 0.4 }} />
                        <div className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--accent-primary)', opacity: 0.3 }} />
                        <div className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--accent-secondary)', opacity: 0.2 }} />
                      </div>
                      <div className="flex-1 rounded-md px-3 py-1" style={{ background: 'color-mix(in srgb, var(--accent-primary) 5%, var(--surface))' }}>
                        <p className="text-[11px] text-muted-text/60">surfacedart.com/<span className="font-medium" style={{ color: 'var(--accent-primary)' }}>sarah-chen</span></p>
                      </div>
                    </div>
                    <div className="p-6">
                      {/* Cover + avatar */}
                      <div>
                        <div className="h-24 rounded-lg" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent-primary) 15%, var(--surface)), color-mix(in srgb, var(--accent-secondary) 12%, var(--surface)))' }} />
                        <div className="-mt-8 ml-5 flex items-end gap-3">
                          <div className="h-16 w-16 rounded-full border-[3px] shadow-sm" style={{ borderColor: 'var(--background)', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }} />
                          <div className="mb-2">
                            <p className="text-sm font-semibold text-foreground">Sarah Chen</p>
                            <p className="text-xs text-muted-text/60">Ceramics &middot; Portland, OR</p>
                          </div>
                        </div>
                      </div>
                      {/* Bio lines */}
                      <div className="mt-4 space-y-1.5 px-1">
                        <div className="h-2 w-full rounded-full" style={{ background: 'color-mix(in srgb, var(--foreground) 7%, var(--surface))' }} />
                        <div className="h-2 w-3/4 rounded-full" style={{ background: 'color-mix(in srgb, var(--foreground) 7%, var(--surface))' }} />
                      </div>
                      {/* Nav tabs */}
                      <div className="mt-4">
                        <div className="flex gap-4 border-b border-border px-1 pb-2">
                          <p className="text-[11px] font-medium" style={{ color: 'var(--accent-primary)' }}>Work</p>
                          <p className="text-[11px] text-muted-text/40">Process</p>
                          <p className="text-[11px] text-muted-text/40">CV</p>
                          <p className="text-[11px] text-muted-text/40">About</p>
                        </div>
                      </div>
                      {/* Gallery grid */}
                      <div className="mt-3">
                        <div className="grid grid-cols-3 gap-2">
                          {[22, 14, 18, 16, 20, 12].map((mix, i) => (
                            <div key={i} className="aspect-[4/5] rounded-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md" style={{ background: `color-mix(in srgb, var(--accent-${i % 2 === 0 ? 'primary' : 'secondary'}) ${mix}%, var(--surface))` }} />
                          ))}
                        </div>
                      </div>
                      {/* Social links */}
                      <div className="mt-3">
                        <div className="flex gap-2">
                          {['Instagram', 'Website'].map((label) => (
                            <div key={label} className="rounded-full px-3 py-1" style={{ background: 'color-mix(in srgb, var(--accent-primary) 8%, var(--surface))' }}>
                              <p className="text-[10px]" style={{ color: 'var(--accent-primary)' }}>{label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Empty space — the point */}
                      <div className="mt-6 rounded-lg border border-dashed p-4 text-center" style={{ borderColor: 'color-mix(in srgb, var(--accent-primary) 20%, var(--border))' }}>
                        <p className="text-xs font-medium" style={{ color: 'var(--accent-primary)' }}>No ads. No competitor links. No distractions.</p>
                        <p className="mt-0.5 text-[11px] text-muted-text/50">This space intentionally left empty</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right feature column */}
                <div className="hidden flex-col justify-center gap-6 pt-16 lg:flex">
                  {[
                    { title: 'Sold work stays visible', desc: 'Pieces that sell move to your archive, building a portfolio of everything you\'ve made', accent: 'var(--accent-secondary)' },
                    { title: 'Always up to date', desc: 'Add a new piece from your dashboard and it appears on your studio page instantly', accent: 'var(--accent-primary)' },
                    { title: 'SEO that works for you', desc: 'Your studio page is optimized so people searching for your kind of work can find it', accent: 'var(--accent-secondary)' },
                  ].map((item, i) => (
                    <div key={item.title}>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ background: item.accent, opacity: 0.6 }} />
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-text">{item.desc}</p>
                      {i < 2 && <div className="mt-4 h-px w-12" style={{ background: item.accent, opacity: 0.15 }} />}
                    </div>
                  ))}
                </div>

                {/* Mobile: feature list (stacked below mockup) */}
                <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
                  {[
                    { title: 'Your clean URL', desc: 'A memorable link you can share anywhere' },
                    { title: 'Replace your website', desc: 'Bio, CV, process photos. Zero maintenance' },
                    { title: 'Pure showcase', desc: 'No prices, no checkout on your studio page' },
                    { title: 'Sold work stays visible', desc: 'Archive builds your full portfolio' },
                    { title: 'Always up to date', desc: 'New pieces appear on your page instantly' },
                    { title: 'SEO that works for you', desc: 'Optimized so collectors can find your work' },
                  ].map((item) => (
                    <div key={item.title} className="rounded-lg p-4" style={{ background: 'color-mix(in srgb, var(--accent-primary) 5%, var(--surface))' }}>
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="mt-1 text-xs text-muted-text">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* Our commitment */}
            <FadeIn delay={300}>
              <div className="mx-auto mt-12 max-w-xl rounded-lg p-5" style={{ background: 'color-mix(in srgb, var(--accent-primary) 5%, var(--surface))' }}>
                <p className="text-center text-sm text-muted-text">
                  <span className="font-medium text-foreground">Our commitment:</span> Your studio page will never show ads, never recommend other artists, and never do anything to pull focus from your work. It&apos;s your space.
                </p>
              </div>
            </FadeIn>
          </div>
        </Container>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 2: Curated                                          */}
      {/* ============================================================ */}
      <div className="full-bleed relative z-10 -mb-1">
        <BrushstrokeDivider color="var(--surface)" opacity={10} />
      </div>
      <section id="v14-curated" className="full-bleed relative overflow-hidden" style={{ background: 'var(--surface)' }}>
        <CanvasDotOverlay />
        <div className="relative overflow-hidden py-24 md:py-32">
          <WatercolorWash opacity1={0.05} opacity2={0.04} />
          <MorphingBlob className="absolute -right-24 top-0 h-96 w-96" color="var(--accent-primary)" />
          <Container className="relative">
          <FadeIn>
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-body-small mb-3 font-medium uppercase tracking-widest" style={{ color: 'var(--accent-primary)' }}>Curated Gallery</p>
              <h2 className="text-foreground">
                Every artist here was chosen
              </h2>
              <p className="text-body-default mx-auto mt-6 max-w-xl text-muted-text">
                Every application is reviewed by hand. When you&apos;re accepted, you join a community of{' '}
                <HighlightMarker color="var(--accent-secondary)">working artists</HighlightMarker> who make things with their hands.
              </p>
            </div>
          </FadeIn>
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
            {[
              { label: 'Handmade only', detail: 'No AI art, no print-on-demand, no resellers: every application is reviewed for authenticity' },
              { label: 'Reviewed by people', detail: 'A real curatorial team reads your application and looks at your work, your process, and your story' },
            ].map((card, i) => (
              <FadeIn key={card.label} delay={i * 100}>
                <div className="rounded-lg border border-border bg-background/90 p-6 backdrop-blur-sm">
                  <p className="font-serif text-lg text-foreground">{card.label}</p>
                  <p className="text-body-small mt-2 text-muted-text">{card.detail}</p>
                </div>
              </FadeIn>
            ))}
          </div>
          </Container>
        </div>
      </section>
      <div className="full-bleed relative z-10 -mt-1">
        <BrushstrokeDivider flip color="var(--surface)" opacity={10} />
      </div>

      {/* ============================================================ */}
      {/*  SECTION 3: Comparison                                       */}
      {/* ============================================================ */}
      <section id="v14-comparison" className="full-bleed relative overflow-hidden py-16 md:py-24">
        <CanvasDotOverlay />
        <OutlinedBlob className="absolute -right-[18rem] top-12 h-[36rem] w-[36rem] md:-right-[20rem] md:h-[44rem] md:w-[44rem]" color="var(--accent-primary)" variant={1} />
        <Container>
          <FadeIn>
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-body-small mb-3 font-medium uppercase tracking-widest" style={{ color: 'var(--accent-secondary)' }}>The Difference</p>
              <h2 className="text-foreground">Selling art online can feel like a second job</h2>
            </div>
          </FadeIn>
          <div className="mx-auto mt-12 grid max-w-4xl gap-8 md:grid-cols-2">
            <FadeIn delay={0}>
              <div className="flex h-full flex-col rounded-xl border border-border bg-surface/50 p-8">
                <p className="text-body-small font-medium uppercase tracking-widest text-muted-text">On Your Own</p>
                <div className="flex flex-1 flex-col justify-center gap-6 py-4">
                  {([
                    { icon: 'dms' as const, text: 'Managing DMs, tracking payments across apps, keeping up with orders' },
                    { icon: 'website' as const, text: 'A website that never quite feels finished or looks right' },
                    { icon: 'invisible' as const, text: 'Hard for new people to discover your work beyond existing followers' },
                    { icon: 'trust' as const, text: 'No easy way for a first-time buyer to know they can trust you' },
                  ]).map((item) => (
                    <div key={item.icon} className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <PainPointIcon type={item.icon} />
                      </div>
                      <p className="text-sm text-muted-text">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={150}>
              <div className="h-full rounded-xl border p-8" style={{ borderColor: 'color-mix(in srgb, var(--accent-primary) 30%, var(--border))', background: 'color-mix(in srgb, var(--accent-primary) 3%, var(--background))' }}>
                <p className="text-body-small font-medium uppercase tracking-widest" style={{ color: 'var(--accent-primary)' }}>With Surfaced Art</p>
                {/* Browser-framed profile placeholder */}
                <div className="relative mt-6 overflow-hidden rounded-lg border border-border bg-surface">
                  <div className="flex items-center gap-2 border-b border-border bg-background/50 px-3 py-2">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 rounded-full bg-foreground/10" />
                      <div className="h-2 w-2 rounded-full bg-foreground/10" />
                      <div className="h-2 w-2 rounded-full bg-foreground/10" />
                    </div>
                    <div className="h-4 flex-1 rounded-sm bg-foreground/5 px-2">
                      <p className="truncate text-[9px] leading-4 text-muted-text/50">surfacedart.com/your-name</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full" style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }} />
                      <div>
                        <div className="h-2.5 w-20 rounded-full" style={{ background: 'color-mix(in srgb, var(--foreground) 18%, var(--surface))' }} />
                        <div className="mt-1.5 h-2 w-14 rounded-full" style={{ background: 'color-mix(in srgb, var(--foreground) 8%, var(--surface))' }} />
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-1.5">
                      {[22, 14, 18, 16, 20, 12].map((mix, i) => (
                        <div key={i} className="aspect-square rounded-sm" style={{ background: `color-mix(in srgb, var(--accent-${i % 2 === 0 ? 'primary' : 'secondary'}) ${mix}%, var(--surface))` }} />
                      ))}
                    </div>
                  </div>
                </div>
                <ul className="mt-5 space-y-3 text-sm text-foreground">
                  {[
                    'One URL for your entire body of work',
                    'Checkout, shipping labels, customer support built in',
                    'Buyers browsing ceramics at 2am find your teapot',
                    '\u201CSurfaced Art artist\u201D means something to a buyer',
                  ].map((text, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <BlobMarker size={18} index={i} color="var(--accent-primary)" />
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          </div>
        </Container>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 4: How it works                                     */}
      {/* ============================================================ */}
      <div className="full-bleed relative z-10 -mb-1">
        <BrushstrokeDivider color="var(--surface)" opacity={10} />
      </div>
      <section id="v14-how-it-works" data-testid="for-artists-how-it-works" className="full-bleed relative overflow-hidden" style={{ background: 'var(--surface)' }}>
        <CanvasDotOverlay />
        <div className="relative py-16 md:py-24">
          <Container>
            <FadeIn>
              <div className="mx-auto mb-12 max-w-3xl text-center">
                <p className="text-body-small mb-3 font-medium uppercase tracking-widest" style={{ color: 'var(--accent-secondary)' }}>How It Works</p>
                <h2 className="text-foreground">
                  From application to gallery in about 20 minutes
                </h2>
              </div>
            </FadeIn>
            <HorizontalTimeline />
          </Container>
        </div>
      </section>
      <div className="full-bleed relative z-10 -mt-1">
        <BrushstrokeDivider flip color="var(--surface)" opacity={10} />
      </div>

      {/* ============================================================ */}
      {/*  SECTION 5: What the platform does (replaces tabbed UI)      */}
      {/* ============================================================ */}
      <section id="v14-platform" data-testid="for-artists-platform" className="full-bleed relative overflow-hidden py-16 md:py-24">
        <CanvasDotOverlay />
        <OutlinedBlob className="absolute -left-[18rem] top-8 h-[36rem] w-[36rem] md:-left-[20rem] md:h-[42rem] md:w-[42rem]" color="var(--accent-secondary)" variant={0} />
        <Container>
          <FadeIn>
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-body-small mb-3 font-medium uppercase tracking-widest" style={{ color: 'var(--accent-secondary)' }}>The Platform</p>
              <h2 className="text-foreground">
                You make the art. We handle the rest
              </h2>
            </div>
          </FadeIn>

          <div className="mx-auto mt-12 max-w-4xl">
            <div className="grid gap-px overflow-hidden rounded-xl border border-border" style={{ background: 'var(--border)' }}>
              {[
                {
                  title: 'Your storefront',
                  desc: 'Every piece gets its own listing page with photos, dimensions, price, and shipping info. Category browsing and search bring people to your work without you having to post about it.',
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                      <rect x="3" y="3" width="10" height="10" rx="2" fill="var(--accent-primary)" opacity="0.6" />
                      <rect x="15" y="3" width="10" height="10" rx="2" fill="var(--accent-primary)" opacity="0.3" />
                      <rect x="3" y="15" width="10" height="10" rx="2" fill="var(--accent-primary)" opacity="0.3" />
                      <rect x="15" y="15" width="10" height="10" rx="2" fill="var(--accent-primary)" opacity="0.15" />
                    </svg>
                  ),
                },
                {
                  title: 'Payments',
                  desc: 'Stripe handles checkout, sales tax, and payouts to your bank. You get paid when the work sells.',
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                      <rect x="2" y="7" width="24" height="14" rx="3" stroke="var(--accent-primary)" strokeWidth="1.5" opacity="0.4" />
                      <line x1="2" y1="12" x2="26" y2="12" stroke="var(--accent-primary)" strokeWidth="2" opacity="0.3" />
                      <rect x="5" y="15" width="8" height="2" rx="1" fill="var(--accent-primary)" opacity="0.3" />
                    </svg>
                  ),
                },
                {
                  title: 'Shipping',
                  desc: 'Rates calculated at checkout from your packed dimensions. The buyer pays shipping separately, and we don\'t take commission on it.',
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                      <rect x="4" y="4" width="15" height="20" rx="2" stroke="var(--accent-secondary)" strokeWidth="1.5" opacity="0.4" />
                      <path d="M19 10h4l3 5v5a2 2 0 01-2 2h-5" stroke="var(--accent-secondary)" strokeWidth="1.5" opacity="0.4" />
                      <circle cx="10" cy="24" r="2.5" fill="var(--accent-secondary)" opacity="0.3" />
                      <circle cx="22" cy="24" r="2.5" fill="var(--accent-secondary)" opacity="0.3" />
                    </svg>
                  ),
                },
                {
                  title: 'Customer support',
                  desc: 'Buyer questions, return requests, disputes: we handle the back-and-forth so you can stay in the studio',
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                      <path d="M14 3C8 3 3 7.5 3 13c0 3 1.5 5.5 4 7.2V25l4-2.5c1 .3 2 .5 3 .5 6 0 11-4.5 11-10S20 3 14 3z" stroke="var(--accent-primary)" strokeWidth="1.5" opacity="0.3" />
                      <circle cx="10" cy="13" r="1.5" fill="var(--accent-primary)" opacity="0.3" />
                      <circle cx="14" cy="13" r="1.5" fill="var(--accent-primary)" opacity="0.3" />
                      <circle cx="18" cy="13" r="1.5" fill="var(--accent-primary)" opacity="0.3" />
                    </svg>
                  ),
                },
              ].map((feature, i) => (
                <FadeIn key={feature.title} delay={i * 60}>
                  <div className="flex gap-5 bg-background p-6 md:p-8">
                    <div className="flex-shrink-0 pt-1">{feature.icon}</div>
                    <div>
                      <p className="font-serif text-lg text-foreground">{feature.title}</p>
                      <p className="text-body-small mt-1.5 text-muted-text">{feature.desc}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ============================================================ */}
      {/*  TESTIMONIAL                                                 */}
      {/* ============================================================ */}
      <div className="py-6 md:py-10" />
      <section className="full-bleed overflow-hidden">
        <div className="relative py-10 md:py-14" style={{ background: 'var(--accent-primary)' }}>
          <Container>
            <blockquote className="relative mx-auto max-w-2xl text-center">
              <p className="font-serif text-2xl italic leading-relaxed tracking-tight md:text-3xl" style={{ color: 'var(--primary-foreground)' }}>
                &ldquo;I was selling through DMs for two years. This is the first time my work has a real home online.&rdquo;
              </p>
              <footer className="mt-5">
                <p className="text-sm font-medium" style={{ color: 'color-mix(in srgb, var(--primary-foreground) 80%, transparent)' }}>Artist Name, Ceramics</p>
              </footer>
            </blockquote>
          </Container>
        </div>
      </section>
      <div className="py-6 md:py-10" />

      {/* ============================================================ */}
      {/*  SECTION 6: Pricing                                          */}
      {/* ============================================================ */}
      <div className="full-bleed relative z-10 -mb-1">
        <BrushstrokeDivider color="var(--surface)" opacity={10} />
      </div>
      <section id="v14-pricing" data-testid="for-artists-commission" className="full-bleed relative overflow-hidden" style={{ background: 'var(--surface)' }}>
        <CanvasDotOverlay />
        <div className="relative overflow-hidden py-12 md:py-16">
          <WatercolorWash opacity1={0.04} opacity2={0.03} />
          <Container className="relative">
            <FadeIn>
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-body-small mb-3 font-medium uppercase tracking-widest" style={{ color: 'var(--accent-primary)' }}>Pricing</p>
                <h2 className="text-foreground">
                  <HighlightMarker>30% commission</HighlightMarker>, and only when something sells
                </h2>
                <p className="text-body-default mx-auto mt-5 max-w-xl text-muted-text">
                  Covers the platform, payment processing, and customer support. Most physical galleries take 40–50%. No listing fees, no monthly subscriptions.
                </p>
              </div>
            </FadeIn>
            <div className="mx-auto mt-12 grid max-w-3xl gap-8 md:grid-cols-2">
              {[
                { value: 0, prefix: '$', label: 'To list your work', detail: 'No per-listing fees, list as much as you like' },
                { value: 0, prefix: '$', label: 'Monthly', detail: 'Your profile is free to maintain, always' },
              ].map((stat, i) => (
                <FadeIn key={stat.label} delay={i * 100}>
                  <div className="text-center">
                    <p className="font-serif text-5xl tracking-tight md:text-6xl" style={{ color: 'var(--accent-primary)' }}>
                      {stat.prefix}{stat.value}
                    </p>
                    <p className="mt-2 font-medium text-foreground">{stat.label}</p>
                    <p className="text-body-small mt-1 text-muted-text">{stat.detail}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </Container>
        </div>
      </section>
      <div className="full-bleed relative z-10 -mt-1">
        <BrushstrokeDivider flip color="var(--surface)" opacity={10} />
      </div>

      {/* ============================================================ */}
      {/*  SECTION 7: Details                                          */}
      {/* ============================================================ */}
      <section id="v14-details" data-testid="for-artists-details" className="full-bleed relative overflow-hidden py-16 md:py-24">
        <CanvasDotOverlay />
        <OutlinedBlob className="absolute -right-[18rem] top-12 h-[36rem] w-[36rem] md:-right-[20rem] md:h-[44rem] md:w-[44rem]" color="var(--accent-primary)" variant={1} />
        <OutlinedBlob className="absolute -left-[18rem] bottom-0 h-[32rem] w-[32rem] md:-left-[20rem] md:h-[38rem] md:w-[38rem]" color="var(--accent-secondary)" variant={0} />
        <Container>
          <FadeIn>
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-body-small mb-3 font-medium uppercase tracking-widest" style={{ color: 'var(--accent-primary)' }}>Built for Artists</p>
              <h2 className="text-foreground">
                The things that make it worth it
              </h2>
            </div>
          </FadeIn>
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Shipping sorted for you',
                desc: 'Rates calculated at checkout from your packed dimensions, and we don\'t take a cut of shipping costs',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                    <rect x="4" y="4" width="14" height="18" rx="2" stroke="var(--accent-secondary)" strokeWidth="1.5" opacity="0.5" />
                    <path d="M18 10h4l3 4v4a2 2 0 01-2 2h-5" stroke="var(--accent-secondary)" strokeWidth="1.5" opacity="0.5" />
                    <circle cx="10" cy="22" r="2" fill="var(--accent-secondary)" opacity="0.4" />
                    <circle cx="21" cy="22" r="2" fill="var(--accent-secondary)" opacity="0.4" />
                  </svg>
                ),
              },
              {
                title: 'Direct payouts',
                desc: 'Stripe sends money to your bank after delivery confirmation. One-time identity verification, then it just works.',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                    <rect x="3" y="8" width="22" height="12" rx="2.5" stroke="var(--accent-primary)" strokeWidth="1.5" opacity="0.5" />
                    <circle cx="14" cy="14" r="3" stroke="var(--accent-primary)" strokeWidth="1.5" opacity="0.4" />
                    <line x1="3" y1="12" x2="8" y2="12" stroke="var(--accent-primary)" strokeWidth="1" opacity="0.3" />
                    <line x1="20" y1="12" x2="25" y2="12" stroke="var(--accent-primary)" strokeWidth="1" opacity="0.3" />
                  </svg>
                ),
              },
              {
                title: 'Your links stay visible',
                desc: 'Instagram, personal website, wherever else you sell or show work. It all lives on your profile, right where visitors can find it.',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                    <circle cx="10" cy="14" r="5" stroke="var(--accent-secondary)" strokeWidth="1.5" opacity="0.4" />
                    <circle cx="18" cy="14" r="5" stroke="var(--accent-secondary)" strokeWidth="1.5" opacity="0.4" />
                    <path d="M13 11.5a5 5 0 000 5" stroke="var(--accent-secondary)" strokeWidth="1.5" opacity="0.5" />
                  </svg>
                ),
              },
              {
                title: 'Buyers find you',
                desc: 'Category pages, keyword search, and SEO-optimized listings so people looking for your kind of work can actually find it',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="7" stroke="var(--accent-primary)" strokeWidth="1.5" opacity="0.4" />
                    <line x1="17" y1="17" x2="24" y2="24" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
                  </svg>
                ),
              },
              {
                title: 'Sold work stays on your page',
                desc: 'Pieces that sell stay visible in your archive, so over time it becomes a portfolio that shows the full range of what you\'ve made',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                    <rect x="4" y="3" width="8" height="10" rx="1.5" fill="var(--accent-secondary)" opacity="0.2" />
                    <rect x="14" y="5" width="8" height="10" rx="1.5" fill="var(--accent-secondary)" opacity="0.15" />
                    <rect x="6" y="16" width="8" height="10" rx="1.5" fill="var(--accent-secondary)" opacity="0.1" />
                    <rect x="16" y="14" width="8" height="10" rx="1.5" fill="var(--accent-secondary)" opacity="0.2" />
                  </svg>
                ),
              },
              {
                title: 'No exclusivity',
                desc: 'Sell here, sell at galleries, sell from your studio. We never ask you to list exclusively with us.',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                    <path d="M6 14h16" stroke="var(--accent-primary)" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
                    <path d="M14 6v16" stroke="var(--accent-primary)" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
                    <circle cx="6" cy="14" r="3" stroke="var(--accent-primary)" strokeWidth="1.5" opacity="0.5" />
                    <circle cx="22" cy="14" r="3" stroke="var(--accent-primary)" strokeWidth="1.5" opacity="0.5" />
                    <circle cx="14" cy="6" r="3" stroke="var(--accent-primary)" strokeWidth="1.5" opacity="0.5" />
                    <circle cx="14" cy="22" r="3" stroke="var(--accent-primary)" strokeWidth="1.5" opacity="0.5" />
                  </svg>
                ),
              },
            ].map((item) => (
              <FadeIn key={item.title} className="h-full">
                <div className="h-full rounded-lg border border-border bg-background p-6">
                  <div className="mb-3">{item.icon}</div>
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="text-body-small mt-1.5 text-muted-text">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </Container>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 8: Roadmap                                          */}
      {/* ============================================================ */}
      <div className="full-bleed relative z-10 -mb-1">
        <BrushstrokeDivider color="var(--surface)" opacity={10} />
      </div>
      <section
        id="v14-roadmap"
        data-testid="for-artists-roadmap"
        className="full-bleed relative overflow-hidden"
        style={{ background: 'var(--surface)' }}
      >
        <CanvasDotOverlay />
        <div className="relative py-16 md:py-24">
        <MorphingBlob className="absolute -right-20 top-4 h-72 w-72 md:h-96 md:w-96" color="var(--accent-primary)" />
        <MorphingBlob className="absolute bottom-8 -left-16 h-64 w-64 md:bottom-4 md:h-80 md:w-80" color="var(--accent-secondary)" />
        <Container className="relative">
          <FadeIn>
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-body-small mb-3 font-medium uppercase tracking-widest" style={{ color: 'var(--accent-secondary)' }}>Coming Soon</p>
              <h2 className="text-foreground">What&apos;s coming next</h2>
              <p className="text-body-default mx-auto mt-5 max-w-xl text-muted-text">
                We&apos;re actively building new tools to help you sell more and get seen by the right people
              </p>
            </div>
          </FadeIn>

          <div className="hidden md:block">
            <FadeIn>
              <CardFan
                cards={[
                  { icon: 'analytics', title: 'Artist Analytics', desc: 'Who\'s looking at your work, what they\'re clicking, what\'s getting saved' },
                  { icon: 'venue', title: 'Venue Connections', desc: 'Galleries, fairs, and festivals find artists directly on the platform' },
                  { icon: 'commission', title: 'Commissions', desc: 'Structured requests, progress updates, and milestone payments, all through your profile' },
                  { icon: 'discovery', title: 'Better Search', desc: 'Filters, recommendations, and smarter ways for the right buyer to find your work' },
                  { icon: 'more', title: 'And more', desc: 'We\'re just getting started. Lots more in the works' },
                ]}
              />
            </FadeIn>
          </div>

          <div className="mt-12 space-y-4 md:hidden">
            {([
              { icon: 'analytics' as const, title: 'Artist Analytics', desc: 'Who\'s looking at your work, what they\'re clicking, what\'s getting saved' },
              { icon: 'venue' as const, title: 'Venue Connections', desc: 'Galleries, fairs, and festivals find artists directly on the platform' },
              { icon: 'commission' as const, title: 'Commissions', desc: 'Structured requests, progress updates, and milestone payments, all through your profile' },
              { icon: 'discovery' as const, title: 'Better Search', desc: 'Filters, recommendations, and smarter ways for the right buyer to find your work' },
              { icon: 'more' as const, title: 'And more', desc: 'We\'re just getting started. Lots more in the works' },
            ]).map((item, i) => (
              <FadeIn key={item.title} delay={i * 80}>
                <div className="rounded-lg border border-border bg-background/80 p-5 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: 'color-mix(in srgb, var(--accent-primary) 10%, var(--background))' }}>
                      <RoadmapIcon type={item.icon} />
                    </div>
                    <div>
                      <p className="font-serif text-base text-foreground">{item.title}</p>
                      <p className="text-body-small mt-1 text-muted-text">{item.desc}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </Container>
        </div>
      </section>
      <div className="full-bleed relative z-10 -mt-1">
        <BrushstrokeDivider flip color="var(--surface)" opacity={10} />
      </div>

      {/* ============================================================ */}
      {/*  CTA                                                         */}
      {/* ============================================================ */}
      <section id="v14-cta" data-testid="for-artists-cta" className="full-bleed relative overflow-hidden">
        <CanvasDotOverlay />
        <Container className="relative py-24 md:py-32">
          <FadeIn>
            <div className="relative mx-auto max-w-xl">
              {/* Glow behind card */}
              <div className="absolute -inset-8 -z-10 rounded-3xl opacity-30 blur-3xl" style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }} aria-hidden="true" />
              <div className="rounded-2xl border-2 bg-background p-10 text-center shadow-xl md:p-14" style={{ borderColor: 'color-mix(in srgb, var(--accent-primary) 30%, var(--border))' }}>
                <h2 className="text-foreground">Your work deserves a <ShimmerText>home</ShimmerText></h2>
                <p className="text-body-default mx-auto mt-4 max-w-md text-muted-text">
                  Not another marketplace. Not another social feed. A real place for your art, built for the way you work. Applications are open!
                </p>
                <div className="mt-8">
                  <Link
                    href="/apply"
                    className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-10 py-4 text-lg font-medium tracking-wide text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.05] active:scale-[0.97] motion-safe:animate-[btn-shimmer_3s_ease_infinite]"
                    style={{
                      backgroundImage: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 20%, color-mix(in srgb, var(--accent-primary) 70%, #fff) 40%, var(--accent-secondary) 60%, var(--accent-primary) 80%, var(--accent-secondary) 100%)',
                      backgroundSize: '400% 100%',
                    }}
                  >
                    <span className="relative z-10">Apply to Join</span>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="relative z-10 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
                      <path d="M4 10h12m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </Container>
      </section>

      {/* Keyframes */}
      <style>{`
        @keyframes gradient-shift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes text-shimmer { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes btn-shimmer { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes float-1 { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(6px, -8px); } 50% { transform: translate(-4px, -14px); } 75% { transform: translate(8px, -6px); } }
        @keyframes float-2 { 0%, 100% { transform: translate(0, 0); } 33% { transform: translate(-10px, 5px); } 66% { transform: translate(8px, -8px); } }
        @keyframes float-3 { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(10px, 6px); } 50% { transform: translate(4px, -10px); } 75% { transform: translate(-8px, 4px); } }
        @keyframes tab-in { 0% { opacity: 0; transform: translateY(8px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes breathe { 0%, 100% { transform: scale(1); opacity: 0.7; } 50% { transform: scale(1.15); opacity: 0.9; } }
      `}</style>
    </div>
  )
}
