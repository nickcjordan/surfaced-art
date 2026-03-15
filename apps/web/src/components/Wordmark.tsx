'use client'

import { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
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

const emptySubscribe = () => () => {}
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

/**
 * Renders the Surfaced Art wordmark SVG.
 * Switches between light/dark variants based on resolved theme.
 */
export function Wordmark({ size = 'nav', className }: WordmarkProps) {
  const mounted = useMounted()
  const { resolvedTheme } = useTheme()
  const { height } = sizeMap[size]
  const width = Math.round(height * ASPECT_RATIO)

  if (!mounted) {
    return <span className={cn('inline-block', className)} style={{ width, height }} />
  }

  const src =
    resolvedTheme === 'dark'
      ? '/brand/surfaced_wordmark_dark.svg'
      : '/brand/surfaced_wordmark.svg'

  return (
    <span className={cn('inline-block', className)}>
      <Image
        src={src}
        alt="Surfaced Art"
        width={width}
        height={height}
        unoptimized
        priority
      />
    </span>
  )
}
