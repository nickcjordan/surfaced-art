import type { Page } from '@playwright/test'

/**
 * Expected CloudFront CDN hostname for media assets.
 * Configurable via CLOUDFRONT_HOSTNAME env var for different environments.
 * Falls back to the `.cloudfront.net` suffix check when no specific hostname is set.
 */
export const EXPECTED_CDN_HOSTNAME =
  process.env.CLOUDFRONT_HOSTNAME || 'cloudfront.net'

/**
 * Returns true if the URL or console message refers to a known-acceptable
 * asset that should not cause test failures (e.g. missing favicon, source maps).
 */
export function isIgnorableAsset(urlOrMessage: string): boolean {
  return urlOrMessage.includes('favicon') || urlOrMessage.includes('.map')
}

/**
 * Scrolls the page incrementally from top to bottom, pausing between steps
 * to trigger lazy-loaded content and intersection observers.
 *
 * Includes a guard for unexpected DOM states (e.g. error pages without a body).
 */
export async function scrollPageIncrementally(
  page: Page,
  options: { step?: number; delayMs?: number } = {}
): Promise<void> {
  const { step = 300, delayMs = 150 } = options

  await page.evaluate(
    async ({ step, delayMs }) => {
      if (!document.body) return

      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms))
      const scrollHeight = document.body.scrollHeight

      for (let i = 0; i < scrollHeight; i += step) {
        window.scrollTo(0, i)
        await delay(delayMs)
      }

      // Scroll to very bottom to ensure footer content loads
      window.scrollTo(0, scrollHeight)
      await delay(delayMs)
    },
    { step, delayMs }
  )
}
