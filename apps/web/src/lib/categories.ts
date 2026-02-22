import type { CategoryType } from '@surfaced-art/types'

export interface CategoryLink {
  label: string
  slug: CategoryType
  href: string
}

/**
 * All 9 art categories with display labels and URL paths.
 * Used by Header navigation, Footer links, and category pages.
 */
export const CATEGORIES: CategoryLink[] = [
  { label: 'Ceramics', slug: 'ceramics', href: '/category/ceramics' },
  { label: 'Painting', slug: 'painting', href: '/category/painting' },
  { label: 'Print', slug: 'print', href: '/category/print' },
  { label: 'Jewelry', slug: 'jewelry', href: '/category/jewelry' },
  { label: 'Illustration', slug: 'illustration', href: '/category/illustration' },
  { label: 'Photography', slug: 'photography', href: '/category/photography' },
  { label: 'Woodworking', slug: 'woodworking', href: '/category/woodworking' },
  { label: 'Fibers', slug: 'fibers', href: '/category/fibers' },
  { label: 'Mixed Media', slug: 'mixed_media', href: '/category/mixed_media' },
]
