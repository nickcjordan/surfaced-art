'use client'

import { useId } from 'react'
import { cn } from '@/lib/utils'

type ViewToggleOption<T extends string> = { value: T; label: string }

type ViewToggleProps<T extends string> = {
  options: ViewToggleOption<T>[]
  value: T
  onChange: (value: T) => void
  /** Optional prefix for generating tab and panel IDs (e.g. "category" → "category-tab-pieces", "category-panel-pieces"). When omitted a stable auto-generated ID is used. */
  id?: string
  'data-testid'?: string
  className?: string
}

/** Returns the tab element ID for a given toggle value. */
export function getTabId(prefix: string, value: string) {
  return `${prefix}-tab-${value}`
}

/** Returns the tabpanel element ID for a given toggle value. */
export function getPanelId(prefix: string, value: string) {
  return `${prefix}-panel-${value}`
}

export function ViewToggle<T extends string>({
  options,
  value,
  onChange,
  id: idProp,
  'data-testid': testId = 'view-toggle',
  className,
}: ViewToggleProps<T>) {
  const autoId = useId()
  const id = idProp ?? `vt${autoId}`
  return (
    <div
      role="tablist"
      data-testid={testId}
      className={cn('flex gap-1', className)}
    >
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            id={getTabId(id, option.value)}
            role="tab"
            aria-selected={isActive}
            aria-controls={getPanelId(id, option.value)}
            onClick={() => {
              if (!isActive) onChange(option.value)
            }}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm transition-colors',
              isActive
                ? 'bg-accent-primary text-white'
                : 'border border-border text-muted-text hover:border-accent-primary hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
