'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'

export function AdminHeader() {
  const { user, signOut } = useAuth()

  return (
    <header data-testid="admin-header" className="border-b border-border bg-surface">
      <div className="flex items-center justify-between h-14 px-6">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="font-semibold text-foreground">
            Surfaced Art Admin
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="admin-back-to-site"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Back to site
          </Link>
          {user && (
            <span data-testid="admin-user-name" className="text-sm text-muted-foreground">
              {user.name}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            data-testid="admin-sign-out"
          >
            Sign out
          </Button>
        </div>
      </div>
    </header>
  )
}
