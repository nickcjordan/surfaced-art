'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { getAdminListings } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { AdminListingListItem, PaginatedResponse } from '@surfaced-art/types'

const STATUSES = ['available', 'hidden', 'sold', 'reserved'] as const

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function AdminListingList() {
  const { getIdToken } = useAuth()
  const [data, setData] = useState<PaginatedResponse<AdminListingListItem> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchListings = useCallback(async (params: { status?: string; search?: string; page?: number }) => {
    setLoading(true)
    setError(null)
    try {
      const token = await getIdToken()
      if (!token) throw new Error('Not authenticated')
      const result = await getAdminListings(token, {
        status: params.status || undefined,
        search: params.search || undefined,
        page: params.page,
        limit: 20,
      })
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listings')
    } finally {
      setLoading(false)
    }
  }, [getIdToken])

  useEffect(() => {
    void fetchListings({ status: statusFilter, search, page })
  }, [fetchListings, statusFilter, search, page])

  const handleSearch = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearch(value)
      setPage(1)
    }, 300)
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    setPage(1)
  }

  if (loading && !data) {
    return (
      <div data-testid="admin-listings-loading" className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div data-testid="admin-listings-error" className="text-center py-12">
        <p className="text-error font-medium">Error loading listings</p>
        <p className="text-muted-foreground text-sm mt-1">{error}</p>
      </div>
    )
  }

  return (
    <div data-testid="admin-listing-list">
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          data-testid="admin-listings-search"
          type="text"
          placeholder="Search by title or description..."
          onChange={(e) => handleSearch(e.target.value)}
          className="h-10 flex-1 rounded-md border border-border bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground"
        />
        <select
          data-testid="admin-listings-status-filter"
          value={statusFilter}
          onChange={(e) => handleStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-border bg-transparent px-3 text-sm text-foreground"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {data && data.data.length === 0 ? (
        <div data-testid="admin-listings-empty" className="text-center py-12">
          <p className="text-muted-foreground">No listings found.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-3 pr-4 font-medium">Title</th>
                  <th className="py-3 pr-4 font-medium">Artist</th>
                  <th className="py-3 pr-4 font-medium">Category</th>
                  <th className="py-3 pr-4 font-medium">Price</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((listing) => (
                  <tr
                    key={listing.id}
                    data-testid={`admin-listing-row-${listing.id}`}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/listings/${listing.id}`}
                        className="text-foreground font-medium hover:text-accent-primary transition-colors"
                      >
                        {listing.title}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{listing.artist.displayName}</td>
                    <td className="py-3 pr-4">
                      <Badge>{listing.category}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-foreground">{formatPrice(listing.price)}</td>
                    <td className="py-3 pr-4">
                      <Badge className={statusBadgeClass(listing.status)}>{listing.status}</Badge>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(listing.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.meta.totalPages > 1 && (
            <div data-testid="admin-listings-pagination" className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Page {data.meta.page} of {data.meta.totalPages} ({data.meta.total} listings)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-sm border border-border rounded-md disabled:opacity-50 hover:bg-muted/50 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                  disabled={page >= data.meta.totalPages}
                  className="px-3 py-1.5 text-sm border border-border rounded-md disabled:opacity-50 hover:bg-muted/50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
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
