'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { getAdminArtists } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { AdminArtistListItem, PaginatedResponse } from '@surfaced-art/types'

const STATUSES = ['approved', 'suspended'] as const

export function AdminArtistList() {
  const { getIdToken } = useAuth()
  const [data, setData] = useState<PaginatedResponse<AdminArtistListItem> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchArtists = useCallback(async (params: { status?: string; search?: string; page?: number }) => {
    setLoading(true)
    setError(null)
    try {
      const token = await getIdToken()
      if (!token) throw new Error('Not authenticated')
      const result = await getAdminArtists(token, {
        status: params.status || undefined,
        search: params.search || undefined,
        page: params.page,
        limit: 20,
      })
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load artists')
    } finally {
      setLoading(false)
    }
  }, [getIdToken])

  useEffect(() => {
    void fetchArtists({ status: statusFilter, search, page })
  }, [fetchArtists, statusFilter, search, page])

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
      <div data-testid="admin-artists-loading" className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div data-testid="admin-artists-error" className="text-center py-12">
        <p className="text-error font-medium">Error loading artists</p>
        <p className="text-muted-foreground text-sm mt-1">{error}</p>
      </div>
    )
  }

  return (
    <div data-testid="admin-artist-list">
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          data-testid="admin-artists-search"
          type="text"
          placeholder="Search by name, slug, or email..."
          onChange={(e) => handleSearch(e.target.value)}
          className="h-10 flex-1 rounded-md border border-border bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground"
        />
        <select
          data-testid="admin-artists-status-filter"
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
        <div data-testid="admin-artists-empty" className="text-center py-12">
          <p className="text-muted-foreground">No artists found.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-3 pr-4 font-medium">Name</th>
                  <th className="py-3 pr-4 font-medium">Slug</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="py-3 pr-4 font-medium">Listings</th>
                  <th className="py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((artist) => (
                  <tr
                    key={artist.id}
                    data-testid={`admin-artist-row-${artist.id}`}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/artists/${artist.id}`}
                        className="text-foreground font-medium hover:text-accent-primary transition-colors"
                      >
                        {artist.displayName}
                      </Link>
                      {artist.isDemo && (
                        <Badge className="ml-2 bg-muted text-muted-foreground text-xs">demo</Badge>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{artist.slug}</td>
                    <td className="py-3 pr-4">
                      <Badge className={statusBadgeClass(artist.status)}>{artist.status}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{artist.listingCount}</td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(artist.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.meta.totalPages > 1 && (
            <div data-testid="admin-artists-pagination" className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Page {data.meta.page} of {data.meta.totalPages} ({data.meta.total} artists)
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
    case 'approved': return 'bg-success/10 text-success'
    case 'suspended': return 'bg-error/10 text-error'
    default: return ''
  }
}
