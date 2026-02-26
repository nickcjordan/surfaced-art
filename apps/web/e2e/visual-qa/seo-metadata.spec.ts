import { test, expect } from '@playwright/test'

// Seed data references — keep in sync with packages/db/prisma/seed-data.ts
const SEED_ARTIST_SLUG = 'abbey-peters'
const SEED_ARTIST_NAME = 'Abbey Peters'

test.describe('SEO Metadata — Homepage', () => {
  test('homepage has correct meta tags', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const title = await page.title()
    expect(title).not.toBe('Create Next App')
    expect(title.length).toBeGreaterThan(10)
    expect(title.length).toBeLessThan(70)

    const description = await page
      .locator('meta[name="description"]')
      .getAttribute('content')
    expect(description).toBeTruthy()
    expect(description!.length).toBeGreaterThan(50)
    expect(description!.length).toBeLessThan(160)

    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      /.+/
    )
    await expect(
      page.locator('meta[property="og:description"]')
    ).toHaveAttribute('content', /.+/)
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /^https?:\/\//
    )
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
      'content',
      'website'
    )

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /^https?:\/\//
    )
  })
})

test.describe('SEO Metadata — Artist Profile', () => {
  test('artist profile has dynamic meta tags', async ({ page }) => {
    await page.goto(`/artist/${SEED_ARTIST_SLUG}`)
    await page.waitForLoadState('networkidle')

    const title = await page.title()
    expect(title.toLowerCase()).toContain(SEED_ARTIST_NAME.toLowerCase())

    const description = await page
      .locator('meta[name="description"]')
      .getAttribute('content')
    expect(description).toBeTruthy()
    expect(description!.length).toBeGreaterThan(30)

    const ogTitle = await page
      .locator('meta[property="og:title"]')
      .getAttribute('content')
    expect(ogTitle!.toLowerCase()).toContain(SEED_ARTIST_NAME.toLowerCase())

    // OG image should be real — not a placeholder
    const ogImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute('content')
    expect(ogImage).toMatch(/^https?:\/\//)
    expect(ogImage).not.toContain('placeholder')
  })
})

test.describe('SEO Metadata — Listing Detail', () => {
  test('listing detail has dynamic meta tags', async ({ page }) => {
    // Navigate via click-through, same as a real user
    await page.goto(`/artist/${SEED_ARTIST_SLUG}`)
    await page.waitForLoadState('networkidle')

    const firstListing = page
      .getByTestId('available-work')
      .getByTestId('listing-card')
      .first()
    await expect(firstListing).toBeVisible()

    // Wait for navigation to complete after click
    await Promise.all([
      page.waitForURL(/\/listing\//, { timeout: 10000 }),
      firstListing.click(),
    ])
    await page.waitForLoadState('networkidle')

    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      /.+/
    )
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /^https?:\/\//
    )

    // Verify JSON-LD Product schema has valid price
    const jsonLdEl = page.locator('script[type="application/ld+json"]')
    await expect(jsonLdEl.first()).toBeAttached()
    const jsonLd = await jsonLdEl.first().textContent()
    expect(jsonLd).toBeTruthy()
    const structured = JSON.parse(jsonLd!)
    expect(structured['@type']).toBe('Product')
    expect(structured.offers).toBeTruthy()
    expect(structured.offers.price).toBeTruthy()
  })
})

test.describe('SEO Metadata — Category Page', () => {
  test('category page has correct meta tags', async ({ page }) => {
    await page.goto('/category/ceramics')
    await page.waitForLoadState('networkidle')

    const title = await page.title()
    expect(title.toLowerCase()).toContain('ceramics')

    const description = await page
      .locator('meta[name="description"]')
      .getAttribute('content')
    expect(description).toBeTruthy()
  })
})

test.describe('SEO Metadata — Integrity Checks', () => {
  const PAGES_TO_CHECK = [
    '/',
    `/artist/${SEED_ARTIST_SLUG}`,
    '/category/ceramics',
  ]

  for (const path of PAGES_TO_CHECK) {
    test(`no duplicate or missing meta tags on ${path}`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')

      // Exactly one title tag
      expect(await page.locator('title').count()).toBe(1)

      // Exactly one meta description
      expect(
        await page.locator('meta[name="description"]').count()
      ).toBe(1)

      // Exactly one canonical
      expect(await page.locator('link[rel="canonical"]').count()).toBe(1)

      // No @vercel references (Vercel discipline)
      const pageContent = await page.content()
      expect(pageContent).not.toContain('@vercel')
    })
  }

  test('static pages return 200 with HTML content type', async ({ page }) => {
    const response = await page.goto(`/artist/${SEED_ARTIST_SLUG}`)
    expect(response!.status()).toBe(200)
    expect(response!.headers()['content-type']).toContain('text/html')
  })
})
