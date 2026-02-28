'use client'

import { useRef, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { getPresignedUrl } from '@/lib/api'
import { validateFile, uploadToS3, UploadError } from '@/lib/upload'
import { Button } from '@/components/ui/button'

const CLOUDFRONT_DOMAIN = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN || ''

interface ImageUploadProps {
  label: string
  currentUrl: string | null
  context: 'profile' | 'cover'
  onUploadComplete: (url: string) => void
  onRemove: () => void
  testId: string
  aspectHint?: string
}

export function ImageUpload({
  label,
  currentUrl,
  context,
  onUploadComplete,
  onRemove,
  testId,
  aspectHint,
}: ImageUploadProps) {
  const { getIdToken } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)

    try {
      validateFile(file)

      const token = await getIdToken()
      if (!token) {
        setError('Not authenticated')
        return
      }

      const presigned = await getPresignedUrl(token, context, file.type)
      await uploadToS3(file, presigned)

      // Construct CloudFront URL from the S3 key
      const cloudFrontUrl = CLOUDFRONT_DOMAIN
        ? `https://${CLOUDFRONT_DOMAIN}/${presigned.key}`
        : presigned.key

      onUploadComplete(cloudFrontUrl)
    } catch (err) {
      if (err instanceof UploadError) {
        setError(err.message)
      } else {
        setError(err instanceof Error ? err.message : 'Upload failed')
      }
    } finally {
      setUploading(false)
      // Reset the input so the same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div data-testid={testId} className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      {aspectHint && (
        <p className="text-xs text-muted-foreground">{aspectHint}</p>
      )}

      {currentUrl ? (
        <div className="relative">
          <img
            src={currentUrl}
            alt={label}
            className="w-full max-h-48 object-cover rounded-md border"
          />
          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              Change
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRemove}
              disabled={uploading}
              aria-label={`Remove ${label.toLowerCase()}`}
            >
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed rounded-md p-6 text-center text-muted-foreground hover:border-primary hover:text-foreground transition-colors disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : `Upload ${label.toLowerCase()}`}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        data-testid={`${testId}-input`}
      />

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
