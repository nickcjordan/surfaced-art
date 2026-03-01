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
 *
 * Also ignores 400 responses for the app root — Next.js App Router issues
 * internal RSC prefetch/revalidation requests to the origin root that return 400
 * on Vercel preview deployments. These are normal framework behaviour and do not
 * indicate application errors.
 */
export function isIgnorableAsset(urlOrMessage: string): boolean {
  if (urlOrMessage.includes('favicon')) return true
  if (urlOrMessage.includes('.map')) return true
  // Next.js RSC prefetch requests to the deployment origin root return 400 on
  // Vercel previews — matches "400 https://example.vercel.app" or "400 https://example.vercel.app/"
  if (/^400 https?:\/\/[^/]+(\/)?$/.test(urlOrMessage)) return true
  // Vercel preview toolbar injects feedback.js which our CSP blocks — not an app error
  if (urlOrMessage.includes('vercel.live')) return true
  // Next.js RSC prefetch requests can be aborted mid-navigation (net::ERR_ABORTED) —
  // this is normal browser behaviour when the user or framework cancels a prefetch
  if (urlOrMessage.includes('net::ERR_ABORTED')) return true
  return false
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
