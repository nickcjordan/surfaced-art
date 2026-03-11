import posthog from 'posthog-js'
import type { PostHogConfig } from 'posthog-js'

// ─── Event Names ──────────────────────────────────────────────
export const ANALYTICS_EVENTS = {
  WAITLIST_SIGNUP: 'waitlist_signup',
  LISTING_VIEW: 'listing_view',
  ARTIST_PROFILE_VIEW: 'artist_profile_view',
} as const

// ─── Configuration ───────────────────────────────────────────
// Exported so layout.tsx can pass them to PostHogProvider from posthog-js/react.
import { POSTHOG_KEY, POSTHOG_HOST, POSTHOG_ENV } from '@/lib/env'
export { POSTHOG_KEY, POSTHOG_HOST, POSTHOG_ENV }

export function isAnalyticsEnabled(): boolean {
  return typeof window !== 'undefined'
}

/** PostHog init options passed to PostHogProvider from posthog-js/react. */
export const POSTHOG_OPTIONS: Partial<PostHogConfig> = {
  api_host: POSTHOG_HOST,
  // GDPR: start opted out, memory-only persistence until consent
  opt_out_capturing_by_default: true,
  persistence: 'memory',
  // Disable autocapture — we track explicit events only
  autocapture: false,
  // Capture pageviews manually via PostHogPageView component
  capture_pageview: false,
  capture_pageleave: true,
  // Tag every event with the environment so dev/preview traffic
  // can be filtered out in a single-project setup.
  loaded: (ph) => {
    ph.register({ environment: POSTHOG_ENV })
  },
}

// ─── Consent Management ──────────────────────────────────────
const CONSENT_KEY = 'sa_analytics_consent'

export type ConsentStatus = 'granted' | 'denied' | 'pending'

export function getStoredConsent(): ConsentStatus {
  if (typeof window === 'undefined') return 'pending'
  try {
    const value = localStorage.getItem(CONSENT_KEY)
    if (value === 'granted' || value === 'denied') return value
  } catch {
    // Storage unavailable (e.g. private browsing), treat as no stored decision
  }
  return 'pending'
}

export function grantConsent(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CONSENT_KEY, 'granted')
  } catch {
    // Storage unavailable — consent still applied in-memory via PostHog
  }
  posthog.opt_in_capturing()
  posthog.set_config({ persistence: 'localStorage+cookie' })
}

export function denyConsent(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CONSENT_KEY, 'denied')
  } catch {
    // Storage unavailable — consent still applied in-memory via PostHog
  }
  posthog.opt_out_capturing()
}

// ─── Tracking Helpers ─────────────────────────────────────────
export function trackWaitlistSignup(): void {
  if (!isAnalyticsEnabled()) return
  posthog.capture(ANALYTICS_EVENTS.WAITLIST_SIGNUP)
}

export function trackListingView(listingId: string, category: string): void {
  if (!isAnalyticsEnabled()) return
  posthog.capture(ANALYTICS_EVENTS.LISTING_VIEW, {
    listing_id: listingId,
    category,
  })
}

export function trackArtistProfileView(artistSlug: string): void {
  if (!isAnalyticsEnabled()) return
  posthog.capture(ANALYTICS_EVENTS.ARTIST_PROFILE_VIEW, {
    artist_slug: artistSlug,
  })
}
