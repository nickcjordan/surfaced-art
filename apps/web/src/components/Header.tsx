import Link from 'next/link'
import { Navigation } from './Navigation'
import { MobileNav } from './MobileNav'
import { ThemeToggle } from './ThemeToggle'
import { Wordmark } from './Wordmark'
import { Container } from './ui/container'

/**
 * Global site header with brand name, category navigation, and mobile menu.
 *
 * Layout:
 * - Top bar: brand name (left), future sign-in placeholder (right), mobile hamburger (right on small screens)
 * - Below top bar: horizontal category nav (desktop only)
 */
export function Header() {
  return (
    <header data-testid="site-header" className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm">
      {/* Top bar */}
      <Container>
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Brand wordmark */}
          <Link
            href="/"
            className="hover:opacity-80 transition-opacity"
          >
            <Wordmark size="nav" />
          </Link>

          {/* Right side: theme toggle + mobile nav */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <MobileNav />
          </div>
        </div>
      </Container>

      {/* Desktop category navigation */}
      <Navigation />
    </header>
  )
}
