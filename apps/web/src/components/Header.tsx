import Link from 'next/link'
import { Navigation } from './Navigation'
import { MobileNav } from './MobileNav'

/**
 * Global site header with brand name, category navigation, and mobile menu.
 *
 * Layout:
 * - Top bar: brand name (left), future sign-in placeholder (right), mobile hamburger (right on small screens)
 * - Below top bar: horizontal category nav (desktop only)
 */
export function Header() {
  return (
    <header className="sticky top-0 z-30 bg-gallery-bg/95 backdrop-blur-sm">
      {/* Top bar */}
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Brand name */}
          <Link
            href="/"
            className="font-serif text-xl md:text-2xl tracking-tight text-gallery-foreground hover:opacity-80 transition-opacity"
          >
            Surfaced Art
          </Link>

          {/* Right side: future sign-in placeholder + mobile nav */}
          <div className="flex items-center gap-4">
            {/* Sign-in placeholder -- uncomment when auth is ready
            <Link href="/sign-in" className="text-sm text-gallery-muted hover:text-gallery-foreground transition-colors">
              Sign In
            </Link>
            */}
            <MobileNav />
          </div>
        </div>
      </div>

      {/* Desktop category navigation */}
      <Navigation />
    </header>
  )
}
