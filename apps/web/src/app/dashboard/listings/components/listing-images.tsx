'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { useAuth } from '@/lib/auth'
import { addListingImage, deleteListingImage, reorderListingImages, getPresignedUrl } from '@/lib/api'
import { validateFile, uploadToS3, UploadError } from '@/lib/upload'
import type { MyListingImageResponse } from '@surfaced-art/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function getCloudfrontDomain(): string {
  return process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN || ''
}

interface ListingImagesProps {
  listingId: string
  images: MyListingImageResponse[]
  onImagesChange: (images: MyListingImageResponse[]) => void
}

export function ListingImages({ listingId, images, onImagesChange }: ListingImagesProps) {
  const { getIdToken } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    setUploading(true)

    try {
      validateFile(file)

      const token = await getIdToken()
      if (!token) {
        setUploadError('Not authenticated')
        return
      }

      const presigned = await getPresignedUrl(token, 'listing', file.type)
      await uploadToS3(file, presigned)

      const cloudfrontDomain = getCloudfrontDomain()
      if (!cloudfrontDomain) {
        throw new Error('Image CDN is not configured.')
      }
      const cloudFrontUrl = `https://${cloudfrontDomain}/${presigned.key}`

      const newImage = await addListingImage(token, listingId, {
        url: cloudFrontUrl,
        isProcessPhoto: false,
      })

      onImagesChange([...images, newImage])
    } catch (err) {
      if (err instanceof UploadError) {
        setUploadError(err.message)
      } else {
        setUploadError(err instanceof Error ? err.message : 'Upload failed')
      }
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  async function handleDelete(imageId: string) {
    try {
      const token = await getIdToken()
      if (!token) return

      await deleteListingImage(token, listingId, imageId)
      onImagesChange(images.filter((img) => img.id !== imageId))
      setDeleteConfirmId(null)
    } catch {
      // Could show toast in the future
    }
  }

  async function handleMove(imageId: string, direction: 'up' | 'down') {
    const index = images.findIndex((img) => img.id === imageId)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === images.length - 1) return

    const newImages = [...images]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    ;[newImages[index], newImages[swapIndex]] = [newImages[swapIndex], newImages[index]]

    const orderedIds = newImages.map((img) => img.id)
    onImagesChange(newImages)

    try {
      const token = await getIdToken()
      if (!token) return

      const result = await reorderListingImages(token, listingId, orderedIds)
      onImagesChange(result)
    } catch {
      // Revert on error
      onImagesChange(images)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Images</CardTitle>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Add Image'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
          data-testid="image-upload-input"
        />

        {uploadError && (
          <p role="alert" className="text-sm text-destructive">
            {uploadError}
          </p>
        )}

        {images.length === 0 && (
          <div data-testid="listing-images-empty" className="text-center py-8 text-muted-foreground">
            <p>No images yet. Upload photos of your artwork.</p>
          </div>
        )}

        {images.map((image, index) => (
          <div
            key={image.id}
            data-testid="listing-image-item"
            className="flex items-center gap-4 rounded-md border p-3"
          >
            {/* Thumbnail */}
            <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-muted">
              <Image
                src={image.url}
                alt={`Image ${index + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex items-center gap-2">
              {index === 0 && (
                <Badge className="bg-accent-primary/10 text-accent-primary">Thumbnail</Badge>
              )}
              {image.isProcessPhoto && (
                <Badge className="bg-warning/10 text-warning">Process</Badge>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={index === 0}
                onClick={() => handleMove(image.id, 'up')}
                aria-label="Move up"
              >
                ↑
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={index === images.length - 1}
                onClick={() => handleMove(image.id, 'down')}
                aria-label="Move down"
              >
                ↓
              </Button>
              {deleteConfirmId === image.id ? (
                <div className="flex gap-1">
                  <Button
                    type="button"
                    data-testid="image-delete-confirm"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(image.id)}
                  >
                    Confirm
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirmId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  data-testid="image-delete-button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteConfirmId(image.id)}
                  aria-label="Delete image"
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
