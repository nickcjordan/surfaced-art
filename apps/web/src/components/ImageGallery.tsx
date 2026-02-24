'use client'

import { useState, useCallback, type KeyboardEvent } from 'react'
import Image from 'next/image'
import type { ListingImage } from '@surfaced-art/types'

type ImageGalleryProps = {
  images: ListingImage[]
  alt: string
}

export function ImageGallery({ images, alt }: ImageGalleryProps) {
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder)
  const [activeIndex, setActiveIndex] = useState(0)
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

  if (sorted.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-md bg-border">
        <span className="text-muted-text text-sm">No images</span>
      </div>
    )
  }

  return (
    <div data-testid="listing-images" className="space-y-3" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Primary image */}
      <div className="relative aspect-square overflow-hidden rounded-md bg-surface">
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
    </div>
  )
}
