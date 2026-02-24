import { Category } from '@surfaced-art/types'
import type { CategoryType } from '@surfaced-art/types'

/**
 * Human-readable labels for all category enum values.
 * Converts snake_case to Title Case (e.g., mixed_media -> "Mixed Media").
 */
export const categoryLabels = Object.fromEntries(
  Object.values(Category).map((c) => [
    c,
    c
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
  ])
) as Record<CategoryType, string>
