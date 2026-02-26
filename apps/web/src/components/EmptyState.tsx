import Link from 'next/link'
import { cn } from '@/lib/utils'

type EmptyStateProps = {
  title: string
  description: string
  action?: { label: string; href: string }
  'data-testid'?: string
  className?: string
}

export function EmptyState({
  title,
  description,
  action,
  'data-testid': testId = 'empty-state',
  className,
}: EmptyStateProps) {
  return (
    <div
      data-testid={testId}
      className={cn(
        'flex min-h-[30vh] flex-col items-center justify-center text-center',
        className
      )}
    >
      <p className="font-serif text-lg text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-text">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-4 text-sm text-muted-text transition-colors hover:text-foreground"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
