import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { MasonryGrid, estimateCardHeight } from '../MasonryGrid'

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

  it('should use shortest-column-first when itemHeights provided', () => {
    setViewportWidth(1200)

    // 4 columns, 5 items: first is very tall (500), rest are short (100)
    // Round-robin: col0=[500,100], col1=[100], col2=[100], col3=[100]
    // Shortest-first: col0=[500], col1=[100,100], col2=[100], col3=[100]
    // The tall item goes to col0, then items 2-4 fill cols 1-3,
    // then item 5 goes to the shortest column (col1, col2, or col3)
    render(
      <MasonryGrid
        data-testid="grid"
        columns={[2, 2, 3, 4]}
        itemHeights={[500, 100, 100, 100, 100]}
      >
        <div data-testid="tall">Tall</div>
        <div data-testid="s1">Short 1</div>
        <div data-testid="s2">Short 2</div>
        <div data-testid="s3">Short 3</div>
        <div data-testid="s4">Short 4</div>
      </MasonryGrid>
    )

    const grid = screen.getByTestId('grid')
    const col0 = grid.children[0]!
    const col1 = grid.children[1]!

    // Col 0 should only have the tall item (not the 5th item)
    expect(col0.children).toHaveLength(1)
    expect(col0).toContainElement(screen.getByTestId('tall'))

    // Col 1 should have 2 items (short1 + short4, since col1 becomes shortest after round 1)
    expect(col1.children).toHaveLength(2)
  })

  it('should fall back to round-robin when itemHeights is not provided', () => {
    setViewportWidth(1200)

    render(
      <MasonryGrid data-testid="grid" columns={[2, 2, 3, 4]}>
        <div data-testid="a">A</div>
        <div data-testid="b">B</div>
        <div data-testid="c">C</div>
        <div data-testid="d">D</div>
        <div data-testid="e">E</div>
      </MasonryGrid>
    )

    const grid = screen.getByTestId('grid')
    // Round-robin: col0=[A,E], col1=[B], col2=[C], col3=[D]
    expect(grid.children[0]!.children).toHaveLength(2)
    expect(grid.children[0]!).toContainElement(screen.getByTestId('a'))
    expect(grid.children[0]!).toContainElement(screen.getByTestId('e'))
  })
})

describe('estimateCardHeight', () => {
  it('should return square fallback when dimensions are null', () => {
    const height = estimateCardHeight(null, null)
    // columnWidth (300) / 1 + 80 = 380
    expect(height).toBe(380)
  })

  it('should return square fallback when dimensions are undefined', () => {
    const height = estimateCardHeight(undefined, undefined)
    expect(height).toBe(380)
  })

  it('should compute height for landscape image', () => {
    // 800x400 → ratio 2 → 300/2 + 80 = 230
    const height = estimateCardHeight(800, 400)
    expect(height).toBe(230)
  })

  it('should compute height for portrait image', () => {
    // 400x600 → ratio 0.667 → 300/0.667 + 80 ≈ 530
    const height = estimateCardHeight(400, 600)
    expect(height).toBeCloseTo(530, 0)
  })

  it('should clamp extreme portrait to 2:3 ratio', () => {
    // 200x1000 → ratio 0.2, clamped to 2/3 → 300/(2/3) + 80 = 530
    const height = estimateCardHeight(200, 1000)
    expect(height).toBe(530)
  })

  it('should accept custom columnWidth', () => {
    // 800x400 → ratio 2 → 600/2 + 80 = 380
    const height = estimateCardHeight(800, 400, 600)
    expect(height).toBe(380)
  })
})
