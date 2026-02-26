import { cn } from '@/lib/utils'

const gridVariants = {
  listings: 'grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4',
  artists: 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4',
} as const

type CardGridProps = {
  variant: keyof typeof gridVariants
  children: React.ReactNode
  'data-testid'?: string
  className?: string
}

export function CardGrid({
  variant,
  children,
  'data-testid': testId,
  className,
}: CardGridProps) {
  return (
    <div
      data-testid={testId}
      className={cn(gridVariants[variant], className)}
    >
      {children}
    </div>
  )
}
