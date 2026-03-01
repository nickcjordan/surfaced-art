/**
 * ISR revalidation helper — fire-and-forget POST to the frontend
 * revalidation endpoint after listing/artist mutations.
 *
 * Uses native fetch. Errors are logged but never block the API response.
 */

import { logger } from '@surfaced-art/utils'

export interface RevalidationPayload {
  type: 'listing'
  id: string
  category?: string
  artistSlug?: string
}

/**
 * Trigger ISR revalidation on the frontend.
 *
 * Sends up to two requests: one for the listing and one for the artist.
 * Both are fire-and-forget — logged errors do not propagate.
 */
export function triggerRevalidation(payload: RevalidationPayload): void {
  const frontendUrl = process.env.FRONTEND_URL
  const secret = process.env.REVALIDATION_SECRET

  if (!frontendUrl || !secret) {
    logger.warn('Revalidation skipped — FRONTEND_URL or REVALIDATION_SECRET not set')
    return
  }

  const url = `${frontendUrl}/api/revalidate`
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${secret}`,
  }

  // Revalidate listing page + category + homepage
  void fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      type: 'listing',
      id: payload.id,
      category: payload.category,
    }),
  }).catch((err) => {
    logger.error('Revalidation failed (listing)', { error: String(err), listingId: payload.id })
  })

  // Revalidate artist profile page if slug provided
  if (payload.artistSlug) {
    void fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'artist',
        slug: payload.artistSlug,
      }),
    }).catch((err) => {
      logger.error('Revalidation failed (artist)', { error: String(err), slug: payload.artistSlug })
    })
  }
}
