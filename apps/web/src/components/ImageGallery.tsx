'use client'

import { useState, useCallback, type KeyboardEvent } from 'react'
import Image from 'next/image'
import { Maximize2 } from 'lucide-react'
import type { ListingImage } from '@surfaced-art/types'
import { Lightbox } from './Lightbox'

type ImageGalleryProps = {
  images: ListingImage[]
  alt: string
}

export function ImageGallery({ images, alt }: ImageGalleryProps) {
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder)
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const activeImage = sorted[activeIndex]

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setActiveIndex((i) => (i > 0 ? i - 1 : sorted.length - 1))
      } else if (e.key === 'ArrowRight') {
        setActiveIndex((i) => (i < sorted.length - 1 ? i + 1 : 0))
      }
    },
    [sorted.length]
  )

  const lightboxImages = sorted.map((img, i) => ({
    src: img.url,
    alt: sorted.length > 1 ? `${alt} — image ${i + 1} of ${sorted.length}` : alt,
  }))

  if (sorted.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-md bg-border">
        <span className="text-muted-text text-sm">No images</span>
      </div>
    )
  }

  return (
    <div data-testid="listing-images" className="space-y-3" role="toolbar" aria-label="Image gallery" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Primary image */}
      <div className="group relative aspect-square overflow-hidden rounded-md bg-surface">
        {activeImage && (
          <Image
            src={activeImage.url}
            alt={alt}
            fill
            unoptimized
            className="object-contain"
            priority
          />
        )}
        {/* Expand button overlay */}
        <button
          type="button"
          data-testid="image-gallery-expand"
          onClick={() => setLightboxOpen(true)}
          className="absolute inset-0 cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          aria-label="View full size"
        >
          <span className="absolute top-3 right-3 rounded-full bg-black/40 p-1.5 text-white/80 opacity-0 transition-opacity group-hover:opacity-100">
            <Maximize2 className="size-4" />
          </span>
        </button>
      </div>

      {/* Thumbnail strip — only show when multiple images */}
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Image thumbnails">
          {sorted.map((image, index) => (
            <button
              key={image.id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`View image ${index + 1}`}
              onClick={() => setActiveIndex(index)}
              className={`relative size-16 shrink-0 overflow-hidden rounded border-2 transition-[border-color] duration-200 ${
                index === activeIndex
                  ? 'border-accent-primary'
                  : 'border-transparent hover:border-border'
              }`}
            >
              <Image
                src={image.url}
                alt=""
                fill
                unoptimized
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <Lightbox
        images={lightboxImages}
        initialIndex={activeIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </div>
  )
}
