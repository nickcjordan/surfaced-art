'use client'

import { useState, useEffect, useCallback, type ReactNode, type ReactElement } from 'react'
export { estimateCardHeight } from '@/lib/masonry-utils'

type MasonryGridProps = {
  children: ReactNode
  /** Column counts at breakpoints: [mobile, sm, md, lg] */
  columns?: [number, number, number, number]
  gap?: number
  /**
   * Relative height estimates for each child, used to distribute items
   * into the shortest column. When omitted, falls back to round-robin.
   */
  itemHeights?: number[]
  'data-testid'?: string
  className?: string
}

/**
 * JS-assisted masonry grid that distributes children into columns.
 *
 * When `itemHeights` is provided, uses shortest-column-first placement
 * for balanced columns. Otherwise falls back to round-robin assignment.
 *
 * Falls back to a single column on the server (SSR) and reflows
 * on mount + resize.
 */
export function MasonryGrid({
  children,
  columns = [2, 2, 3, 4],
  gap = 16,
  itemHeights,
  'data-testid': testId,
  className,
}: MasonryGridProps) {
  const getColumnCount = useCallback(() => {
    if (typeof window === 'undefined') return 1
    const width = window.innerWidth
    // Tailwind breakpoints: sm=640, md=768, lg=1024
    if (width >= 1024) return columns[3]
    if (width >= 768) return columns[2]
    if (width >= 640) return columns[1]
    return columns[0]
  }, [columns])

  const [columnCount, setColumnCount] = useState(getColumnCount)

  useEffect(() => {
    // ResizeObserver fires immediately when observation begins (correcting the
    // SSR column count of 1 on mount) and again on every resize thereafter.
    // setState is called in the callback, satisfying react-hooks rules.
    const observer = new ResizeObserver(() => {
      setColumnCount(getColumnCount())
    })
    observer.observe(document.documentElement)
    return () => observer.disconnect()
  }, [getColumnCount])

  const items = Array.isArray(children)
    ? (children.filter(Boolean) as ReactElement[])
    : children
      ? [children as ReactElement]
      : []

  const columnItems: ReactElement[][] = Array.from({ length: columnCount }, () => [])

  if (itemHeights && itemHeights.length >= items.length) {
    // Shortest-column-first: place each item into the column with the
    // least accumulated height for visually balanced columns.
    const heights = new Array<number>(columnCount).fill(0)
    for (let i = 0; i < items.length; i++) {
      const shortest = heights.indexOf(Math.min(...heights))
      columnItems[shortest]!.push(items[i]!)
      heights[shortest] += itemHeights[i]!
    }
  } else {
    // Round-robin fallback when no height data is available.
    for (let i = 0; i < items.length; i++) {
      columnItems[i % columnCount]!.push(items[i]!)
    }
  }

  return (
    <div
      data-testid={testId}
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
        gap: `${gap}px`,
        alignItems: 'start',
      }}
    >
      {columnItems.map((col, colIndex) => (
        <div key={colIndex} style={{ display: 'flex', flexDirection: 'column', gap: `${gap}px` }}>
          {col}
        </div>
      ))}
    </div>
  )
}
