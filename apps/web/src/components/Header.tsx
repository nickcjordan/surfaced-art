'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Navigation } from './Navigation'
import { MobileNav } from './MobileNav'
import { SearchInput } from './SearchInput'
import { ThemeToggle } from './ThemeToggle'
import { AuthButton } from './AuthButton'
import { Wordmark } from './Wordmark'
import { Container } from './ui/container'
import { cn } from '@/lib/utils'

const SCROLL_THRESHOLD = 50

/**
 * Global site header with brand name, category navigation, and mobile menu.
 *
 * Layout:
 * - Top bar: brand name (left), sign-in + search + theme toggle (right), mobile hamburger (right on small screens)
 * - Below top bar: horizontal category nav (desktop only)
 *
 * On scroll, the header condenses: wordmark shrinks, vertical padding reduces,
 * and categories tuck closer to the top.
 */
export function Header() {
  const [isCondensed, setIsCondensed] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setIsCondensed(window.scrollY > SCROLL_THRESHOLD)
    }

    // Check initial scroll position (e.g. page refresh mid-scroll)
    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      data-testid="site-header"
      className={cn(
        'sticky top-0 z-30 bg-background/95 backdrop-blur-sm transition-all duration-300',
        isCondensed && 'shadow-sm'
      )}
    >
      {/* Top bar */}
      <Container>
        <div
          className={cn(
            'flex items-center justify-between transition-all duration-300',
            isCondensed ? 'h-10 md:h-11' : 'h-12 md:h-14'
          )}
        >
          {/* Brand wordmark */}
          <Link
            href="/"
            className="hover:opacity-80 transition-opacity"
          >
            <Wordmark size={isCondensed ? 'nav-condensed' : 'nav'} />
          </Link>

          {/* Right side: search + auth + theme toggle + mobile nav */}
          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <SearchInput />
            </div>
            <div className="hidden md:block">
              <AuthButton />
            </div>
            <ThemeToggle />
            <MobileNav />
          </div>
        </div>
      </Container>

      {/* Desktop category navigation */}
      <Navigation condensed={isCondensed} />
    </header>
  )
}
