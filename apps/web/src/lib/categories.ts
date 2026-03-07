import type { CategoryType } from '@surfaced-art/types'
import { categoryToUrlSlug } from './category-slugs'

export interface CategoryLink {
  label: string
  slug: CategoryType
  href: string
}

/**
 * All 4 art categories with display labels and URL paths.
 * Used by Header navigation, Footer links, and category pages.
 *
 * Note: `slug` is the CategoryType enum value (underscored).
 * `href` uses hyphenated URL slugs for SEO-friendly URLs.
 */
export const CATEGORIES: CategoryLink[] = [
  { label: 'Ceramics', slug: 'ceramics', href: `/category/${categoryToUrlSlug('ceramics')}` },
  { label: 'Drawing & Painting', slug: 'drawing_painting', href: `/category/${categoryToUrlSlug('drawing_painting')}` },
  { label: 'Printmaking & Photography', slug: 'printmaking_photography', href: `/category/${categoryToUrlSlug('printmaking_photography')}` },
  { label: 'Mixed Media & 3D', slug: 'mixed_media_3d', href: `/category/${categoryToUrlSlug('mixed_media_3d')}` },
]
