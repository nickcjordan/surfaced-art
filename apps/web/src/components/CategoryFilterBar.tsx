import Link from 'next/link'
import type { CategoryType } from '@surfaced-art/types'
import { CATEGORIES } from '@/lib/categories'
import { cn } from '@/lib/utils'

type CategoryFilterBarProps = {
  activeCategory: CategoryType | null
  basePath?: string
  hrefBuilder?: (slug: CategoryType) => string
  showAll?: boolean
  allHref?: string
  'data-testid'?: string
  className?: string
}

export function CategoryFilterBar({
  activeCategory,
  basePath = '/category',
  hrefBuilder,
  showAll = false,
  allHref = '/',
  'data-testid': testId = 'category-nav',
  className,
}: CategoryFilterBarProps) {
  const buildHref = hrefBuilder ?? ((slug: CategoryType) => `${basePath}/${slug}`)

  const pillBase = 'rounded-md px-3 py-1.5 text-sm transition-colors'
  const activeClasses = 'bg-accent-primary text-white'
  const inactiveClasses = 'border border-border text-muted-text hover:border-accent-primary hover:text-foreground'

  return (
    <nav
      data-testid={testId}
      aria-label="Category navigation"
      className={cn('flex flex-wrap gap-2', className)}
    >
      {showAll && (
        <Link
          href={allHref}
          className={cn(pillBase, activeCategory === null ? activeClasses : inactiveClasses)}
        >
          All
        </Link>
      )}
      {CATEGORIES.map((cat) => (
        <Link
          key={cat.slug}
          href={buildHref(cat.slug)}
          className={cn(
            pillBase,
            cat.slug === activeCategory ? activeClasses : inactiveClasses
          )}
        >
          {cat.label}
        </Link>
      ))}
    </nav>
  )
}
