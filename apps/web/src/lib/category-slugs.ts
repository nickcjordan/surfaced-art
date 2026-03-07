import { Category } from '@surfaced-art/types'
import type { CategoryType } from '@surfaced-art/types'

const validCategories = new Set(Object.values(Category))

/**
 * Convert a CategoryType enum value (underscored) to a URL-friendly slug (hyphenated).
 * e.g., 'drawing_painting' → 'drawing-painting'
 */
export function categoryToUrlSlug(category: CategoryType): string {
  return category.replace(/_/g, '-')
}

/**
 * Convert a URL slug (hyphenated) back to a CategoryType enum value (underscored).
 * Returns undefined if the slug doesn't map to a valid category.
 * e.g., 'drawing-painting' → 'drawing_painting'
 */
export function urlSlugToCategory(slug: string): CategoryType | undefined {
  const candidate = slug.replace(/-/g, '_')
  if (validCategories.has(candidate as CategoryType)) {
    return candidate as CategoryType
  }
  return undefined
}
