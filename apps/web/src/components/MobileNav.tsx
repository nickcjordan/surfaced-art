'use client'

import { useState, useCallback, useEffect, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CATEGORIES } from '@/lib/categories'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

/**
 * Mobile navigation with hamburger button and slide-out drawer.
 * Only visible on screens smaller than md breakpoint.
 */
export function MobileNav() {
  const pathname = usePathname()
  const { user, isArtist, isAdmin, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        close()
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, close])

  return (
    <div className="md:hidden">
      {/* Hamburger button */}
      <button
        data-testid="mobile-menu-button"
        type="button"
        onClick={open}
        aria-label="Menu"
        aria-expanded={isOpen}
        className="inline-flex items-center justify-center p-2 text-foreground hover:text-muted-foreground transition-colors"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Backdrop + drawer rendered via portal to escape header's backdrop-filter containing block */}
      {mounted && createPortal(
        <>
          {/* Backdrop overlay */}
          {isOpen && (
            <div
              className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm"
              onClick={close}
              aria-hidden="true"
            />
          )}

          {/* Slide-out drawer */}
          <div
            className={`fixed top-0 right-0 z-50 h-full w-72 bg-background shadow-xl dark:shadow-none dark:border-l dark:border-border transform transition-transform duration-300 ease-in-out ${
              isOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
            role="dialog"
            aria-modal={isOpen}
            aria-hidden={!isOpen}
            aria-label="Navigation menu"
            inert={!isOpen ? true : undefined}
          >
            {/* Close button */}
            <div className="flex items-center justify-end p-6">
              <button
                type="button"
                onClick={close}
                aria-label="Close menu"
                className="p-2 text-foreground hover:text-muted-foreground transition-colors"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Mobile search */}
            <div className="px-6 pb-4">
              <form action="/search" method="GET" data-testid="mobile-search-form">
                <input
                  name="q"
                  type="search"
                  placeholder="Search art..."
                  autoComplete="off"
                  data-testid="mobile-search-input"
                  className="h-10 w-full rounded-md border border-border bg-transparent px-3.5 py-2.5 text-base text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-accent-primary focus-visible:ring-accent-primary/50 focus-visible:ring-[3px] transition-[border-color] duration-200"
                />
              </form>
            </div>

            {/* Category links */}
            <nav data-testid="mobile-nav" aria-label="Mobile category navigation" className="px-6">
              <ul className="space-y-1">
                {CATEGORIES.map((category) => {
                  const isActive = pathname === category.href
                  return (
                    <li key={category.slug}>
                      <Link
                        href={category.href}
                        onClick={close}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'block py-3 text-base tracking-wide transition-colors border-b border-border/50',
                          isActive
                            ? 'text-accent-primary font-medium'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {category.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>

            {/* For Artists link */}
            <div className="px-6 mt-4">
              <Link
                href="/for-artists"
                onClick={close}
                className="block py-3 text-base font-medium tracking-wide text-accent-primary transition-colors hover:text-foreground"
              >
                For Artists
              </Link>
            </div>

            {/* Auth-aware links */}
            {user && (
              <nav data-testid="mobile-auth-nav" aria-label="Account navigation" className="px-6 mt-6">
                <p className="px-0 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Account
                </p>
                <ul className="space-y-1">
                  <li>
                    <Link
                      href="/dashboard"
                      onClick={close}
                      data-testid="mobile-dashboard-link"
                      className="block py-3 text-base tracking-wide transition-colors border-b border-border/50 text-muted-foreground hover:text-foreground"
                    >
                      Dashboard
                    </Link>
                  </li>
                  {isArtist && (
                    <li>
                      <Link
                        href="/dashboard/profile"
                        onClick={close}
                        data-testid="mobile-artist-profile-link"
                        className="block py-3 text-base tracking-wide transition-colors border-b border-border/50 text-muted-foreground hover:text-foreground"
                      >
                        Artist Profile
                      </Link>
                    </li>
                  )}
                  {isAdmin && (
                    <li>
                      <Link
                        href="/admin"
                        onClick={close}
                        data-testid="mobile-admin-link"
                        className="block py-3 text-base tracking-wide transition-colors border-b border-border/50 text-muted-foreground hover:text-foreground"
                      >
                        Admin Panel
                      </Link>
                    </li>
                  )}
                  <li>
                    <Link
                      href="/dashboard/settings"
                      onClick={close}
                      data-testid="mobile-settings-link"
                      className="block py-3 text-base tracking-wide transition-colors border-b border-border/50 text-muted-foreground hover:text-foreground"
                    >
                      Settings
                    </Link>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => { signOut(); close() }}
                      data-testid="mobile-sign-out"
                      className="block w-full text-left py-3 text-base tracking-wide transition-colors text-muted-foreground hover:text-foreground"
                    >
                      Sign Out
                    </button>
                  </li>
                </ul>
              </nav>
            )}

            {/* Sign in link for unauthenticated users */}
            {!user && (
              <div className="px-6 mt-6">
                <Link
                  href="/sign-in"
                  onClick={close}
                  data-testid="mobile-sign-in-link"
                  className="block py-3 text-base tracking-wide transition-colors text-accent-primary hover:text-foreground font-medium"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  )
}
