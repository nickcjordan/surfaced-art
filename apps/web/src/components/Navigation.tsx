import Link from 'next/link'
import { CATEGORIES } from '@/lib/categories'
import { Container } from './ui/container'

/**
 * Desktop category navigation bar.
 * Renders all 9 art categories as horizontal links.
 * Hidden on mobile (use MobileNav instead).
 */
export function Navigation() {
  return (
    <nav
      data-testid="site-nav"
      aria-label="Category navigation"
      className="hidden md:block border-b border-border"
    >
      <Container>
        <ul data-testid="category-nav" className="flex items-center gap-8 overflow-x-auto py-3">
          {CATEGORIES.map((category) => (
            <li key={category.slug}>
              <Link
                data-testid={`category-link-${category.slug}`}
                href={category.href}
                className="whitespace-nowrap text-sm tracking-wide text-muted-foreground transition-colors hover:text-foreground"
              >
                {category.label}
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </nav>
  )
}
