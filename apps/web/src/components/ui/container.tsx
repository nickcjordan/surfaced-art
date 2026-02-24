import { cn } from '@/lib/utils'

type ContainerProps = React.ComponentProps<'div'>

export function Container({ children, className, ...props }: ContainerProps) {
  return (
    <div className={cn('mx-auto max-w-7xl px-6', className)} {...props}>
      {children}
    </div>
  )
}
