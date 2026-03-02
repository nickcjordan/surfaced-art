'use client'

import { useEffect, useRef } from 'react'
import { trackArtistProfileView } from '@/lib/analytics'

interface ArtistProfileViewTrackerProps {
  artistSlug: string
}

export function ArtistProfileViewTracker({
  artistSlug,
}: ArtistProfileViewTrackerProps) {
  const tracked = useRef(false)

  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true
      trackArtistProfileView(artistSlug)
    }
  }, [artistSlug])

  return null
}
