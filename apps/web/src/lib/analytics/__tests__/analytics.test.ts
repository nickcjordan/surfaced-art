import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock posthog-js before importing analytics module
vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
    opt_in_capturing: vi.fn(),
    opt_out_capturing: vi.fn(),
    set_config: vi.fn(),
    debug: vi.fn(),
  },
}))

import posthog from 'posthog-js'

describe('ANALYTICS_EVENTS', () => {
  it('should export correct event name constants', async () => {
    const { ANALYTICS_EVENTS } = await import('../analytics')
    expect(ANALYTICS_EVENTS.WAITLIST_SIGNUP).toBe('waitlist_signup')
    expect(ANALYTICS_EVENTS.LISTING_VIEW).toBe('listing_view')
    expect(ANALYTICS_EVENTS.ARTIST_PROFILE_VIEW).toBe('artist_profile_view')
  })
})

describe('isAnalyticsEnabled', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('should return false when NEXT_PUBLIC_POSTHOG_KEY is not set', async () => {
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', '')
    vi.resetModules()
    const { isAnalyticsEnabled } = await import('../analytics')
    expect(isAnalyticsEnabled()).toBe(false)
  })

  it('should return true when NEXT_PUBLIC_POSTHOG_KEY is set and window exists', async () => {
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'phc_test123')
    vi.resetModules()
    const { isAnalyticsEnabled } = await import('../analytics')
    expect(isAnalyticsEnabled()).toBe(true)
  })
})

describe('consent management', () => {
  let getStoredConsent: typeof import('../analytics').getStoredConsent
  let grantConsent: typeof import('../analytics').grantConsent
  let denyConsent: typeof import('../analytics').denyConsent

  beforeEach(async () => {
    localStorage.clear()
    vi.resetModules()
    const mod = await import('../analytics')
    getStoredConsent = mod.getStoredConsent
    grantConsent = mod.grantConsent
    denyConsent = mod.denyConsent
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should return "pending" when no consent value is stored', () => {
    expect(getStoredConsent()).toBe('pending')
  })

  it('should return "granted" when localStorage has "granted"', () => {
    localStorage.setItem('sa_analytics_consent', 'granted')
    expect(getStoredConsent()).toBe('granted')
  })

  it('should return "denied" when localStorage has "denied"', () => {
    localStorage.setItem('sa_analytics_consent', 'denied')
    expect(getStoredConsent()).toBe('denied')
  })

  it('should return "pending" for unknown stored values', () => {
    localStorage.setItem('sa_analytics_consent', 'something_else')
    expect(getStoredConsent()).toBe('pending')
  })

  it('grantConsent should store "granted" and call posthog.opt_in_capturing', () => {
    grantConsent()
    expect(localStorage.getItem('sa_analytics_consent')).toBe('granted')
    expect(posthog.opt_in_capturing).toHaveBeenCalled()
    expect(posthog.set_config).toHaveBeenCalledWith({
      persistence: 'localStorage+cookie',
    })
  })

  it('denyConsent should store "denied" and call posthog.opt_out_capturing', () => {
    denyConsent()
    expect(localStorage.getItem('sa_analytics_consent')).toBe('denied')
    expect(posthog.opt_out_capturing).toHaveBeenCalled()
  })
})

describe('tracking helpers', () => {
  let trackWaitlistSignup: typeof import('../analytics').trackWaitlistSignup
  let trackListingView: typeof import('../analytics').trackListingView
  let trackArtistProfileView: typeof import('../analytics').trackArtistProfileView

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    const mod = await import('../analytics')
    trackWaitlistSignup = mod.trackWaitlistSignup
    trackListingView = mod.trackListingView
    trackArtistProfileView = mod.trackArtistProfileView
  })

  it('trackWaitlistSignup should capture waitlist_signup without PII', () => {
    trackWaitlistSignup()
    expect(posthog.capture).toHaveBeenCalledWith('waitlist_signup')
  })

  it('trackListingView should capture listing_view with listing_id and category', () => {
    trackListingView('abc-123', 'ceramics')
    expect(posthog.capture).toHaveBeenCalledWith('listing_view', {
      listing_id: 'abc-123',
      category: 'ceramics',
    })
  })

  it('trackArtistProfileView should capture artist_profile_view with artist_slug', () => {
    trackArtistProfileView('jane-doe')
    expect(posthog.capture).toHaveBeenCalledWith('artist_profile_view', {
      artist_slug: 'jane-doe',
    })
  })
})

describe('POSTHOG_OPTIONS', () => {
  it('should export GDPR-safe defaults for PostHogProvider', async () => {
    const { POSTHOG_OPTIONS } = await import('../analytics')
    expect(POSTHOG_OPTIONS).toMatchObject({
      opt_out_capturing_by_default: true,
      persistence: 'memory',
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: true,
    })
  })

  it('should export POSTHOG_KEY from env', async () => {
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'phc_test123')
    vi.resetModules()
    const { POSTHOG_KEY } = await import('../analytics')
    expect(POSTHOG_KEY).toBe('phc_test123')
    vi.unstubAllEnvs()
    vi.resetModules()
  })
})
