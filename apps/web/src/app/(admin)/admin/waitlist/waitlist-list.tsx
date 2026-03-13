'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { getAdminWaitlist, deleteWaitlistEntry } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { AdminWaitlistEntry, PaginatedResponse } from '@surfaced-art/types'

export function AdminWaitlistList() {
  const { getIdToken } = useAuth()
  const [data, setData] = useState<PaginatedResponse<AdminWaitlistEntry> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchWaitlist = useCallback(async (params: { search?: string; page?: number }) => {
    setLoading(true)
    setError(null)
    try {
      const token = await getIdToken()
      if (!token) throw new Error('Not authenticated')
      const result = await getAdminWaitlist(token, {
        search: params.search || undefined,
        page: params.page,
        limit: 20,
      })
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load waitlist')
    } finally {
      setLoading(false)
    }
  }, [getIdToken])

  useEffect(() => {
    void fetchWaitlist({ search, page })
  }, [fetchWaitlist, search, page])

  const handleSearch = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearch(value)
      setPage(1)
    }, 300)
  }

  const handleDelete = async (id: string) => {
    setActionLoading(true)
    try {
      const token = await getIdToken()
      if (!token) throw new Error('Not authenticated')
      await deleteWaitlistEntry(token, id)
      setDeleteTarget(null)
      await fetchWaitlist({ search, page })
    } catch {
      // silently fail — entry may already be deleted
    } finally {
      setActionLoading(false)
    }
  }

  const handleExportCsv = () => {
    if (!data) return
    const header = 'Email,Signed Up'
    const rows = data.data.map((e) =>
      `${e.email},${new Date(e.createdAt).toISOString()}`
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `waitlist-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading && !data) {
    return (
      <div data-testid="admin-waitlist-loading" className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div data-testid="admin-waitlist-error" className="text-center py-12">
        <p className="text-error font-medium">Error loading waitlist</p>
        <p className="text-muted-foreground text-sm mt-1">{error}</p>
      </div>
    )
  }

  return (
    <div data-testid="admin-waitlist-list">
      <div className="flex flex-col sm:flex-row gap-3 mb-6 items-start sm:items-center">
        <input
          data-testid="admin-waitlist-search"
          type="text"
          placeholder="Search by email..."
          onChange={(e) => handleSearch(e.target.value)}
          className="h-10 flex-1 rounded-md border border-border bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground"
        />
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            Total: <span data-testid="waitlist-total-count" className="font-medium text-foreground">{data?.meta.total ?? 0}</span>
          </div>
          <Button
            data-testid="export-csv-btn"
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={!data || data.data.length === 0}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {data && data.data.length === 0 ? (
        <div data-testid="admin-waitlist-empty" className="text-center py-12">
          <p className="text-muted-foreground">No waitlist signups found.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-3 pr-4 font-medium">Email</th>
                  <th className="py-3 pr-4 font-medium">Signed Up</th>
                  <th className="py-3 font-medium w-20"></th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((entry) => (
                  <tr
                    key={entry.id}
                    data-testid={`admin-waitlist-row-${entry.id}`}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 pr-4 text-foreground">{entry.email}</td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      {deleteTarget === entry.id ? (
                        <div className="flex gap-1">
                          <Button
                            data-testid="confirm-delete-btn"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(entry.id)}
                            disabled={actionLoading}
                          >
                            {actionLoading ? '...' : 'Yes'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(null)}
                            disabled={actionLoading}
                          >
                            No
                          </Button>
                        </div>
                      ) : (
                        <button
                          data-testid={`delete-btn-${entry.id}`}
                          onClick={() => setDeleteTarget(entry.id)}
                          className="text-muted-foreground hover:text-error transition-colors text-xs"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.meta.totalPages > 1 && (
            <div data-testid="admin-waitlist-pagination" className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Page {data.meta.page} of {data.meta.totalPages} ({data.meta.total} signups)
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
