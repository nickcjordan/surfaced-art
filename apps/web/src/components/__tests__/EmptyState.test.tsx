import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from '../EmptyState'

describe('EmptyState', () => {
  it('should render title and description', () => {
    render(
      <EmptyState
        title="No pieces found"
        description="Check back soon."
      />
    )

    expect(screen.getByText('No pieces found')).toBeInTheDocument()
    expect(screen.getByText('Check back soon.')).toBeInTheDocument()
  })

  it('should render action link when provided', () => {
    render(
      <EmptyState
        title="No pieces found"
        description="Check back soon."
        action={{ label: '← Back to gallery', href: '/' }}
      />
    )

    const link = screen.getByRole('link', { name: '← Back to gallery' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/')
  })

  it('should not render action link when not provided', () => {
    render(
      <EmptyState
        title="No pieces found"
        description="Check back soon."
      />
    )

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('should apply data-testid', () => {
    render(
      <EmptyState
        title="No pieces found"
        description="Check back soon."
        data-testid="my-empty"
      />
    )

    expect(screen.getByTestId('my-empty')).toBeInTheDocument()
  })

  it('should apply default data-testid', () => {
    render(
      <EmptyState
        title="No pieces found"
        description="Check back soon."
      />
    )

    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })
})
