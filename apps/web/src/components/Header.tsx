'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Navigation } from './Navigation'
import { MobileNav } from './MobileNav'
import { SearchInput } from './SearchInput'
import { ThemeToggle } from './ThemeToggle'
import { AuthButton } from './AuthButton'
import { Wordmark } from './Wordmark'
import { SkipToContent } from './SkipToContent'
import { Container } from './ui/container'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

const SCROLL_CONDENSE_THRESHOLD = 50
const SCROLL_EXPAND_THRESHOLD = 20

/**
 * Global site header — single-row layout.
 *
 * Layout:
 * - Left: brand wordmark + category navigation (desktop)
 * - Right: search + auth + theme toggle + mobile hamburger
 *
 * On scroll, the header condenses: wordmark shrinks and vertical padding reduces.
 * When search is open, category navigation hides to make room.
 *
 * Uses hysteresis (separate thresholds for condensing vs expanding) to prevent
 * flickering when the height change shifts scroll position back across the threshold.
 */
export function Header() {
  const { user, isArtist, isAdmin } = useAuth()
  const [isCondensed, setIsCondensed] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const handleSearchOpenChange = useCallback((open: boolean) => {
    setIsSearchOpen(open)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      setIsCondensed((prev) => {
        if (prev) return scrollY > SCROLL_EXPAND_THRESHOLD
        return scrollY > SCROLL_CONDENSE_THRESHOLD
      })
    }

    // Check initial scroll position (e.g. page refresh mid-scroll)
    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
    <SkipToContent />
    <header
      data-testid="site-header"
      className={cn(
        'sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border transition-all duration-300',
        isCondensed && 'shadow-sm'
      )}
    >
      <Container>
        <div
          className={cn(
            'flex items-center justify-between transition-all duration-300',
            isCondensed ? 'h-11 md:h-12' : 'h-14 md:h-16'
          )}
        >
          {/* Left: logo + category nav */}
          <div className="flex items-center">
            <Link
              href="/"
              className="shrink-0 hover:opacity-80 transition-opacity"
            >
              <Wordmark size={isCondensed ? 'nav-condensed' : 'nav'} />
            </Link>

            <div
              className={cn(
                'hidden md:flex items-center gap-10 overflow-hidden transition-all duration-300 ease-in-out',
                isSearchOpen
                  ? 'max-w-0 opacity-0 ml-0'
                  : 'max-w-[800px] opacity-100 ml-10'
              )}
            >
              <div className="h-5 border-l border-border shrink-0" aria-hidden="true" />
              <Navigation condensed={isCondensed} />
            </div>
          </div>

          {/* Right: role-aware links + search + auth + theme toggle + mobile nav */}
          <div className="flex items-center gap-2">
            {!user && (
              <Link
                href="/for-artists"
                className={cn(
                  'hidden md:block text-sm font-medium text-accent-primary transition-colors hover:text-foreground',
                  isSearchOpen && 'md:hidden'
                )}
              >
                For Artists
              </Link>
            )}
            {isArtist && (
              <Link
                href="/dashboard"
                data-testid="nav-dashboard"
                className={cn(
                  'hidden md:block text-sm font-medium text-accent-primary transition-colors hover:text-foreground',
                  isSearchOpen && 'md:hidden'
                )}
              >
                Dashboard
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin"
                data-testid="nav-admin"
                className={cn(
                  'hidden md:block text-sm font-medium text-foreground transition-colors hover:text-accent-primary',
                  isSearchOpen && 'md:hidden'
                )}
              >
                Admin
              </Link>
            )}
            <div className="hidden md:block">
              <SearchInput onOpenChange={handleSearchOpenChange} />
            </div>
            <div className="hidden md:block">
              <AuthButton />
            </div>
            <ThemeToggle />
            <MobileNav />
          </div>
        </div>
      </Container>
    </header>
    </>
  )
}
