import Image from 'next/image'
import { cn } from '@/lib/utils'

const sizeMap = {
  nav: { height: 32 },
  'nav-condensed': { height: 26 },
  hero: { height: 48 },
} as const

/** Aspect ratio from the SVG viewBox: 394.16 / 91.39 ≈ 4.312 */
const ASPECT_RATIO = 394.15718 / 91.38721

type WordmarkProps = {
  size?: keyof typeof sizeMap
  className?: string
}

/**
 * Renders the Surfaced Art wordmark SVG.
 * Switches between light/dark variants based on theme.
 */
export function Wordmark({ size = 'nav', className }: WordmarkProps) {
  const { height } = sizeMap[size]
  const width = Math.round(height * ASPECT_RATIO)

  return (
    <span className={cn('inline-block', className)}>
      <Image
        src="/brand/surfaced_wordmark.svg"
        alt="Surfaced Art"
        width={width}
        height={height}
        unoptimized
        className="dark:hidden"
        priority
      />
      <Image
        src="/brand/surfaced_wordmark_dark.svg"
        alt="Surfaced Art"
        width={width}
        height={height}
        unoptimized
        className="hidden dark:block"
        priority
      />
    </span>
  )
}
