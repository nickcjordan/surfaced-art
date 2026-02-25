import { test } from '@playwright/test'

// Breakpoints matching Tailwind defaults + key real devices
const BREAKPOINTS = [
  { name: 'mobile-sm', width: 375, height: 812 },
  { name: 'mobile-lg', width: 428, height: 926 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'desktop-sm', width: 1280, height: 800 },
  { name: 'desktop-lg', width: 1440, height: 900 },
  { name: 'desktop-xl', width: 1920, height: 1080 },
]

// Pages to capture — keep in sync with deployed seed data
const PAGES = [
  { name: 'homepage', path: '/' },
  { name: 'artist-profile', path: '/artist/abbey-peters' },
  { name: 'category-ceramics', path: '/category/ceramics' },
]

for (const bp of BREAKPOINTS) {
  for (const pg of PAGES) {
    test(`${pg.name} at ${bp.name} (${bp.width}x${bp.height})`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        viewport: { width: bp.width, height: bp.height },
      })
      const page = await context.newPage()

      await page.goto(pg.path)
      await page.waitForLoadState('networkidle')

      // Full-page screenshot
      await page.screenshot({
        path: `results/responsive/${pg.name}-${bp.name}.png`,
        fullPage: true,
      })

      // Above-the-fold screenshot (what the user sees without scrolling)
      await page.screenshot({
        path: `results/responsive/${pg.name}-${bp.name}-fold.png`,
        fullPage: false,
      })

      await context.close()
    })
  }
}

// Listing detail captured by navigating through an artist profile (click-through, not direct URL)
for (const bp of BREAKPOINTS) {
  test(`listing-detail at ${bp.name} (${bp.width}x${bp.height})`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: bp.width, height: bp.height },
    })
    const page = await context.newPage()

    await page.goto('/artist/abbey-peters')
    await page.waitForLoadState('networkidle')

    const firstListing = page
      .getByTestId('available-work')
      .getByTestId('listing-card')
      .first()

    if (await firstListing.isVisible()) {
      await firstListing.click()
      await page.waitForLoadState('networkidle')

      await page.screenshot({
        path: `results/responsive/listing-detail-${bp.name}.png`,
        fullPage: true,
      })

      await page.screenshot({
        path: `results/responsive/listing-detail-${bp.name}-fold.png`,
        fullPage: false,
      })
    }

    await context.close()
  })
}
