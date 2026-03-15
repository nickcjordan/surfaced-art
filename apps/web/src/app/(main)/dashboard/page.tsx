'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DashboardSkeleton } from './components/dashboard-skeleton'
import { ArtistOverview } from './components/artist-overview'

export default function DashboardPage() {
  const { user, isArtist, loading } = useAuth()

  if (loading) return <DashboardSkeleton />

  return (
    <div data-testid="dashboard-content" className="space-y-6">
      {/* Welcome header */}
      <div data-testid="dashboard-welcome">
        <h1 className="text-2xl font-semibold">Welcome, {user?.name}</h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile, listings, and settings.
        </p>
      </div>

      {/* Artist section — only if artist */}
      {isArtist && <ArtistOverview />}

      {/* Generic welcome for users without role-specific content */}
      {!isArtist && (
        <Card data-testid="generic-welcome">
          <CardHeader>
            <CardTitle>Welcome to Surfaced Art</CardTitle>
            <CardDescription>
              Explore our curated collection of handmade art from talented artists.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <Link href="/artists">Browse Artists</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/settings">Account Settings</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
