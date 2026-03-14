'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'

export function AdminHeader() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/sign-in'
  }

  return (
    <header data-testid="admin-header" className="border-b border-border bg-surface">
      <div className="flex items-center justify-between h-14 px-6">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="font-semibold text-foreground">
            Surfaced Art Admin
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <span data-testid="admin-user-name" className="text-sm text-muted-foreground">
              {user.name}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            data-testid="admin-sign-out"
          >
            Sign out
          </Button>
        </div>
      </div>
    </header>
  )
}
