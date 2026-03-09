'use client'

import { useState, useEffect, useCallback, type ReactNode, type ReactElement } from 'react'

type MasonryGridProps = {
  children: ReactNode
  /** Column counts at breakpoints: [mobile, sm, md, lg] */
  columns?: [number, number, number, number]
  gap?: number
  'data-testid'?: string
  className?: string
}

/**
 * JS-assisted masonry grid that distributes children into columns
 * using round-robin assignment. Items flow left-to-right in source
 * order, cycling through columns sequentially. This works well when
 * items have similar heights (e.g. known aspect ratios).
 *
 * Falls back to a single column on the server (SSR) and reflows
 * on mount + resize.
 */
export function MasonryGrid({
  children,
  columns = [2, 2, 3, 4],
  gap = 16,
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

  // Distribute children into columns using round-robin
  // (true height-based distribution would require measuring DOM elements,
  // but round-robin with source-order preservation works well when items
  // have similar heights, which they do with known aspect ratios)
  const items = Array.isArray(children)
    ? (children.filter(Boolean) as ReactElement[])
    : children
      ? [children as ReactElement]
      : []

  const columnItems: ReactElement[][] = Array.from({ length: columnCount }, () => [])

  for (let i = 0; i < items.length; i++) {
    columnItems[i % columnCount]!.push(items[i]!)
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
