import Link from 'next/link'
import { Navigation } from './Navigation'
import { MobileNav } from './MobileNav'
import { ThemeToggle } from './ThemeToggle'
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
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm">
      {/* Top bar */}
      <Container>
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Brand name */}
          <Link
            href="/"
            className="font-serif text-xl md:text-2xl tracking-tight text-foreground hover:opacity-80 transition-opacity"
          >
            Surfaced Art
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
