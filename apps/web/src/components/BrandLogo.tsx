'use client'

import { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
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

const emptySubscribe = () => () => {}
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

/**
 * Renders the Surfaced Art logo mark (frame + crimson circle).
 * Switches between light/dark variants based on resolved theme.
 */
export function BrandLogo({ size = 'md', className }: BrandLogoProps) {
  const mounted = useMounted()
  const { resolvedTheme } = useTheme()
  const dims = sizeMap[size]

  if (!mounted) {
    return <span className={cn('inline-block', className)} style={{ width: dims.width, height: dims.height }} />
  }

  const src =
    resolvedTheme === 'dark'
      ? '/brand/surfaced_logo_dark.svg'
      : '/brand/surfaced_logo.svg'

  return (
    <span className={cn('inline-block', className)}>
      <Image
        src={src}
        alt="Surfaced Art"
        width={dims.width}
        height={dims.height}
        unoptimized
      />
    </span>
  )
}
