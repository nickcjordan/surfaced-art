'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * Auth state indicator for the site header.
 * Shows "Sign in" link when not authenticated, a dropdown user menu when authenticated.
 * Menu items adapt based on the user's roles (artist, admin).
 */
export function AuthButton() {
  const { user, loading, signOut, isArtist, isAdmin } = useAuth()

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

  const initial = (user.name || user.email || '?').charAt(0).toUpperCase()

  return (
    <div data-testid="user-menu">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            data-testid="user-menu-trigger"
            className="flex items-center gap-1.5 text-sm text-foreground hover:text-accent-primary transition-colors outline-none"
          >
            <span className="flex items-center justify-center h-7 w-7 rounded-full bg-accent-primary/10 text-accent-primary text-xs font-semibold">
              {initial}
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-60"
              aria-hidden="true"
            >
              <path d="M3 4.5L6 7.5L9 4.5" />
            </svg>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel data-testid="menu-user-name">
            {user.name || user.email}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild data-testid="menu-dashboard">
            <Link href="/dashboard">Dashboard</Link>
          </DropdownMenuItem>

          {isArtist && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild data-testid="menu-artist-profile">
                <Link href="/dashboard/profile">Artist Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild data-testid="menu-manage-listings">
                <Link href="/dashboard/listings">Manage Listings</Link>
              </DropdownMenuItem>
            </>
          )}

          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild data-testid="menu-admin">
                <Link href="/admin">Admin Panel</Link>
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem asChild data-testid="menu-settings">
            <Link href="/dashboard/settings">Settings</Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            data-testid="menu-sign-out"
            onClick={signOut}
          >
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
