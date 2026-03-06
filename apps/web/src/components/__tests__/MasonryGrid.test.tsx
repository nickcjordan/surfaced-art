import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { MasonryGrid } from '../MasonryGrid'

describe('MasonryGrid', () => {
  let originalInnerWidth: number

  beforeEach(() => {
    originalInnerWidth = window.innerWidth
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, writable: true })
  })

  function setViewportWidth(width: number) {
    Object.defineProperty(window, 'innerWidth', { value: width, writable: true })
  }

  it('should render children', () => {
    render(
      <MasonryGrid>
        <div data-testid="child-1">Item 1</div>
        <div data-testid="child-2">Item 2</div>
      </MasonryGrid>
    )

    expect(screen.getByTestId('child-1')).toBeInTheDocument()
    expect(screen.getByTestId('child-2')).toBeInTheDocument()
  })

  it('should accept data-testid prop', () => {
    render(
      <MasonryGrid data-testid="my-grid">
        <div>Item</div>
      </MasonryGrid>
    )

    expect(screen.getByTestId('my-grid')).toBeInTheDocument()
  })

  it('should accept className prop', () => {
    render(
      <MasonryGrid data-testid="grid" className="opacity-75">
        <div>Item</div>
      </MasonryGrid>
    )

    expect(screen.getByTestId('grid')).toHaveClass('opacity-75')
  })

  it('should distribute items into columns at lg breakpoint', () => {
    setViewportWidth(1200)

    render(
      <MasonryGrid data-testid="grid" columns={[2, 2, 3, 4]}>
        <div>A</div>
        <div>B</div>
        <div>C</div>
        <div>D</div>
      </MasonryGrid>
    )

    const grid = screen.getByTestId('grid')
    // At lg (>=1024), 4 columns → 4 column wrappers
    expect(grid.children).toHaveLength(4)
  })

  it('should use 2 columns at mobile breakpoint', () => {
    setViewportWidth(400)

    render(
      <MasonryGrid data-testid="grid" columns={[2, 2, 3, 4]}>
        <div>A</div>
        <div>B</div>
        <div>C</div>
        <div>D</div>
      </MasonryGrid>
    )

    const grid = screen.getByTestId('grid')
    expect(grid.children).toHaveLength(2)
  })

  it('should render empty grid with no children', () => {
    render(
      <MasonryGrid data-testid="grid">
        {[]}
      </MasonryGrid>
    )

    expect(screen.getByTestId('grid')).toBeInTheDocument()
  })

  it('should use inline grid styles', () => {
    setViewportWidth(1200)

    render(
      <MasonryGrid data-testid="grid" columns={[2, 2, 3, 4]} gap={24}>
        <div>A</div>
      </MasonryGrid>
    )

    const grid = screen.getByTestId('grid')
    expect(grid.style.display).toBe('grid')
    expect(grid.style.gap).toBe('24px')
  })

  it('should reflow on window resize', () => {
    setViewportWidth(400)

    render(
      <MasonryGrid data-testid="grid" columns={[2, 2, 3, 4]}>
        <div>A</div>
        <div>B</div>
        <div>C</div>
      </MasonryGrid>
    )

    const grid = screen.getByTestId('grid')
    expect(grid.children).toHaveLength(2)

    // Simulate resize to lg
    act(() => {
      setViewportWidth(1200)
      window.dispatchEvent(new Event('resize'))
    })

    expect(grid.children).toHaveLength(4)
  })
})
