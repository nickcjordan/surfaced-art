'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { getAdminUser, grantRole, revokeRole } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { AdminUserDetailResponse, UserRoleType } from '@surfaced-art/types'

const ALL_ROLES: UserRoleType[] = ['buyer', 'artist', 'admin', 'curator', 'moderator']

export function AdminUserDetail({ userId }: { userId: string }) {
  const { getIdToken } = useAuth()
  const [user, setUser] = useState<AdminUserDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRoleType | ''>('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchUser = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await getIdToken()
      if (!token) throw new Error('Not authenticated')
      const result = await getAdminUser(token, userId)
      setUser(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user')
    } finally {
      setLoading(false)
    }
  }, [getIdToken, userId])

  useEffect(() => {
    void fetchUser()
  }, [fetchUser])

  const handleGrant = async () => {
    setActionError(null)
    setActionLoading(true)
    try {
      const token = await getIdToken()
      if (!token) throw new Error('Not authenticated')
      await grantRole(token, userId, effectiveSelectedRole as UserRoleType)
      await fetchUser()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to grant role')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRevoke = async (role: UserRoleType) => {
    setActionError(null)
    setActionLoading(true)
    try {
      const token = await getIdToken()
      if (!token) throw new Error('Not authenticated')
      await revokeRole(token, userId, role)
      await fetchUser()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to revoke role')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div data-testid="admin-user-detail-loading" className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div data-testid="admin-user-detail-error" className="text-center py-12">
        <p className="text-error font-medium">Error loading user</p>
        <p className="text-muted-foreground text-sm mt-1">{error}</p>
      </div>
    )
  }

  const existingRoles = user.roles.map((r) => r.role)
  const grantableRoles = ALL_ROLES.filter((r) => !existingRoles.includes(r))

  // Sync selectedRole to the first grantable role when user data changes
  const effectiveSelectedRole = grantableRoles.includes(selectedRole as UserRoleType)
    ? (selectedRole as UserRoleType)
    : grantableRoles[0] ?? ''

  return (
    <div data-testid="admin-user-detail" className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/admin/users" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          &larr; Back to users
        </Link>
        <h1 className="text-2xl font-semibold text-foreground mt-2">{user.fullName}</h1>
        <p className="text-muted-foreground">{user.email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard testId="stat-orders" label="Orders" value={user.stats.orderCount} />
        <StatCard testId="stat-reviews" label="Reviews" value={user.stats.reviewCount} />
        <StatCard testId="stat-saves" label="Saves" value={user.stats.saveCount} />
        <StatCard testId="stat-follows" label="Follows" value={user.stats.followCount} />
      </div>

      {/* Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Joined:</span>{' '}
          <span className="text-foreground">{new Date(user.createdAt).toLocaleDateString()}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Last active:</span>{' '}
          <span className="text-foreground">
            {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : 'Never'}
          </span>
        </div>
      </div>

      {/* Artist Profile */}
      {user.artistProfile && (
        <div className="border border-border rounded-md p-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Artist Profile</h2>
          <Link
            href={`/admin/artists/${user.artistProfile.id}`}
            data-testid="artist-profile-link"
            className="text-accent-primary hover:underline font-medium"
          >
            {user.artistProfile.displayName}
          </Link>
          <span className="ml-2 text-sm text-muted-foreground">({user.artistProfile.status})</span>
        </div>
      )}

      {/* Roles */}
      <div className="border border-border rounded-md p-4 space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">Roles</h2>
        <div className="space-y-2">
          {user.roles.map((r) => (
            <div key={r.role} data-testid={`role-${r.role}`} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className={roleBadgeClass(r.role)}>{r.role}</Badge>
                <span className="text-xs text-muted-foreground">
                  Granted {new Date(r.grantedAt).toLocaleDateString()}
                </span>
              </div>
              <button
                data-testid={`revoke-role-${r.role}`}
                onClick={() => handleRevoke(r.role)}
                disabled={actionLoading}
                className="text-xs text-error hover:underline disabled:opacity-50"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>

        {grantableRoles.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <select
              data-testid="grant-role-select"
              value={effectiveSelectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRoleType)}
              className="h-9 rounded-md border border-border bg-transparent px-3 text-sm text-foreground"
            >
              {grantableRoles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <Button
              data-testid="grant-role-btn"
              size="sm"
              onClick={handleGrant}
              disabled={actionLoading}
            >
              Grant Role
            </Button>
          </div>
        )}

        {actionError && (
          <p data-testid="role-action-error" className="text-sm text-error">{actionError}</p>
        )}
      </div>
    </div>
  )
}

function StatCard({ testId, label, value }: { testId: string; label: string; value: number }) {
  return (
    <div data-testid={testId} className="border border-border rounded-md p-3 text-center">
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
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
