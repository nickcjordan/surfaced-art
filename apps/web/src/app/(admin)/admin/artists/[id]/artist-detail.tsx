'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { getAdminArtist, updateAdminArtist, suspendArtist, unsuspendArtist } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { AdminArtistDetailResponse } from '@surfaced-art/types'

export function AdminArtistDetail({ artistId }: { artistId: string }) {
  const { getIdToken } = useAuth()
  const [artist, setArtist] = useState<AdminArtistDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // Suspend state
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')

  // Unsuspend state
  const [showUnsuspendConfirm, setShowUnsuspendConfirm] = useState(false)

  // Edit state
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    location: '',
    websiteUrl: '',
    instagramUrl: '',
  })

  const fetchArtist = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await getIdToken()
      if (!token) throw new Error('Not authenticated')
      const result = await getAdminArtist(token, artistId)
      setArtist(result)
      setEditForm({
        displayName: result.displayName,
        bio: result.bio,
        location: result.location,
        websiteUrl: result.websiteUrl ?? '',
        instagramUrl: result.instagramUrl ?? '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load artist')
    } finally {
      setLoading(false)
    }
  }, [getIdToken, artistId])

  useEffect(() => {
    void fetchArtist()
  }, [fetchArtist])

  const handleSuspend = async () => {
    setActionError(null)
    setActionSuccess(null)
    setActionLoading(true)
    try {
      const token = await getIdToken()
      if (!token) throw new Error('Not authenticated')
      await suspendArtist(token, artistId, suspendReason)
      setActionSuccess('Artist suspended successfully')
      setShowSuspendConfirm(false)
      setSuspendReason('')
      await fetchArtist()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to suspend')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnsuspend = async () => {
    setActionError(null)
    setActionSuccess(null)
    setActionLoading(true)
    try {
      const token = await getIdToken()
      if (!token) throw new Error('Not authenticated')
      await unsuspendArtist(token, artistId)
      setActionSuccess('Artist unsuspended successfully')
      setShowUnsuspendConfirm(false)
      await fetchArtist()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to unsuspend')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSaveEdit = async () => {
    setActionError(null)
    setActionSuccess(null)
    setActionLoading(true)
    try {
      const token = await getIdToken()
      if (!token) throw new Error('Not authenticated')
      const data: Record<string, unknown> = {}
      if (editForm.displayName !== artist?.displayName) data.displayName = editForm.displayName
      if (editForm.bio !== artist?.bio) data.bio = editForm.bio
      if (editForm.location !== artist?.location) data.location = editForm.location
      if (editForm.websiteUrl !== (artist?.websiteUrl ?? '')) data.websiteUrl = editForm.websiteUrl || null
      if (editForm.instagramUrl !== (artist?.instagramUrl ?? '')) data.instagramUrl = editForm.instagramUrl || null

      if (Object.keys(data).length === 0) {
        setEditing(false)
        return
      }

      await updateAdminArtist(token, artistId, data)
      setActionSuccess('Profile updated successfully')
      setEditing(false)
      await fetchArtist()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div data-testid="admin-artist-detail-loading" className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (error || !artist) {
    return (
      <div data-testid="admin-artist-detail-error" className="text-center py-12">
        <p className="text-error font-medium">Error loading artist</p>
        <p className="text-muted-foreground text-sm mt-1">{error}</p>
      </div>
    )
  }

  return (
    <div data-testid="admin-artist-detail" className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/admin/artists" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          &larr; Back to artists
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl font-semibold text-foreground">{artist.displayName}</h1>
          <Badge className={statusBadgeClass(artist.status)}>{artist.status}</Badge>
          {artist.isDemo && <Badge className="bg-muted text-muted-foreground">demo</Badge>}
        </div>
        <p className="text-muted-foreground">{artist.user.email}</p>
        <div className="flex gap-3 mt-2 text-sm">
          <Link
            href={`/artist/${artist.slug}`}
            data-testid="public-profile-link"
            className="text-accent-primary hover:underline"
          >
            View public profile
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard testId="stat-total-listings" label="Total Listings" value={artist.stats.totalListings} />
        <StatCard testId="stat-available" label="Available" value={artist.stats.availableListings} />
        <StatCard testId="stat-sold" label="Sold" value={artist.stats.soldListings} />
        <StatCard testId="stat-followers" label="Followers" value={artist.stats.followerCount} />
      </div>

      {/* Profile info or edit form */}
      {editing ? (
        <div data-testid="edit-form" className="border border-border rounded-md p-4 space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">Edit Profile</h2>
          <div className="space-y-3">
            <div>
              <label htmlFor="edit-displayName" className="text-sm text-muted-foreground block mb-1">Display Name</label>
              <input
                id="edit-displayName"
                data-testid="edit-displayName"
                value={editForm.displayName}
                onChange={(e) => setEditForm((f) => ({ ...f, displayName: e.target.value }))}
                className="h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm text-foreground"
              />
            </div>
            <div>
              <label htmlFor="edit-bio" className="text-sm text-muted-foreground block mb-1">Bio</label>
              <textarea
                id="edit-bio"
                data-testid="edit-bio"
                value={editForm.bio}
                onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                className="w-full h-24 rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label htmlFor="edit-location" className="text-sm text-muted-foreground block mb-1">Location</label>
              <input
                id="edit-location"
                data-testid="edit-location"
                value={editForm.location}
                onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                className="h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm text-foreground"
              />
            </div>
            <div>
              <label htmlFor="edit-websiteUrl" className="text-sm text-muted-foreground block mb-1">Website URL</label>
              <input
                id="edit-websiteUrl"
                data-testid="edit-websiteUrl"
                value={editForm.websiteUrl}
                onChange={(e) => setEditForm((f) => ({ ...f, websiteUrl: e.target.value }))}
                className="h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm text-foreground"
              />
            </div>
            <div>
              <label htmlFor="edit-instagramUrl" className="text-sm text-muted-foreground block mb-1">Instagram URL</label>
              <input
                id="edit-instagramUrl"
                data-testid="edit-instagramUrl"
                value={editForm.instagramUrl}
                onChange={(e) => setEditForm((f) => ({ ...f, instagramUrl: e.target.value }))}
                className="h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm text-foreground"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button data-testid="save-edit-btn" onClick={handleSaveEdit} disabled={actionLoading}>
              {actionLoading ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)} disabled={actionLoading}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <h2 className="text-sm font-medium text-muted-foreground">Profile Details</h2>
            <Button data-testid="edit-btn" variant="outline" size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <span className="text-muted-foreground">Bio:</span>
              <p className="text-foreground mt-1 whitespace-pre-wrap">{artist.bio}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-muted-foreground">Location:</span>{' '}
                <span className="text-foreground">{artist.location || '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Slug:</span>{' '}
                <span className="text-foreground">{artist.slug}</span>
              </div>
              {artist.websiteUrl && (
                <div>
                  <span className="text-muted-foreground">Website:</span>{' '}
                  <a href={artist.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">
                    {artist.websiteUrl}
                  </a>
                </div>
              )}
              {artist.instagramUrl && (
                <div>
                  <span className="text-muted-foreground">Instagram:</span>{' '}
                  <a href={artist.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">
                    {artist.instagramUrl}
                  </a>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Categories:</span>{' '}
                <span className="text-foreground">
                  {artist.categories.length > 0 ? artist.categories.join(', ') : '—'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Commissions:</span>{' '}
                <span className="text-foreground">{artist.commissionsOpen ? 'Open' : 'Closed'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Stripe:</span>{' '}
                <span className="text-foreground">{artist.hasStripeAccount ? 'Connected' : 'Not connected'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Roles:</span>{' '}
                <span className="text-foreground">{artist.user.roles.join(', ')}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span>{' '}
                <span className="text-foreground">{new Date(artist.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Updated:</span>{' '}
                <span className="text-foreground">{new Date(artist.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suspend / Unsuspend Actions */}
      <div className="border border-border rounded-md p-4 space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">Actions</h2>

        {!showSuspendConfirm && !showUnsuspendConfirm && (
          <div className="flex gap-3">
            {artist.status === 'approved' && (
              <Button
                data-testid="suspend-btn"
                variant="destructive"
                onClick={() => setShowSuspendConfirm(true)}
                disabled={actionLoading}
              >
                Suspend
              </Button>
            )}
            {artist.status === 'suspended' && (
              <Button
                data-testid="unsuspend-btn"
                onClick={() => setShowUnsuspendConfirm(true)}
                disabled={actionLoading}
              >
                Unsuspend
              </Button>
            )}
          </div>
        )}

        {showSuspendConfirm && (
          <div className="space-y-3">
            <p className="text-sm text-foreground">
              Suspend <strong>{artist.displayName}</strong>? Their listings will be hidden from public view.
            </p>
            <textarea
              data-testid="suspend-reason-input"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Reason for suspension..."
              className="w-full h-20 rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            />
            <div className="flex gap-2">
              <Button
                data-testid="confirm-suspend-btn"
                variant="destructive"
                onClick={handleSuspend}
                disabled={actionLoading}
              >
                {actionLoading ? 'Suspending...' : 'Confirm Suspend'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => { setShowSuspendConfirm(false); setSuspendReason('') }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {showUnsuspendConfirm && (
          <div className="space-y-3">
            <p className="text-sm text-foreground">
              Unsuspend <strong>{artist.displayName}</strong>? Their profile and listings will become visible again.
            </p>
            <div className="flex gap-2">
              <Button
                data-testid="confirm-unsuspend-btn"
                onClick={handleUnsuspend}
                disabled={actionLoading}
              >
                {actionLoading ? 'Unsuspending...' : 'Confirm Unsuspend'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowUnsuspendConfirm(false)}
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
    case 'approved': return 'bg-success/10 text-success'
    case 'suspended': return 'bg-error/10 text-error'
    default: return ''
  }
}
