'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { getAdminApplications, getApplicationStats } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { AdminApplicationListItem, PaginatedResponse } from '@surfaced-art/types'

const STATUSES = ['pending', 'approved', 'rejected'] as const

export function AdminApplicationList() {
  const { getIdToken } = useAuth()
  const [data, setData] = useState<PaginatedResponse<AdminApplicationListItem> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<{ pending: number; approved: number; rejected: number } | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const fetchStats = useCallback(async () => {
    try {
      const token = await getIdToken()
      if (!token) return
      const result = await getApplicationStats(token)
      setStats(result)
    } catch {
      // Stats are non-critical — fail silently
    }
  }, [getIdToken])

  const fetchApplications = useCallback(async (params: { status?: string; page?: number }) => {
    setLoading(true)
    setError(null)
    try {
      const token = await getIdToken()
      if (!token) throw new Error('Not authenticated')
      const result = await getAdminApplications(token, {
        status: params.status || undefined,
        page: params.page,
        limit: 20,
      })
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }, [getIdToken])

  useEffect(() => {
    void fetchStats()
    void fetchApplications({ status: statusFilter, page })
  }, [fetchStats, fetchApplications, statusFilter, page])

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    setPage(1)
  }

  if (loading && !data) {
    return (
      <div data-testid="admin-applications-loading" className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div data-testid="admin-applications-error" className="text-center py-12">
        <p className="text-error font-medium">Error loading applications</p>
        <p className="text-muted-foreground text-sm mt-1">{error}</p>
      </div>
    )
  }

  return (
    <div data-testid="admin-application-list">
      {/* KPI Stats */}
      {stats && (
        <div data-testid="application-stats" className="grid grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => handleStatusFilter('pending')}
            className={cn(
              'rounded-md border p-4 text-center transition-colors',
              statusFilter === 'pending'
                ? 'border-warning bg-warning/5'
                : 'border-border hover:border-warning/50',
            )}
          >
            <p data-testid="stat-pending" className="text-2xl font-semibold text-warning">{stats.pending}</p>
            <p className="text-xs text-muted-foreground mt-1">Pending</p>
          </button>
          <button
            onClick={() => handleStatusFilter('approved')}
            className={cn(
              'rounded-md border p-4 text-center transition-colors',
              statusFilter === 'approved'
                ? 'border-success bg-success/5'
                : 'border-border hover:border-success/50',
            )}
          >
            <p data-testid="stat-approved" className="text-2xl font-semibold text-success">{stats.approved}</p>
            <p className="text-xs text-muted-foreground mt-1">Approved</p>
          </button>
          <button
            onClick={() => handleStatusFilter('rejected')}
            className={cn(
              'rounded-md border p-4 text-center transition-colors',
              statusFilter === 'rejected'
                ? 'border-error bg-error/5'
                : 'border-border hover:border-error/50',
            )}
          >
            <p data-testid="stat-rejected" className="text-2xl font-semibold text-error">{stats.rejected}</p>
            <p className="text-xs text-muted-foreground mt-1">Rejected</p>
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select
          data-testid="admin-applications-status-filter"
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
        <div data-testid="admin-applications-empty" className="text-center py-12">
          <p className="text-muted-foreground">No applications found.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-3 pr-4 font-medium">Name</th>
                  <th className="py-3 pr-4 font-medium">Email</th>
                  <th className="py-3 pr-4 font-medium">Categories</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="py-3 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((app) => (
                  <tr
                    key={app.id}
                    data-testid={`admin-application-row-${app.id}`}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/applications/${app.id}`}
                        className="text-foreground font-medium hover:text-accent-primary transition-colors"
                      >
                        {app.fullName}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{app.email}</td>
                    <td className="py-3 pr-4">
                      <div className="flex gap-1 flex-wrap">
                        {app.categories.map((cat) => (
                          <Badge key={cat}>{cat}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge className={statusBadgeClass(app.status)}>{app.status}</Badge>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(app.submittedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.meta.totalPages > 1 && (
            <div data-testid="admin-applications-pagination" className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Page {data.meta.page} of {data.meta.totalPages} ({data.meta.total} applications)
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
    case 'pending': return 'bg-warning/10 text-warning'
    case 'approved': return 'bg-success/10 text-success'
    case 'rejected': return 'bg-error/10 text-error'
    default: return ''
  }
}
