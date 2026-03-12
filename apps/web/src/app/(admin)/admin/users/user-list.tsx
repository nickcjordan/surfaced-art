'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { getAdminUsers } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import type { AdminUserListItem, PaginatedResponse } from '@surfaced-art/types'

const ROLES = ['buyer', 'artist', 'admin', 'curator', 'moderator'] as const

export function AdminUserList() {
  const { getIdToken } = useAuth()
  const [data, setData] = useState<PaginatedResponse<AdminUserListItem> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchUsers = useCallback(async (params: { search?: string; role?: string; page?: number }) => {
    setLoading(true)
    setError(null)
    try {
      const token = await getIdToken()
      if (!token) throw new Error('Not authenticated')
      const result = await getAdminUsers(token, {
        search: params.search || undefined,
        role: params.role || undefined,
        page: params.page,
        limit: 20,
      })
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [getIdToken])

  useEffect(() => {
    void fetchUsers({ search, role: roleFilter, page })
  }, [fetchUsers, roleFilter, page]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      void fetchUsers({ search: value, role: roleFilter, page: 1 })
    }, 300)
  }

  const handleRoleFilter = (value: string) => {
    setRoleFilter(value)
    setPage(1)
  }

  if (loading && !data) {
    return (
      <div data-testid="admin-users-loading" className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div data-testid="admin-users-error" className="text-center py-12">
        <p className="text-error font-medium">Error loading users</p>
        <p className="text-muted-foreground text-sm mt-1">{error}</p>
      </div>
    )
  }

  return (
    <div data-testid="admin-user-list">
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Input
          data-testid="admin-users-search"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <select
          data-testid="admin-users-role-filter"
          value={roleFilter}
          onChange={(e) => handleRoleFilter(e.target.value)}
          className="h-10 rounded-md border border-border bg-transparent px-3 text-sm text-foreground"
        >
          <option value="">All roles</option>
          {ROLES.map((role) => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      </div>

      {data && data.data.length === 0 ? (
        <div data-testid="admin-users-empty" className="text-center py-12">
          <p className="text-muted-foreground">No users found.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-3 pr-4 font-medium">Name</th>
                  <th className="py-3 pr-4 font-medium">Email</th>
                  <th className="py-3 pr-4 font-medium">Roles</th>
                  <th className="py-3 pr-4 font-medium">Joined</th>
                  <th className="py-3 font-medium">Artist</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((user) => (
                  <tr
                    key={user.id}
                    data-testid={`admin-user-row-${user.id}`}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="text-foreground font-medium hover:text-accent-primary transition-colors"
                      >
                        {user.fullName}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{user.email}</td>
                    <td className="py-3 pr-4">
                      <div className="flex gap-1 flex-wrap">
                        {user.roles.map((role) => (
                          <Badge key={role} className={roleBadgeClass(role)}>{role}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      {user.hasArtistProfile && (
                        <span data-testid="has-artist-profile" className="text-accent-primary text-xs font-medium">
                          Yes
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.meta.totalPages > 1 && (
            <div data-testid="admin-users-pagination" className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Page {data.meta.page} of {data.meta.totalPages} ({data.meta.total} users)
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

function roleBadgeClass(role: string): string {
  switch (role) {
    case 'admin': return 'bg-error/10 text-error'
    case 'artist': return 'bg-accent-primary/10 text-accent-primary'
    case 'moderator': return 'bg-warning/10 text-warning'
    case 'curator': return 'bg-info/10 text-info'
    default: return ''
  }
}
