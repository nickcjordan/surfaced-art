import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CardGrid } from '../CardGrid'

describe('CardGrid', () => {
  it('should render children', () => {
    render(
      <CardGrid variant="listings">
        <div data-testid="child">Item</div>
      </CardGrid>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('should apply listings grid classes', () => {
    render(
      <CardGrid variant="listings" data-testid="grid">
        <div>Item</div>
      </CardGrid>
    )

    const grid = screen.getByTestId('grid')
    expect(grid.className).toContain('grid-cols-2')
    expect(grid.className).toContain('lg:grid-cols-3')
    expect(grid.className).toContain('xl:grid-cols-4')
  })

  it('should apply artists grid classes', () => {
    render(
      <CardGrid variant="artists" data-testid="grid">
        <div>Item</div>
      </CardGrid>
    )

    const grid = screen.getByTestId('grid')
    expect(grid.className).toContain('grid-cols-1')
    expect(grid.className).toContain('lg:grid-cols-4')
  })

  it('should merge additional className', () => {
    render(
      <CardGrid variant="listings" className="mt-8" data-testid="grid">
        <div>Item</div>
      </CardGrid>
    )

    const grid = screen.getByTestId('grid')
    expect(grid.className).toContain('mt-8')
    expect(grid.className).toContain('grid-cols-2')
  })

  it('should apply data-testid', () => {
    render(
      <CardGrid variant="listings" data-testid="my-grid">
        <div>Item</div>
      </CardGrid>
    )

    expect(screen.getByTestId('my-grid')).toBeInTheDocument()
  })
})
