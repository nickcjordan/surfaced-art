'use client'

import { useState, useCallback, useEffect, useRef, type KeyboardEvent, type TouchEvent } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

export type LightboxImage = {
  src: string
  alt: string
}

type LightboxProps = {
  images: LightboxImage[]
  initialIndex?: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function Lightbox({ images, initialIndex = 0, open, onOpenChange }: LightboxProps) {
  // Render nothing when closed — this unmounts internal state so it resets on reopen
  if (!open) return null

  return (
    <LightboxInner
      images={images}
      initialIndex={initialIndex}
      onOpenChange={onOpenChange}
    />
  )
}

function LightboxInner({
  images,
  initialIndex,
  onOpenChange,
}: {
  images: LightboxImage[]
  initialIndex: number
  onOpenChange: (open: boolean) => void
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [loaded, setLoaded] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const hasMultiple = images.length > 1

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i < images.length - 1 ? i + 1 : 0))
    setLoaded(false)
  }, [images.length])

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i > 0 ? i - 1 : images.length - 1))
    setLoaded(false)
  }, [images.length])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      }
    },
    [goNext, goPrev]
  )

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (touchStartX.current === null) return
      const delta = e.changedTouches[0].clientX - touchStartX.current
      touchStartX.current = null
      if (Math.abs(delta) > 50) {
        if (delta < 0) goNext()
        else goPrev()
      }
    },
    [goNext, goPrev]
  )

  // Preload adjacent images
  useEffect(() => {
    if (!hasMultiple) return

    const links: HTMLLinkElement[] = []
    const preloadIndices = [
      currentIndex > 0 ? currentIndex - 1 : images.length - 1,
      currentIndex < images.length - 1 ? currentIndex + 1 : 0,
    ]

    for (const idx of preloadIndices) {
      if (idx === currentIndex) continue
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = images[idx].src
      document.head.appendChild(link)
      links.push(link)
    }

    return () => {
      for (const link of links) {
        document.head.removeChild(link)
      }
    }
  }, [currentIndex, images, hasMultiple])

  const currentImage = images[currentIndex]
  if (!currentImage) return null

  return (
    <DialogPrimitive.Root open={true} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/95"
        />
        <DialogPrimitive.Content
          data-testid="lightbox"
          aria-describedby={undefined}
          onKeyDown={handleKeyDown}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="fixed inset-0 z-50 flex items-center justify-center outline-none"
        >
          <DialogPrimitive.Title className="sr-only">Image viewer</DialogPrimitive.Title>

          {/* Close button */}
          <DialogPrimitive.Close
            data-testid="lightbox-close"
            className="absolute top-4 right-4 z-10 rounded-full bg-black/50 p-2 text-white/80 transition-colors hover:bg-black/70 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Close image viewer"
          >
            <X className="size-5" />
          </DialogPrimitive.Close>

          {/* Previous button */}
          {hasMultiple && (
            <button
              type="button"
              data-testid="lightbox-prev"
              onClick={goPrev}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white/80 transition-colors hover:bg-black/70 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-4"
              aria-label="Previous image"
            >
              <ChevronLeft className="size-6" />
            </button>
          )}

          {/* Next button */}
          {hasMultiple && (
            <button
              type="button"
              data-testid="lightbox-next"
              onClick={goNext}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white/80 transition-colors hover:bg-black/70 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-4"
              aria-label="Next image"
            >
              <ChevronRight className="size-6" />
            </button>
          )}

          {/* Image */}
          <div className="relative size-full p-8 sm:p-12">
            <div
              className={cn(
                'absolute inset-8 sm:inset-12 rounded bg-white/5',
                !loaded && 'animate-pulse'
              )}
            />
            <Image
              data-testid="lightbox-image"
              src={currentImage.src}
              alt={currentImage.alt}
              fill
              unoptimized
              className="object-contain p-8 sm:p-12"
              onLoad={() => setLoaded(true)}
            />
          </div>

          {/* Counter */}
          {hasMultiple && (
            <div
              data-testid="lightbox-counter"
              aria-live="polite"
              className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white/80"
            >
              {currentIndex + 1} of {images.length}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
