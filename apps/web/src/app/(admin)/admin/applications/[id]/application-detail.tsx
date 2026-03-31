'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { getAdminApplication, getAdminUsers, approveApplication, rejectApplication, deleteApplication } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { AdminApplicationDetailResponse } from '@surfaced-art/types'

export function AdminApplicationDetail({ applicationId }: { applicationId: string }) {
  const { getIdToken } = useAuth()
  const [app, setApp] = useState<AdminApplicationDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [showApproveConfirm, setShowApproveConfirm] = useState(false)
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [rejectNotes, setRejectNotes] = useState('')
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const router = useRouter()

  const fetchApp = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await getIdToken()
      if (!token) throw new Error('Not authenticated')
      const result = await getAdminApplication(token, applicationId)
      setApp(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load application')
    } finally {
      setLoading(false)
    }
  }, [getIdToken, applicationId])

  useEffect(() => {
    void fetchApp()
  }, [fetchApp])

  const resolveUserId = async (email: string): Promise<string> => {
    const token = await getIdToken()
    if (!token) throw new Error('Not authenticated')
    const users = await getAdminUsers(token, { search: email, limit: 1 })
    const match = users.data.find((u) => u.email === email)
    if (!match) throw new Error('No user account found for this applicant. They must sign up first.')
    return match.id
  }

  const handleApprove = async () => {
    if (!app) return
    setActionError(null)
    setActionLoading(true)
    try {
      const userId = await resolveUserId(app.email)
      const token = await getIdToken()
      if (!token) throw new Error('Not authenticated')
      await approveApplication(token, userId, undefined)
      setActionSuccess('Application approved successfully')
      setShowApproveConfirm(false)
      await fetchApp()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to approve')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!app) return
    setActionError(null)
    setActionLoading(true)
    try {
      const userId = await resolveUserId(app.email)
      const token = await getIdToken()
      if (!token) throw new Error('Not authenticated')
      await rejectApplication(token, userId, rejectNotes || undefined)
      setActionSuccess('Application rejected')
      setShowRejectConfirm(false)
      setRejectNotes('')
      await fetchApp()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to reject')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!app) return
    setActionError(null)
    setActionLoading(true)
    try {
      const token = await getIdToken()
      if (!token) throw new Error('Not authenticated')
      await deleteApplication(token, app.id)
      router.push('/admin/applications')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div data-testid="admin-application-detail-loading" className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (error || !app) {
    return (
      <div data-testid="admin-application-detail-error" className="text-center py-12">
        <p className="text-error font-medium">Error loading application</p>
        <p className="text-muted-foreground text-sm mt-1">{error}</p>
      </div>
    )
  }

  const isPending = app.status === 'pending'

  return (
    <div data-testid="admin-application-detail" className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/admin/applications" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          &larr; Back to applications
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl font-semibold text-foreground">{app.fullName}</h1>
          <Badge className={statusBadgeClass(app.status)}>{app.status}</Badge>
        </div>
        <p className="text-muted-foreground">{app.email}</p>
      </div>

      {/* Details */}
      <div className="space-y-6">
        {/* Statement */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-1">Artist Statement</h2>
          <p className="text-foreground whitespace-pre-wrap">{app.statement}</p>
        </div>

        {/* Exhibition History */}
        {app.exhibitionHistory && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-1">Exhibition History</h2>
            <p className="text-foreground whitespace-pre-wrap">{app.exhibitionHistory}</p>
          </div>
        )}

        {/* Categories */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-1">Categories</h2>
          <div className="flex gap-1 flex-wrap">
            {app.categories.map((cat) => (
              <Badge key={cat}>{cat}</Badge>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {app.instagramUrl && (
            <div>
              <span className="text-muted-foreground">Instagram:</span>{' '}
              <a
                href={app.instagramUrl}
                data-testid="instagram-link"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-primary hover:underline"
              >
                {app.instagramUrl}
              </a>
            </div>
          )}
          {app.websiteUrl && (
            <div>
              <span className="text-muted-foreground">Website:</span>{' '}
              <a
                href={app.websiteUrl}
                data-testid="website-link"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-primary hover:underline"
              >
                {app.websiteUrl}
              </a>
            </div>
          )}
        </div>

        {/* Submission info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Submitted:</span>{' '}
            <span className="text-foreground">{new Date(app.submittedAt).toLocaleDateString()}</span>
          </div>
          {app.reviewedAt && (
            <div>
              <span className="text-muted-foreground">Reviewed:</span>{' '}
              <span className="text-foreground">
                {new Date(app.reviewedAt).toLocaleDateString()}
                {app.reviewerName && ` by ${app.reviewerName}`}
              </span>
            </div>
          )}
          {app.reviewNotes && (
            <div className="sm:col-span-2">
              <span className="text-muted-foreground">Review Notes:</span>{' '}
              <span className="text-foreground">{app.reviewNotes}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {(isPending || app.status === 'rejected') && (
        <div className="border border-border rounded-md p-4 space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">Actions</h2>

          {!showApproveConfirm && !showRejectConfirm && !showDeleteConfirm && (
            <div className="flex gap-3">
              {isPending && (
                <>
                  <Button
                    data-testid="approve-btn"
                    onClick={() => setShowApproveConfirm(true)}
                    disabled={actionLoading}
                  >
                    Approve
                  </Button>
                  <Button
                    data-testid="reject-btn"
                    variant="destructive"
                    onClick={() => setShowRejectConfirm(true)}
                    disabled={actionLoading}
                  >
                    Reject
                  </Button>
                </>
              )}
              <Button
                data-testid="delete-btn"
                variant="ghost"
                className="text-error hover:text-error"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={actionLoading}
              >
                Delete
              </Button>
            </div>
          )}

          {showApproveConfirm && (
            <div className="space-y-3">
              <p className="text-sm text-foreground">
                Approve <strong>{app.fullName}</strong>? This will create their artist profile and grant the artist role.
              </p>
              <div className="flex gap-2">
                <Button
                  data-testid="confirm-approve-btn"
                  onClick={handleApprove}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Approving...' : 'Confirm Approve'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowApproveConfirm(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {showRejectConfirm && (
            <div className="space-y-3">
              <p className="text-sm text-foreground">
                Reject <strong>{app.fullName}</strong>&apos;s application?
              </p>
              <textarea
                data-testid="reject-notes-input"
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="Reason for rejection (optional)..."
                className="w-full h-20 rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
              />
              <div className="flex gap-2">
                <Button
                  data-testid="confirm-reject-btn"
                  variant="destructive"
                  onClick={handleReject}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => { setShowRejectConfirm(false); setRejectNotes('') }}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {showDeleteConfirm && (
            <div className="space-y-3">
              <p className="text-sm text-foreground">
                Permanently delete <strong>{app.fullName}</strong>&apos;s application? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  data-testid="confirm-delete-btn"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Deleting...' : 'Confirm Delete'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

        </div>
      )}

      {actionError && (
        <p data-testid="action-error" className="text-sm text-error">{actionError}</p>
      )}
      {actionSuccess && (
        <p data-testid="action-success" className="text-sm text-success">{actionSuccess}</p>
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
