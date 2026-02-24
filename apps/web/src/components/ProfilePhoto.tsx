import Image from 'next/image'
import { cn } from '@/lib/utils'

const sizeClasses = {
  sm: 'size-10',
  md: 'size-12',
  lg: 'size-[120px]',
} as const

type ProfilePhotoProps = {
  src: string | null
  alt: string
  size?: keyof typeof sizeClasses
  bordered?: boolean
  className?: string
}

export function ProfilePhoto({
  src,
  alt,
  size = 'md',
  bordered = false,
  className,
}: ProfilePhotoProps) {
  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-full bg-surface',
        sizeClasses[size],
        bordered && 'ring-2 ring-background',
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized
          className="object-cover"
        />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-text">
          <span className="font-serif text-lg">{alt.charAt(0)}</span>
        </div>
      )}
    </div>
  )
}
