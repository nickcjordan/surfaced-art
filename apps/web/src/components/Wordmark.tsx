import { cn } from '@/lib/utils'

const sizeClasses = {
  nav: 'text-xl',
  hero: 'text-[32px]',
} as const

type WordmarkProps = {
  size?: keyof typeof sizeClasses
  className?: string
}

export function Wordmark({ size = 'nav', className }: WordmarkProps) {
  return (
    <span
      className={cn(
        'font-serif text-foreground tracking-[0.1em] uppercase font-normal',
        sizeClasses[size],
        className
      )}
    >
      Surfaced Art
    </span>
  )
}
