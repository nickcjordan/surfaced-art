import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TagPicker } from '../TagPicker'
import type { Tag, CategoryType } from '@surfaced-art/types'

const mockTags: Tag[] = [
  { id: 't1', slug: 'wheel-thrown', label: 'Wheel Thrown', category: 'ceramics', sortOrder: 0 },
  { id: 't2', slug: 'hand-built', label: 'Hand Built', category: 'ceramics', sortOrder: 1 },
  { id: 't3', slug: 'oil', label: 'Oil', category: 'drawing_painting', sortOrder: 0 },
  { id: 't4', slug: 'acrylic', label: 'Acrylic', category: 'drawing_painting', sortOrder: 1 },
  { id: 't5', slug: 'abstract', label: 'Abstract', category: null, sortOrder: 0 },
  { id: 't6', slug: 'figurative', label: 'Figurative', category: null, sortOrder: 1 },
]

describe('TagPicker', () => {
  it('renders grouped sections for artist categories plus style', () => {
    const artistCategories: CategoryType[] = ['ceramics']
    render(
      <TagPicker
        tags={mockTags}
        selectedTagIds={[]}
        artistCategories={artistCategories}
        onChange={() => {}}
      />
    )

    // Should show Ceramics group and Style group, not Drawing & Painting
    expect(screen.getByText('Ceramics')).toBeInTheDocument()
    expect(screen.getByText('Style')).toBeInTheDocument()
    expect(screen.queryByText('Drawing & Painting')).not.toBeInTheDocument()
  })

  it('shows multiple category groups when artist has multiple categories', () => {
    const artistCategories: CategoryType[] = ['ceramics', 'drawing_painting']
    render(
      <TagPicker
        tags={mockTags}
        selectedTagIds={[]}
        artistCategories={artistCategories}
        onChange={() => {}}
      />
    )

    expect(screen.getByText('Ceramics')).toBeInTheDocument()
    expect(screen.getByText('Drawing & Painting')).toBeInTheDocument()
    expect(screen.getByText('Style')).toBeInTheDocument()
  })

  it('renders available tags as clickable buttons', () => {
    render(
      <TagPicker
        tags={mockTags}
        selectedTagIds={[]}
        artistCategories={['ceramics']}
        onChange={() => {}}
      />
    )

    expect(screen.getByRole('button', { name: 'Wheel Thrown' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hand Built' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Abstract' })).toBeInTheDocument()
  })

  it('shows selected tags in the selected area with remove buttons', () => {
    render(
      <TagPicker
        tags={mockTags}
        selectedTagIds={['t1', 't5']}
        artistCategories={['ceramics']}
        onChange={() => {}}
      />
    )

    const selectedArea = screen.getByTestId('tag-picker-selected')
    expect(selectedArea).toHaveTextContent('Wheel Thrown')
    expect(selectedArea).toHaveTextContent('Abstract')
  })

  it('calls onChange with added tag ID when clicking an available tag', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <TagPicker
        tags={mockTags}
        selectedTagIds={['t5']}
        artistCategories={['ceramics']}
        onChange={onChange}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Wheel Thrown' }))
    expect(onChange).toHaveBeenCalledWith(['t5', 't1'])
  })

  it('calls onChange with removed tag ID when clicking a selected tag chip', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <TagPicker
        tags={mockTags}
        selectedTagIds={['t1', 't5']}
        artistCategories={['ceramics']}
        onChange={onChange}
      />
    )

    // Click the remove button on the "Wheel Thrown" chip
    const removeButtons = screen.getAllByRole('button', { name: /remove/i })
    // Find the one for Wheel Thrown
    const wheelThrownChip = removeButtons.find((btn) =>
      btn.closest('[data-testid="tag-picker-selected"]')?.textContent?.includes('Wheel Thrown')
    )
    expect(wheelThrownChip).toBeDefined()
    await user.click(wheelThrownChip!)
    expect(onChange).toHaveBeenCalledWith(['t5'])
  })

  it('does not show tags from categories the artist does not belong to', () => {
    render(
      <TagPicker
        tags={mockTags}
        selectedTagIds={[]}
        artistCategories={['ceramics']}
        onChange={() => {}}
      />
    )

    // Oil and Acrylic are drawing_painting tags — should not appear
    expect(screen.queryByRole('button', { name: 'Oil' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Acrylic' })).not.toBeInTheDocument()
  })

  it('disables all buttons when disabled prop is true', () => {
    render(
      <TagPicker
        tags={mockTags}
        selectedTagIds={['t1']}
        artistCategories={['ceramics']}
        onChange={() => {}}
        disabled
      />
    )

    const buttons = screen.getAllByRole('button')
    buttons.forEach((btn) => expect(btn).toBeDisabled())
  })

  it('renders empty state when no tags match artist categories', () => {
    render(
      <TagPicker
        tags={mockTags.filter((t) => t.category === 'printmaking_photography')}
        selectedTagIds={[]}
        artistCategories={['printmaking_photography']}
        onChange={() => {}}
      />
    )

    // No category-specific tags and no style tags
    expect(screen.queryByTestId('tag-picker-selected')).not.toBeInTheDocument()
  })
})
