'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

/**
 * Ensures scroll reaches the top on client-side route changes.
 *
 * scroll-behavior: smooth on <html> causes Next.js's scrollTo(0,0)
 * animation to get interrupted by the new page render, leaving the
 * page partway scrolled. This component briefly suspends smooth
 * scroll during navigation so the jump is instant, then restores it
 * so in-page anchor scrolling stays smooth.
 */
export function ScrollToTop() {
  const pathname = usePathname()
  const isFirst = useRef(true)

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }

    const html = document.documentElement
    html.style.scrollBehavior = 'auto'
    window.scrollTo(0, 0)
    // Restore on next frame so the browser has applied the instant scroll
    requestAnimationFrame(() => {
      html.style.scrollBehavior = ''
    })
  }, [pathname])

  return null
}
