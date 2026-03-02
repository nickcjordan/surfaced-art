'use client'

import { useEffect, useRef } from 'react'
import { trackListingView } from '@/lib/analytics'

interface ListingViewTrackerProps {
  listingId: string
  category: string
}

export function ListingViewTracker({
  listingId,
  category,
}: ListingViewTrackerProps) {
  const tracked = useRef(false)

  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true
      trackListingView(listingId, category)
    }
  }, [listingId, category])

  return null
}
