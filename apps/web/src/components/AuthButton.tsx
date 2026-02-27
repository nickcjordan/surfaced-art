'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'

/**
 * Auth state indicator for the site header.
 * Shows "Sign in" link when not authenticated, user menu when authenticated.
 */
export function AuthButton() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return <div data-testid="auth-loading" className="h-10 w-20" />
  }

  if (!user) {
    return (
      <Button variant="outline" size="sm" asChild data-testid="sign-in-button">
        <Link href="/sign-in">Sign in</Link>
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2" data-testid="user-menu">
      <Link
        href="/dashboard"
        className="text-sm text-foreground hover:text-accent-primary transition-colors"
        data-testid="dashboard-link"
      >
        {user.name}
      </Link>
      <Button variant="ghost" size="sm" onClick={signOut} data-testid="sign-out-button">
        Sign out
      </Button>
    </div>
  )
}
