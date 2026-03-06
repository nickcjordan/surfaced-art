'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/lib/auth'
import { getMyListings, deleteMyListing, updateListingAvailability } from '@/lib/api'
import { formatCurrency } from '@surfaced-art/utils'
import type { MyListingListItem } from '@surfaced-art/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'available', label: 'Available' },
  { key: 'reserved_artist', label: 'Reserved' },
  { key: 'sold', label: 'Sold' },
] as const

type StatusFilter = (typeof STATUS_FILTERS)[number]['key']

function statusLabel(status: string): string {
  switch (status) {
    case 'available':
      return 'Available'
    case 'reserved_artist':
      return 'Reserved'
    case 'reserved_system':
      return 'Processing'
    case 'sold':
      return 'Sold'
    default:
      return status
  }
}

function statusClassName(status: string): string {
  switch (status) {
    case 'available':
      return 'bg-success/10 text-success'
    case 'sold':
      return 'bg-muted text-muted-foreground'
    case 'reserved_artist':
    case 'reserved_system':
      return 'bg-warning/10 text-warning'
    default:
      return ''
  }
}

export function ListingsTable() {
  const { getIdToken } = useAuth()
  const router = useRouter()
  const [listings, setListings] = useState<MyListingListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const fetchListings = useCallback(
    async (status?: string) => {
      try {
        setLoading(true)
        setError(null)
        const token = await getIdToken()
        if (!token) return

        const params: Record<string, string> = {}
        if (status && status !== 'all') {
          params.status = status
        }
        const result = await getMyListings(token, params)
        setListings(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load listings')
      } finally {
        setLoading(false)
      }
    },
    [getIdToken],
  )

  useEffect(() => {
    fetchListings(activeFilter)
  }, [fetchListings, activeFilter])

  async function handleDelete(id: string) {
    try {
      const token = await getIdToken()
      if (!token) return

      await deleteMyListing(token, id)
      setListings((prev) => prev.filter((l) => l.id !== id))
      setDeleteConfirmId(null)
    } catch {
      // Could show toast here in the future
    }
  }

  async function handleToggleAvailability(listing: MyListingListItem) {
    const newStatus = listing.status === 'available' ? 'reserved_artist' : 'available'

    // Optimistic update
    setListings((prev) =>
      prev.map((l) => (l.id === listing.id ? { ...l, status: newStatus as MyListingListItem['status'] } : l)),
    )

    try {
      const token = await getIdToken()
      if (!token) return

      await updateListingAvailability(token, listing.id, { status: newStatus })
    } catch {
      // Revert on error
      setListings((prev) =>
        prev.map((l) => (l.id === listing.id ? { ...l, status: listing.status } : l)),
      )
    }
  }

  function handleFilterChange(filter: StatusFilter) {
    setActiveFilter(filter)
    setDeleteConfirmId(null)
  }

  if (loading) {
    return (
      <div data-testid="listings-skeleton" className="space-y-4">
        <div className="flex gap-2">
          {STATUS_FILTERS.map((f) => (
            <Skeleton key={f.key} className="h-9 w-20" />
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card data-testid="listings-error">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => fetchListings(activeFilter)}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              data-testid={`status-filter-${f.key}`}
              data-active={activeFilter === f.key ? 'true' : 'false'}
              onClick={() => handleFilterChange(f.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeFilter === f.key
                  ? 'bg-accent-primary/10 text-accent-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Button
          data-testid="new-listing-button"
          onClick={() => router.push('/dashboard/listings/new')}
        >
          New Listing
        </Button>
      </div>

      {/* Empty state */}
      {listings.length === 0 && (
        <Card data-testid="listings-empty-state">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              You don&apos;t have any listings yet.
            </p>
            <Button onClick={() => router.push('/dashboard/listings/new')}>
              Create First Listing
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Listings list */}
      {listings.map((listing) => (
        <Card key={listing.id} data-testid="listing-row" className="py-0">
          <CardContent className="flex items-center gap-4 py-4">
            {/* Thumbnail */}
            {listing.primaryImage && (
              <div data-testid="listing-thumbnail" className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                <Image
                  src={listing.primaryImage.url}
                  alt={listing.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
            {!listing.primaryImage && (
              <div className="w-16 h-16 rounded-md flex-shrink-0 bg-muted flex items-center justify-center">
                <span className="text-xs text-muted-foreground">No img</span>
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{listing.title}</p>
              <p className="text-sm text-muted-foreground">{listing.medium}</p>
            </div>

            {/* Price */}
            <div className="text-sm font-semibold whitespace-nowrap">
              {formatCurrency(listing.price)}
            </div>

            {/* Status */}
            <Badge className={statusClassName(listing.status)}>
              {statusLabel(listing.status)}
            </Badge>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {deleteConfirmId === listing.id ? (
                <>
                  <Button
                    data-testid="listing-delete-confirm"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(listing.id)}
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
                </>
              ) : (
                <>
                  {(listing.status === 'available' || listing.status === 'reserved_artist') && (
                    <Button
                      data-testid="availability-toggle"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleAvailability(listing)}
                    >
                      {listing.status === 'available' ? 'Reserve' : 'Unreserve'}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/dashboard/listings/${listing.id}/edit`)}
                  >
                    Edit
                  </Button>
                  <Button
                    data-testid="listing-delete-button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteConfirmId(listing.id)}
                  >
                    Delete
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
