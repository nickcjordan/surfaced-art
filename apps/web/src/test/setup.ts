import '@testing-library/jest-dom/vitest'

// Required env vars — set unconditionally for all tests.
// Tests that check throw-if-absent behavior must delete the var and call vi.resetModules().
process.env.NEXT_PUBLIC_SITE_URL = 'https://surfaced.art'
process.env.NEXT_PUBLIC_API_URL = 'https://api.surfaced.art'
process.env.NEXT_PUBLIC_CDN_DOMAINS = 'https://test.cloudfront.net'
process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID = 'us-east-1_test'
process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID = 'test-client-id'
process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test'
process.env.NEXT_PUBLIC_POSTHOG_HOST = 'https://us.i.posthog.com'
process.env.NEXT_PUBLIC_POSTHOG_ENV = 'test'
process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://test@o12345.ingest.us.sentry.io/67890'
process.env.SENTRY_DSN = 'https://test@o12345.ingest.us.sentry.io/67890'

// IntersectionObserver is not implemented in jsdom. Provide a minimal stub.
global.IntersectionObserver = class IntersectionObserver {
  private callback: IntersectionObserverCallback

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
  }

  observe() {
    // Fire immediately with isIntersecting: true (element is visible)
    this.callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      this as unknown as globalThis.IntersectionObserver,
    )
  }

  unobserve() {}
  disconnect() {}
} as unknown as typeof globalThis.IntersectionObserver

// ResizeObserver is not implemented in jsdom. Provide a stub that:
// 1. Fires the callback immediately when observation begins (mirrors real browser behavior)
// 2. Re-fires on window resize events so resize-triggered tests work
// 3. Cleans up its resize listener on disconnect()
global.ResizeObserver = class ResizeObserver {
  private callback: ResizeObserverCallback
  private handleResize: (() => void) | null = null

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }

  observe() {
    this.callback([], this)
    this.handleResize = () => { this.callback([], this) }
    window.addEventListener('resize', this.handleResize)
  }

  unobserve() {}

  disconnect() {
    if (this.handleResize) {
      window.removeEventListener('resize', this.handleResize)
      this.handleResize = null
    }
  }
}
