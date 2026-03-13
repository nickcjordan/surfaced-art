'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import type { UserRoleType } from '@surfaced-art/types'

interface RoleGuardProps {
  requiredRole: UserRoleType
  children: React.ReactNode
}

/**
 * Client-side role guard for dashboard sub-pages.
 * Shows a loading skeleton while auth is resolving, an access denied message
 * if the user lacks the required role, and renders children if authorized.
 *
 * Note: the Next.js middleware already blocks unauthenticated users
 * from reaching /dashboard/* (redirects to /sign-in). This guard handles
 * the case where the user is authenticated but lacks a specific role.
 */
export function RoleGuard({ requiredRole, children }: RoleGuardProps) {
  const { loading, user, hasRole } = useAuth()

  if (loading) {
    return (
      <div data-testid="role-guard-loading" className="flex items-center justify-center min-h-[60vh]">
        <div className="space-y-3 text-center">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded mx-auto" />
        </div>
      </div>
    )
  }

  if (!user || !hasRole(requiredRole)) {
    return (
      <div data-testid="role-guard-denied" className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">You do not have permission to access this page.</p>
          <Link
            href="/dashboard"
            className="inline-block mt-4 text-sm text-accent-primary hover:underline"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
