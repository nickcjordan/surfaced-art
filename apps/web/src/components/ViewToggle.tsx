'use client'

import { cn } from '@/lib/utils'

type ViewToggleOption<T extends string> = { value: T; label: string }

type ViewToggleProps<T extends string> = {
  options: ViewToggleOption<T>[]
  value: T
  onChange: (value: T) => void
  'data-testid'?: string
  className?: string
}

export function ViewToggle<T extends string>({
  options,
  value,
  onChange,
  'data-testid': testId = 'view-toggle',
  className,
}: ViewToggleProps<T>) {
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
            role="tab"
            aria-selected={isActive}
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
