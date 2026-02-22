import Link from 'next/link'
import { CATEGORIES } from '@/lib/categories'

/**
 * Desktop category navigation bar.
 * Renders all 9 art categories as horizontal links.
 * Hidden on mobile (use MobileNav instead).
 */
export function Navigation() {
  return (
    <nav
      aria-label="Category navigation"
      className="hidden md:block border-b border-gallery-border"
    >
      <div className="mx-auto max-w-7xl px-6">
        <ul className="flex items-center gap-8 overflow-x-auto py-3">
          {CATEGORIES.map((category) => (
            <li key={category.slug}>
              <Link
                href={category.href}
                className="whitespace-nowrap text-sm tracking-wide text-gallery-muted transition-colors hover:text-gallery-foreground"
              >
                {category.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
