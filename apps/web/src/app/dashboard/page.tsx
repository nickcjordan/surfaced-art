'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { getDashboard, ApiError } from '@/lib/api'
import type { DashboardResponse } from '@surfaced-art/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { DashboardSkeleton } from './components/dashboard-skeleton'

export default function DashboardPage() {
  const { getIdToken } = useAuth()
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboard = useCallback(async () => {
    try {
      const token = await getIdToken()
      if (!token) {
        setError('Not authenticated')
        return
      }

      const dashboard = await getDashboard(token)
      setData(dashboard)
    } catch (err) {
      if (err instanceof Error && 'status' in err && (err as ApiError).status === 403) {
        setError('You do not have artist access.')
        return
      }
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [getIdToken])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  if (loading) return <DashboardSkeleton />

  if (error) {
    return (
      <div data-testid="dashboard-error" className="text-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button
          variant="outline"
          onClick={() => {
            setLoading(true)
            setError(null)
            fetchDashboard()
          }}
        >
          Try again
        </Button>
      </div>
    )
  }

  if (!data) return null

  const { profile, completion, stats } = data

  return (
    <div data-testid="dashboard-content" className="space-y-6">
      {/* Welcome header */}
      <div data-testid="dashboard-welcome">
        <h1 className="text-2xl font-semibold">Welcome, {profile.displayName}</h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile, listings, and settings.
        </p>
      </div>

      {/* Profile completion */}
      <Card data-testid="profile-completion">
        <CardHeader>
          <CardTitle>Profile Completion</CardTitle>
          <CardDescription>{completion.percentage}% complete</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={completion.percentage} />
          <ul className="space-y-1">
            {completion.fields.map((field) => (
              <li key={field.label} className="flex items-center gap-2 text-sm">
                <span className={field.complete ? 'text-success' : 'text-muted-foreground'}>
                  {field.complete ? '\u2713' : '\u25CB'}
                </span>
                <span className={field.complete ? 'text-foreground' : 'text-muted-foreground'}>
                  {field.label}
                </span>
              </li>
            ))}
          </ul>
          {completion.percentage < 100 && (
            <Button variant="outline" asChild>
              <Link href="/dashboard/profile">Complete your profile</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Quick stats */}
      <div data-testid="dashboard-stats" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-semibold">{stats.totalListings}</p>
            <p className="text-sm text-muted-foreground">Total Listings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-semibold">{stats.availableListings}</p>
            <p className="text-sm text-muted-foreground">Available</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-semibold">{stats.soldListings}</p>
            <p className="text-sm text-muted-foreground">Sold</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-semibold">{stats.totalViews}</p>
            <p className="text-sm text-muted-foreground">Total Views</p>
          </CardContent>
        </Card>
      </div>

      {/* Stripe Connect CTA */}
      {profile.stripeAccountId === null && (
        <Card data-testid="stripe-cta" className="border-warning/50">
          <CardHeader>
            <CardTitle>Set Up Payments</CardTitle>
            <CardDescription>
              Connect your Stripe account to start receiving payments for your artwork.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Connect Stripe</Button>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div data-testid="dashboard-actions" className="flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link href="/dashboard/profile">Edit Profile</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/listings">Manage Listings</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/artist/${profile.slug}`}>View Public Profile</Link>
        </Button>
      </div>
    </div>
  )
}
