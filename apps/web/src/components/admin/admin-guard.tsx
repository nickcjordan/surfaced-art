'use client'

import { useAuth } from '@/lib/auth'

/**
 * Client-side admin role guard.
 * Shows a loading skeleton while auth is resolving, a forbidden message
 * if the user lacks the admin role, and renders children if authorized.
 *
 * Note: the Next.js middleware already blocks unauthenticated users
 * from reaching /admin/* (redirects to /sign-in). This guard handles
 * the case where the user is authenticated but not an admin.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { loading, user, isAdmin } = useAuth()

  if (loading) {
    return (
      <div data-testid="admin-loading" className="flex items-center justify-center min-h-[60vh]">
        <div className="space-y-3 text-center">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded mx-auto" />
        </div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return (
      <div data-testid="admin-forbidden" className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">You do not have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
