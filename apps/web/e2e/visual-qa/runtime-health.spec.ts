import { test, expect } from '@playwright/test'
import {
  isIgnorableAsset,
  scrollPageIncrementally,
  EXPECTED_CDN_HOSTNAME,
} from './helpers'

// Pages to test — keep in sync with deployed seed data
const PAGES = [
  { name: 'homepage', path: '/' },
  { name: 'artist-abbey-peters', path: '/artist/abbey-peters' },
  { name: 'artist-david-morrison', path: '/artist/david-morrison' },
  { name: 'artist-karina-yanes', path: '/artist/karina-yanes' },
  { name: 'category-ceramics', path: '/category/ceramics' },
  { name: 'category-painting', path: '/category/painting' },
]

test.describe('Runtime Health — Console Errors', () => {
  for (const { name, path } of PAGES) {
    test(`no console errors on ${name} (${path})`, async ({ page }) => {
      const consoleErrors: string[] = []
      const consoleWarnings: string[] = []

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(
            `${msg.text()} [${msg.location().url}:${msg.location().lineNumber}]`
          )
        }
        if (msg.type() === 'warning') {
          consoleWarnings.push(msg.text())
        }
      })

      const pageErrors: string[] = []
      page.on('pageerror', (error) => {
        pageErrors.push(`${error.name}: ${error.message}`)
      })

      await page.goto(path)
      await page.waitForLoadState('networkidle')

      // Scroll the full page to trigger lazy-loaded content errors
      await scrollPageIncrementally(page, { step: 400, delayMs: 100 })

      // Wait for any deferred errors
      await page.waitForTimeout(1000)

      expect(pageErrors, `Uncaught exceptions on ${name}`).toEqual([])

      const filteredErrors = consoleErrors.filter(
        (err) => !isIgnorableAsset(err)
      )
      expect(filteredErrors, `Console errors on ${name}`).toEqual([])

      if (consoleWarnings.length > 0) {
        console.log(`[WARNINGS on ${name}]:`, consoleWarnings)
      }
    })
  }
})

test.describe('Runtime Health — Network Failures', () => {
  for (const { name, path } of PAGES) {
    test(`no failed network requests on ${name} (${path})`, async ({ page }) => {
      const failedRequests: string[] = []

      page.on('response', (response) => {
        if (response.status() >= 400) {
          const requestUrl = response.url()
          if (!isIgnorableAsset(requestUrl)) {
            failedRequests.push(`${response.status()} ${requestUrl}`)
          }
        }
      })

      const networkErrors: string[] = []
      page.on('requestfailed', (request) => {
        const requestUrl = request.url()
        if (!isIgnorableAsset(requestUrl)) {
          networkErrors.push(
            `FAILED: ${requestUrl} — ${request.failure()?.errorText}`
          )
        }
      })

      await page.goto(path)
      await page.waitForLoadState('networkidle')

      expect(failedRequests, `Failed HTTP requests on ${name}`).toEqual([])
      expect(networkErrors, `Network errors on ${name}`).toEqual([])
    })
  }
})

test.describe('Runtime Health — Scroll-Triggered Errors', () => {
  for (const { name, path } of PAGES) {
    test(`no errors after full scroll on ${name} (${path})`, async ({ page }) => {
      const errors: string[] = []

      page.on('pageerror', (error) => {
        errors.push(`${error.name}: ${error.message}`)
      })

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text()
          if (!isIgnorableAsset(text)) {
            errors.push(`console.error: ${text}`)
          }
        }
      })

      await page.goto(path)
      await page.waitForLoadState('networkidle')

      // Scroll incrementally through the entire page
      await scrollPageIncrementally(page)

      expect(errors, `Errors after scrolling ${name}`).toEqual([])
    })
  }
})

test.describe('Runtime Health — API & Infrastructure', () => {
  test('API health endpoint responds', async ({ request }) => {
    const apiBaseUrl =
      process.env.API_BASE_URL || 'https://api.surfaced.art'
    const response = await request.get(`${apiBaseUrl}/health`)
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.status).toBe('ok')
  })

  test('images load from CloudFront, not direct S3', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const imageSrcs = await page.locator('img').evaluateAll((imgs) =>
      imgs
        .map((img) => (img as HTMLImageElement).src)
        .filter((src) => src && !src.startsWith('data:'))
    )

    for (const src of imageSrcs) {
      expect(src, `Image served from S3: ${src}`).not.toContain(
        '.s3.amazonaws.com'
      )
      expect(src, `Image not HTTPS: ${src}`).toMatch(/^https:\/\//)

      const hostname = new URL(src).hostname
      expect(
        hostname,
        `Image not served from expected CDN (${EXPECTED_CDN_HOSTNAME}): ${src}`
      ).toContain(EXPECTED_CDN_HOSTNAME)
    }
  })

  test('no @vercel imports in client bundle', async ({ page }) => {
    await page.goto('/')

    const pageSource = await page.content()
    expect(pageSource).not.toContain('__VERCEL_')
    expect(pageSource).not.toContain('@vercel/analytics')
    expect(pageSource).not.toContain('@vercel/speed-insights')
  })
})
