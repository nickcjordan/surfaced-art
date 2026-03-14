'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import {
  getAdminListing,
  hideListing,
  unhideListing,
  updateAdminListingCategory,
  updateAdminListingTags,
  getTagVocabulary,
} from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CATEGORIES } from '@/lib/categories'
import type { AdminListingDetailResponse, Tag } from '@surfaced-art/types'

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function AdminListingDetail({ listingId }: { listingId: string }) {
  const { getIdToken } = useAuth()
  const [listing, setListing] = useState<AdminListingDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // Hide state
  const [showHideConfirm, setShowHideConfirm] = useState(false)
  const [hideReason, setHideReason] = useState('')

  // Unhide state
  const [showUnhideConfirm, setShowUnhideConfirm] = useState(false)

  // Tag editing state
  const [editingTags, setEditingTags] = useState(false)
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set())
  const [tagsLoading, setTagsLoading] = useState(false)

  const fetchListing = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await getIdToken()
      if (!token) throw new Error('Not authenticated')
      const result = await getAdminListing(token, listingId)
      setListing(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listing')
    } finally {
      setLoading(false)
    }
  }, [getIdToken, listingId])

  useEffect(() => {
    void fetchListing()
  }, [fetchListing])

  const handleHide = async () => {
    setActionError(null)
    setActionLoading(true)
    try {
      const token = await getIdToken()
      if (!token) throw new Error('Not authenticated')
      await hideListing(token, listingId, hideReason)
      setActionSuccess('Listing hidden successfully')
      setShowHideConfirm(false)
      setHideReason('')
      await fetchListing()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to hide')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnhide = async () => {
    setActionError(null)
    setActionLoading(true)
    try {
      const token = await getIdToken()
      if (!token) throw new Error('Not authenticated')
      await unhideListing(token, listingId)
      setActionSuccess('Listing restored to available')
      setShowUnhideConfirm(false)
      await fetchListing()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to unhide')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCategoryChange = async (newCategory: string) => {
    if (!listing || newCategory === listing.category) return
    setActionError(null)
    setActionLoading(true)
    try {
      const token = await getIdToken()
      if (!token) throw new Error('Not authenticated')
      await updateAdminListingCategory(token, listingId, newCategory)
      setActionSuccess('Category updated successfully')
      await fetchListing()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update category')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditTags = async () => {
    setTagsLoading(true)
    try {
      const tags = await getTagVocabulary()
      setAllTags(tags)
      setSelectedTagIds(new Set(listing?.tags.map((t) => t.id) ?? []))
      setEditingTags(true)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to load tags')
    } finally {
      setTagsLoading(false)
    }
  }

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev)
      if (next.has(tagId)) {
        next.delete(tagId)
      } else {
        next.add(tagId)
      }
      return next
    })
  }

  const handleSaveTags = async () => {
    setActionError(null)
    setActionLoading(true)
    try {
      const token = await getIdToken()
      if (!token) throw new Error('Not authenticated')
      await updateAdminListingTags(token, listingId, [...selectedTagIds])
      setActionSuccess('Tags updated successfully')
      setEditingTags(false)
      await fetchListing()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update tags')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div data-testid="admin-listing-detail-loading" className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div data-testid="admin-listing-detail-error" className="text-center py-12">
        <p className="text-error font-medium">Error loading listing</p>
        <p className="text-muted-foreground text-sm mt-1">{error}</p>
      </div>
    )
  }

  // Filter tags relevant to the listing's category + cross-cutting tags
  const relevantTags = allTags.filter(
    (t) => t.category === null || t.category === listing.category,
  )

  return (
    <div data-testid="admin-listing-detail" className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/admin/listings" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          &larr; Back to listings
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl font-semibold text-foreground">{listing.title}</h1>
          <Badge className={statusBadgeClass(listing.status)}>{listing.status}</Badge>
        </div>
        <p className="text-lg font-medium text-foreground mt-1">{formatPrice(listing.price)}</p>
        <div className="flex gap-3 mt-2 text-sm">
          <Link
            href={`/artist/${listing.artist.slug}/${listing.id}`}
            data-testid="public-listing-link"
            className="text-accent-primary hover:underline"
          >
            View public page
          </Link>
          <Link
            href={`/admin/artists/${listing.artist.id}`}
            className="text-accent-primary hover:underline"
          >
            View artist: {listing.artist.displayName}
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard testId="stat-orders" label="Orders" value={listing.orderCount} />
        <StatCard testId="stat-reviews" label="Reviews" value={listing.reviewCount} />
        <StatCard testId="stat-quantity" label="Remaining" value={listing.quantityRemaining} />
        <StatCard testId="stat-images" label="Images" value={listing.images.length} />
      </div>

      {/* Images */}
      {listing.images.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Images</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {listing.images.map((img) => (
              <div key={img.id} className="border border-border rounded-md overflow-hidden aspect-square bg-muted/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
                {img.isProcessPhoto && (
                  <div className="absolute bottom-1 left-1">
                    <Badge className="text-xs bg-muted">process</Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Details */}
      <div className="space-y-4 text-sm">
        <h2 className="text-sm font-medium text-muted-foreground">Details</h2>
        <div>
          <span className="text-muted-foreground">Description:</span>
          <p className="text-foreground mt-1 whitespace-pre-wrap">{listing.description}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-muted-foreground">Medium:</span>{' '}
            <span className="text-foreground">{listing.medium}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Category:</span>{' '}
            <select
              data-testid="category-select"
              value={listing.category}
              onChange={(e) => void handleCategoryChange(e.target.value)}
              disabled={actionLoading}
              className="ml-2 rounded-md border border-border bg-transparent px-2 py-1 text-sm text-foreground"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className="text-muted-foreground">Type:</span>{' '}
            <span className="text-foreground">{listing.type}</span>
          </div>
          {listing.artworkWidth && (
            <div>
              <span className="text-muted-foreground">Artwork Dimensions:</span>{' '}
              <span className="text-foreground">
                {listing.artworkWidth}&quot; &times; {listing.artworkLength}&quot;
                {listing.artworkHeight ? ` × ${listing.artworkHeight}"` : ''}
              </span>
            </div>
          )}
          {listing.editionNumber && (
            <div>
              <span className="text-muted-foreground">Edition:</span>{' '}
              <span className="text-foreground">{listing.editionNumber} of {listing.editionTotal}</span>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">Artist:</span>{' '}
            <span className="text-foreground">{listing.artist.displayName}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Created:</span>{' '}
            <span className="text-foreground">{new Date(listing.createdAt).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Updated:</span>{' '}
            <span className="text-foreground">{new Date(listing.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Tags</h2>
          {!editingTags && (
            <Button
              data-testid="edit-tags-btn"
              variant="ghost"
              size="sm"
              onClick={() => void handleEditTags()}
              disabled={actionLoading || tagsLoading}
            >
              {tagsLoading ? 'Loading...' : 'Edit Tags'}
            </Button>
          )}
        </div>

        {!editingTags && (
          <div data-testid="listing-tags" className="flex flex-wrap gap-2">
            {listing.tags.length > 0 ? (
              listing.tags.map((tag) => (
                <Badge key={tag.id} className="bg-muted text-muted-foreground">{tag.label}</Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">No tags assigned</span>
            )}
          </div>
        )}

        {editingTags && (
          <div data-testid="tag-editor" className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {relevantTags.map((tag) => (
                <label
                  key={tag.id}
                  className="flex items-center gap-2 text-sm text-foreground cursor-pointer"
                >
                  <input
                    type="checkbox"
                    data-testid={`tag-checkbox-${tag.id}`}
                    checked={selectedTagIds.has(tag.id)}
                    onChange={() => handleToggleTag(tag.id)}
                    className="rounded border-border"
                  />
                  {tag.label}
                  {tag.category === null && (
                    <span className="text-xs text-muted-foreground">(style)</span>
                  )}
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                data-testid="save-tags-btn"
                size="sm"
                onClick={() => void handleSaveTags()}
                disabled={actionLoading}
              >
                {actionLoading ? 'Saving...' : 'Save Tags'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingTags(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border border-border rounded-md p-4 space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">Actions</h2>

        {!showHideConfirm && !showUnhideConfirm && (
          <div className="flex gap-3">
            {listing.status === 'available' && (
              <Button
                data-testid="hide-btn"
                variant="destructive"
                onClick={() => setShowHideConfirm(true)}
                disabled={actionLoading}
              >
                Hide Listing
              </Button>
            )}
            {listing.status === 'hidden' && (
              <Button
                data-testid="unhide-btn"
                onClick={() => setShowUnhideConfirm(true)}
                disabled={actionLoading}
              >
                Restore Listing
              </Button>
            )}
          </div>
        )}

        {showHideConfirm && (
          <div className="space-y-3">
            <p className="text-sm text-foreground">
              Hide <strong>{listing.title}</strong>? It will no longer be visible to buyers.
            </p>
            <textarea
              data-testid="hide-reason-input"
              value={hideReason}
              onChange={(e) => setHideReason(e.target.value)}
              placeholder="Reason for hiding..."
              className="w-full h-20 rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            />
            <div className="flex gap-2">
              <Button
                data-testid="confirm-hide-btn"
                variant="destructive"
                onClick={handleHide}
                disabled={actionLoading}
              >
                {actionLoading ? 'Hiding...' : 'Confirm Hide'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => { setShowHideConfirm(false); setHideReason('') }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {showUnhideConfirm && (
          <div className="space-y-3">
            <p className="text-sm text-foreground">
              Restore <strong>{listing.title}</strong> to available? It will be visible to buyers again.
            </p>
            <div className="flex gap-2">
              <Button
                data-testid="confirm-unhide-btn"
                onClick={handleUnhide}
                disabled={actionLoading}
              >
                {actionLoading ? 'Restoring...' : 'Confirm Restore'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowUnhideConfirm(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {actionError && (
          <p data-testid="action-error" className="text-sm text-error">{actionError}</p>
        )}
        {actionSuccess && (
          <p data-testid="action-success" className="text-sm text-success">{actionSuccess}</p>
        )}
      </div>
    </div>
  )
}

function StatCard({ testId, label, value }: { testId: string; label: string; value: number }) {
  return (
    <div className="border border-border rounded-md p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p data-testid={testId} className="text-2xl font-semibold text-foreground">{value}</p>
    </div>
  )
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'available': return 'bg-success/10 text-success'
    case 'hidden': return 'bg-error/10 text-error'
    case 'sold': return 'bg-muted text-muted-foreground'
    case 'reserved': return 'bg-warning/10 text-warning'
    default: return ''
  }
}
