'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { getProcessMedia, createProcessMediaPhoto, createProcessMediaVideo, deleteProcessMedia, reorderProcessMedia } from '@/lib/api'
import type { ProcessMediaResponse } from '@surfaced-art/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type AddMode = 'closed' | 'photo' | 'video'

export function ProcessMediaGrid() {
  const { getIdToken } = useAuth()
  const [media, setMedia] = useState<ProcessMediaResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [addMode, setAddMode] = useState<AddMode>('closed')
  const [photoUrl, setPhotoUrl] = useState('')
  const [videoPlaybackId, setVideoPlaybackId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const fetchMedia = useCallback(async () => {
    try {
      const token = await getIdToken()
      if (!token) return

      const result = await getProcessMedia(token)
      setMedia(result.processMedia)
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load process media')
    } finally {
      setLoading(false)
    }
  }, [getIdToken])

  useEffect(() => {
    fetchMedia()
  }, [fetchMedia])

  async function handleAddPhoto(e: React.FormEvent) {
    e.preventDefault()
    if (!photoUrl.trim()) return
    setSubmitting(true)

    try {
      const token = await getIdToken()
      if (!token) return

      const created = await createProcessMediaPhoto(token, photoUrl.trim())
      setMedia((prev) => [...prev, created])
      setPhotoUrl('')
      setAddMode('closed')
    } catch {
      // Error handling could be expanded
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAddVideo(e: React.FormEvent) {
    e.preventDefault()
    if (!videoPlaybackId.trim()) return
    setSubmitting(true)

    try {
      const token = await getIdToken()
      if (!token) return

      const created = await createProcessMediaVideo(token, videoPlaybackId.trim())
      setMedia((prev) => [...prev, created])
      setVideoPlaybackId('')
      setAddMode('closed')
    } catch {
      // Error handling could be expanded
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const token = await getIdToken()
      if (!token) return

      await deleteProcessMedia(token, id)
      setMedia((prev) => prev.filter((m) => m.id !== id))
      setDeleteConfirmId(null)
    } catch {
      // Error handling could be expanded
    }
  }

  async function handleMove(id: string, direction: 'up' | 'down') {
    const index = media.findIndex((m) => m.id === id)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === media.length - 1) return

    const newMedia = [...media]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    ;[newMedia[index], newMedia[swapIndex]] = [newMedia[swapIndex], newMedia[index]]

    const orderedIds = newMedia.map((m) => m.id)
    setMedia(newMedia)

    try {
      const token = await getIdToken()
      if (!token) return

      const result = await reorderProcessMedia(token, orderedIds)
      setMedia(result.processMedia)
    } catch {
      // Revert on error
      setMedia(media)
    }
  }

  if (loading) {
    return (
      <div data-testid="media-list-skeleton" className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div data-testid="media-fetch-error" role="alert" className="text-center py-8">
        <p className="text-destructive mb-4">{fetchError}</p>
        <Button
          variant="outline"
          onClick={() => {
            setFetchError(null)
            setLoading(true)
            fetchMedia()
          }}
        >
          Try again
        </Button>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Process Media</CardTitle>
        <div className="flex gap-2">
          <Button
            data-testid="media-add-photo-button"
            size="sm"
            variant="outline"
            onClick={() => setAddMode('photo')}
            disabled={addMode !== 'closed'}
          >
            Add Photo
          </Button>
          <Button
            data-testid="media-add-video-button"
            size="sm"
            variant="outline"
            onClick={() => setAddMode('video')}
            disabled={addMode !== 'closed'}
          >
            Add Video
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {addMode === 'photo' && (
          <form
            data-testid="media-photo-form"
            onSubmit={handleAddPhoto}
            className="space-y-3 rounded-md border p-4"
          >
            <div className="space-y-2">
              <Label htmlFor="media-photo-url">Photo URL</Label>
              <Input
                id="media-photo-url"
                data-testid="media-photo-url-input"
                type="url"
                placeholder="https://cdn.cloudfront.net/..."
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                data-testid="media-photo-submit"
                disabled={submitting}
                size="sm"
              >
                {submitting ? 'Adding...' : 'Add Photo'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setAddMode('closed'); setPhotoUrl('') }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {addMode === 'video' && (
          <form
            data-testid="media-video-form"
            onSubmit={handleAddVideo}
            className="space-y-3 rounded-md border p-4"
          >
            <div className="space-y-2">
              <Label htmlFor="media-video-playback">Mux Playback ID</Label>
              <Input
                id="media-video-playback"
                data-testid="media-video-playback-input"
                placeholder="Enter Mux playback ID"
                value={videoPlaybackId}
                onChange={(e) => setVideoPlaybackId(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                data-testid="media-video-submit"
                disabled={submitting}
                size="sm"
              >
                {submitting ? 'Adding...' : 'Add Video'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setAddMode('closed'); setVideoPlaybackId('') }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {media.length === 0 && addMode === 'closed' && (
          <div data-testid="media-empty-state" className="text-center py-8 text-muted-foreground">
            <p>No process media yet. Add photos or videos showing your creative process.</p>
          </div>
        )}

        {media.map((item, index) => (
          <div
            key={item.id}
            data-testid={`media-item-${item.id}`}
            className="flex items-start justify-between rounded-md border p-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize">
                  {item.type}
                </span>
              </div>
              {item.type === 'photo' && item.url && (
                <p className="text-sm text-muted-foreground mt-1 truncate">{item.url}</p>
              )}
              {item.type === 'video' && item.videoPlaybackId && (
                <p className="text-sm text-muted-foreground mt-1">{item.videoPlaybackId}</p>
              )}
            </div>
            <div className="flex items-center gap-1 ml-4 shrink-0">
              <Button
                data-testid="media-move-up"
                variant="ghost"
                size="sm"
                disabled={index === 0}
                onClick={() => handleMove(item.id, 'up')}
                aria-label="Move up"
              >
                ↑
              </Button>
              <Button
                data-testid="media-move-down"
                variant="ghost"
                size="sm"
                disabled={index === media.length - 1}
                onClick={() => handleMove(item.id, 'down')}
                aria-label="Move down"
              >
                ↓
              </Button>
              {deleteConfirmId === item.id ? (
                <div className="flex gap-1">
                  <Button
                    data-testid="media-delete-confirm"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                  >
                    Confirm
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirmId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  data-testid="media-delete-button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteConfirmId(item.id)}
                  aria-label="Delete"
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
