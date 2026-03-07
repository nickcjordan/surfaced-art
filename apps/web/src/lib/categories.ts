import type { CategoryType } from '@surfaced-art/types'

export interface CategoryLink {
  label: string
  slug: CategoryType
  href: string
}

/**
 * All 4 art categories with display labels and URL paths.
 * Used by Header navigation, Footer links, and category pages.
 */
export const CATEGORIES: CategoryLink[] = [
  { label: 'Ceramics', slug: 'ceramics', href: '/category/ceramics' },
  { label: 'Drawing & Painting', slug: 'drawing_painting', href: '/category/drawing_painting' },
  { label: 'Printmaking & Photography', slug: 'printmaking_photography', href: '/category/printmaking_photography' },
  { label: 'Mixed Media & 3D', slug: 'mixed_media_3d', href: '/category/mixed_media_3d' },
]
