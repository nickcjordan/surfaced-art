'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Lightbox } from './Lightbox'
import type { LightboxImage } from './Lightbox'

type ProcessPhotoGridProps = {
  photos: { id: string; url: string }[]
  artistName: string
}

export function ProcessPhotoGrid({ photos, artistName }: ProcessPhotoGridProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const lightboxImages: LightboxImage[] = photos.map((photo, index) => ({
    src: photo.url,
    alt: `${artistName} process photo ${index + 1} of ${photos.length}`,
  }))

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            data-testid="process-photo"
            onClick={() => {
              setLightboxIndex(index)
              setLightboxOpen(true)
            }}
            className="relative aspect-square cursor-zoom-in overflow-hidden rounded-md bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Image
              src={photo.url}
              alt={`${artistName} process photo ${index + 1} of ${photos.length}`}
              fill
              unoptimized
              className="object-cover"
            />
          </button>
        ))}
      </div>

      <Lightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </>
  )
}
