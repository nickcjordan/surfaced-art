'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'
import posthog from 'posthog-js'
import { isAnalyticsEnabled } from './analytics'

/**
 * Tracks $pageview events on client-side navigation.
 * Must be placed inside a Suspense boundary because useSearchParams()
 * can suspend in the App Router.
 */
export function PostHogPageView(): null {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const prevUrl = useRef('')

  useEffect(() => {
    if (!isAnalyticsEnabled()) return

    const search = searchParams.toString()
    const url = `${pathname}${search ? `?${search}` : ''}`

    if (url !== prevUrl.current) {
      prevUrl.current = url
      posthog.capture('$pageview', {
        $current_url: window.origin + url,
      })
    }
  }, [pathname, searchParams])

  return null
}
