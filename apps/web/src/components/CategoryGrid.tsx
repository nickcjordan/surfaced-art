import Link from 'next/link'
import type { CategoryWithCount } from '@surfaced-art/types'
import { CATEGORIES } from '@/lib/categories'

type CategoryGridProps = {
  counts: CategoryWithCount[]
}

export function CategoryGrid({ counts }: CategoryGridProps) {
  const countMap = new Map(counts.map((c) => [c.category, c.count]))

  return (
    <div data-testid="category-grid" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {CATEGORIES.map((cat) => {
        const count = countMap.get(cat.slug) ?? 0
        return (
          <Link
            key={cat.slug}
            href={cat.href}
            className="group flex flex-col items-center justify-center rounded-md border border-border bg-surface p-6 text-center transition-[border-color,box-shadow] duration-250 ease-in-out hover:border-accent-primary hover:shadow-sm"
          >
            <span className="font-serif text-base text-foreground group-hover:text-accent-primary transition-colors duration-250">
              {cat.label}
            </span>
            <span className="mt-1 text-xs text-muted-text">
              {count} {count === 1 ? 'piece' : 'pieces'}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
