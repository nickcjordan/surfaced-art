'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CATEGORIES } from '@/lib/categories'
import { cn } from '@/lib/utils'

type NavigationProps = {
  condensed?: boolean
}

/**
 * Desktop category navigation — rendered inline within the header bar.
 * Hidden on mobile (use MobileNav instead).
 */
export function Navigation({ condensed = false }: NavigationProps) {
  const pathname = usePathname()

  return (
    <nav
      data-testid="site-nav"
      aria-label="Category navigation"
      className="hidden md:block"
    >
      <ul data-testid="category-nav" className="flex items-center gap-6">
        {CATEGORIES.map((category) => {
          const isActive = pathname === category.href
          return (
            <li key={category.slug}>
              <Link
                data-testid={`category-link-${category.slug}`}
                href={category.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'inline-block whitespace-nowrap text-sm tracking-wide transition-colors duration-200',
                  condensed ? 'py-1' : 'py-2',
                  isActive
                    ? 'text-foreground border-b-2 border-accent-primary'
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
  )
}
