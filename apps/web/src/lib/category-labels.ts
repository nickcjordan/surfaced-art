import type { CategoryType } from '@surfaced-art/types'

/**
 * Human-readable labels for all category enum values.
 * Explicit mapping because auto-generation from snake_case produces
 * incorrect labels for compound categories (e.g., "Mixed Media 3d"
 * instead of "Mixed Media & 3D").
 */
export const categoryLabels: Record<CategoryType, string> = {
  ceramics: 'Ceramics',
  drawing_painting: 'Drawing & Painting',
  printmaking_photography: 'Printmaking & Photography',
  mixed_media_3d: 'Mixed Media & 3D',
}
