import Image from 'next/image'
import { cn } from '@/lib/utils'

const sizeMap = {
  sm: { width: 20, height: 19 },
  md: { width: 28, height: 27 },
  lg: { width: 35, height: 34 },
} as const

type BrandLogoProps = {
  size?: keyof typeof sizeMap
  className?: string
}

/**
 * Renders the Surfaced Art logo mark (frame + crimson circle).
 * Switches between light/dark variants based on theme.
 */
export function BrandLogo({ size = 'md', className }: BrandLogoProps) {
  const dims = sizeMap[size]

  return (
    <span className={cn('inline-block', className)}>
      <Image
        src="/brand/surfaced_logo.svg"
        alt="Surfaced Art"
        width={dims.width}
        height={dims.height}
        unoptimized
        className="block dark:hidden"
      />
      <Image
        src="/brand/surfaced_logo_dark.svg"
        alt="Surfaced Art"
        width={dims.width}
        height={dims.height}
        unoptimized
        className="hidden dark:block"
      />
    </span>
  )
}
