'use client'

import type { Tag, CategoryType } from '@surfaced-art/types'
import { categoryLabels } from '@/lib/category-labels'

interface TagPickerProps {
  tags: Tag[]
  selectedTagIds: string[]
  artistCategories: CategoryType[]
  onChange: (tagIds: string[]) => void
  disabled?: boolean
}

/**
 * Grouped tag picker with pill/chip UI.
 * Shows one section per artist category + a cross-cutting "Style" section.
 * Clicking an available tag adds it; clicking a selected chip removes it.
 */
export function TagPicker({
  tags,
  selectedTagIds,
  artistCategories,
  onChange,
  disabled = false,
}: TagPickerProps) {
  const selectedSet = new Set(selectedTagIds)

  // Group tags by category, only for artist's categories + null (style)
  const categoryGroups: { label: string; tags: Tag[] }[] = []

  for (const cat of artistCategories) {
    const catTags = tags.filter((t) => t.category === cat)
    if (catTags.length > 0) {
      categoryGroups.push({ label: categoryLabels[cat], tags: catTags })
    }
  }

  // Cross-cutting style tags (category: null) — always visible
  const styleTags = tags.filter((t) => t.category === null)
  if (styleTags.length > 0) {
    categoryGroups.push({ label: 'Style', tags: styleTags })
  }

  if (categoryGroups.length === 0) return null

  const selectedTags = tags.filter((t) => selectedSet.has(t.id))

  function addTag(tagId: string) {
    if (!selectedSet.has(tagId)) {
      onChange([...selectedTagIds, tagId])
    }
  }

  function removeTag(tagId: string) {
    onChange(selectedTagIds.filter((id) => id !== tagId))
  }

  return (
    <div data-testid="tag-picker" className="space-y-4">
      {/* Available tags grouped by category */}
      {categoryGroups.map((group) => (
        <div key={group.label}>
          <p className="text-sm font-medium text-muted-foreground mb-2">{group.label}</p>
          <div className="flex flex-wrap gap-1.5">
            {group.tags.map((tag) => {
              const isSelected = selectedSet.has(tag.id)
              return (
                <button
                  key={tag.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => (isSelected ? removeTag(tag.id) : addTag(tag.id))}
                  className={`inline-flex items-center rounded-full px-3 py-1 text-sm transition-colors ${
                    isSelected
                      ? 'bg-accent-primary text-white'
                      : 'bg-surface text-foreground hover:bg-border'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {tag.label}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Selected tags area */}
      {selectedTags.length > 0 && (
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Selected tags</p>
          <div data-testid="tag-picker-selected" className="flex flex-wrap gap-1.5">
            {selectedTags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 rounded-full bg-accent-primary/10 text-accent-primary px-3 py-1 text-sm"
              >
                {tag.label}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeTag(tag.id)}
                  aria-label={`Remove ${tag.label}`}
                  className="ml-0.5 hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
