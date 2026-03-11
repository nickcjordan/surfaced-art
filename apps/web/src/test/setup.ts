import '@testing-library/jest-dom/vitest'

// Required env vars that site-config.ts and security-headers.ts throw on if absent.
// Tests that specifically test the throw-if-absent behavior must unstub these and
// call vi.resetModules() before re-importing the module.
process.env.NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://surfaced.art'
process.env.NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.surfaced.art'

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
