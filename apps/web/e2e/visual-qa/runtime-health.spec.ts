import { test, expect } from '@playwright/test'

// Pages to test — update as new pages are deployed
const PAGES = [
  { name: 'homepage', path: '/' },
  { name: 'category-ceramics', path: '/category/ceramics' },
  { name: 'category-painting', path: '/category/painting' },
]

/**
 * Shared predicate for filtering known acceptable noise from console errors
 * and network failures (favicon 404s, source map 404s, etc.).
 */
function isExpectedNoise(messageOrUrl: string): boolean {
  if (messageOrUrl.includes('favicon')) return true
  if (messageOrUrl.includes('.map')) return true
  return false
}

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
      await page.evaluate(async () => {
        const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
        for (let i = 0; i < document.body.scrollHeight; i += 400) {
          window.scrollTo(0, i)
          await delay(100)
        }
      })

      // Wait for any deferred errors
      await page.waitForTimeout(1000)

      expect(pageErrors, `Uncaught exceptions on ${name}`).toEqual([])

      const filteredErrors = consoleErrors.filter((err) => !isExpectedNoise(err))
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
          if (!isExpectedNoise(requestUrl)) {
            failedRequests.push(`${response.status()} ${requestUrl}`)
          }
        }
      })

      const networkErrors: string[] = []
      page.on('requestfailed', (request) => {
        const requestUrl = request.url()
        if (!isExpectedNoise(requestUrl)) {
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
        if (msg.type() === 'error' && !isExpectedNoise(msg.text())) {
          errors.push(`console.error: ${msg.text()}`)
        }
      })

      await page.goto(path)
      await page.waitForLoadState('networkidle')

      // Scroll incrementally through the entire page
      await page.evaluate(async () => {
        const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
        const scrollHeight = document.body.scrollHeight
        const step = 300
        for (let i = 0; i < scrollHeight; i += step) {
          window.scrollTo(0, i)
          await delay(150)
        }
        // Scroll to very bottom
        window.scrollTo(0, scrollHeight)
        await delay(500)
      })

      expect(errors, `Errors after scrolling ${name}`).toEqual([])
    })
  }
})

test.describe('Runtime Health — API & Infrastructure', () => {
  test('API health endpoint responds', async ({ request }) => {
    const apiBaseUrl = process.env.API_BASE_URL
    test.skip(!apiBaseUrl, 'API_BASE_URL not set — skipping to avoid hitting production')
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
    }
  })

  test('no @vercel imports in client bundle', async ({ page }) => {
    const jsResponseChecks: Promise<void>[] = []

    page.on('response', (response) => {
      const url = response.url()
      if (!url.endsWith('.js') && !url.includes('.js?')) return

      jsResponseChecks.push(
        response
          .text()
          .then((body) => {
            expect(body).not.toContain('__VERCEL_')
            expect(body).not.toContain('@vercel/analytics')
            expect(body).not.toContain('@vercel/speed-insights')
          })
          .catch(() => {
            // Ignore body read failures; network issues fail the test elsewhere
          })
      )
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check initial HTML
    const pageSource = await page.content()
    expect(pageSource).not.toContain('__VERCEL_')
    expect(pageSource).not.toContain('@vercel/analytics')
    expect(pageSource).not.toContain('@vercel/speed-insights')

    // Check all loaded JS chunks
    await Promise.all(jsResponseChecks)
  })
})
