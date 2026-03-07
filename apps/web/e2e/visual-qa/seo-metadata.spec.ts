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

    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image'
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

    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image'
    )
  })
})

test.describe('SEO Metadata — Artist Studio Page', () => {
  test('studio page title is artist name only (no "Surfaced Art")', async ({ page }) => {
    await page.goto(`/studio/${SEED_ARTIST_SLUG}`)
    await page.waitForLoadState('networkidle')

    const title = await page.title()
    expect(title.toLowerCase()).toContain(SEED_ARTIST_NAME.toLowerCase())
    expect(title.toLowerCase()).not.toContain('surfaced art')
  })

  test('studio page has description, OG tags, and canonical', async ({ page }) => {
    await page.goto(`/studio/${SEED_ARTIST_SLUG}`)
    await page.waitForLoadState('networkidle')

    const description = await page
      .locator('meta[name="description"]')
      .getAttribute('content')
    expect(description).toBeTruthy()
    expect(description!.length).toBeGreaterThan(30)

    const ogTitle = await page
      .locator('meta[property="og:title"]')
      .getAttribute('content')
    expect(ogTitle!.toLowerCase()).toContain(SEED_ARTIST_NAME.toLowerCase())

    const ogImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute('content')
    expect(ogImage).toMatch(/^https?:\/\//)

    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute('href')
    expect(canonical).toContain(`/studio/${SEED_ARTIST_SLUG}`)
  })

  test('studio page is indexable (no noindex)', async ({ page }) => {
    await page.goto(`/studio/${SEED_ARTIST_SLUG}`)
    await page.waitForLoadState('networkidle')

    const robots = await page
      .locator('meta[name="robots"]')
      .getAttribute('content')
    // robots meta may be absent (defaults to index,follow) or explicitly set — must not be noindex
    if (robots) {
      expect(robots).not.toContain('noindex')
    }
  })

  test('studio page has Person JSON-LD schema', async ({ page }) => {
    await page.goto(`/studio/${SEED_ARTIST_SLUG}`)
    await page.waitForLoadState('networkidle')

    const jsonLdEl = page.locator('script[type="application/ld+json"]')
    await expect(jsonLdEl.first()).toBeAttached()
    const jsonLd = await jsonLdEl.first().textContent()
    expect(jsonLd).toBeTruthy()
    const structured = JSON.parse(jsonLd!)
    expect(structured['@type']).toBe('Person')
    expect(structured.name).toBeTruthy()
  })

  test('studio page has no site header or footer', async ({ page }) => {
    await page.goto(`/studio/${SEED_ARTIST_SLUG}`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByTestId('site-header')).not.toBeAttached()
    await expect(page.getByTestId('site-footer')).not.toBeAttached()
  })

  test('studio page top bar is visible with shop link', async ({ page }) => {
    await page.goto(`/studio/${SEED_ARTIST_SLUG}`)
    await page.waitForLoadState('networkidle')

    const topBar = page.getByTestId('studio-top-bar')
    await expect(topBar).toBeVisible()

    const shopLink = topBar.locator('a[href*="/artist/"]')
    await expect(shopLink).toBeVisible()
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

    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image'
    )
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

    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image'
    )
  })
})

test.describe('SEO Metadata — Search Page', () => {
  test('search page has correct meta tags and noindex', async ({ page }) => {
    await page.goto('/search?q=ceramic')
    await page.waitForLoadState('networkidle')

    const title = await page.title()
    expect(title.toLowerCase()).toContain('search')
    expect(title.toLowerCase()).toContain('ceramic')

    const description = await page
      .locator('meta[name="description"]')
      .getAttribute('content')
    expect(description).toBeTruthy()

    // Search pages should be noindex
    const robots = await page
      .locator('meta[name="robots"]')
      .getAttribute('content')
    expect(robots).toContain('noindex')

    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image'
    )
  })

  test('search page without query shows prompt state', async ({ page }) => {
    await page.goto('/search')
    await page.waitForLoadState('networkidle')

    const title = await page.title()
    expect(title.toLowerCase()).toContain('search')
  })
})

test.describe('SEO Metadata — For Artists Page', () => {
  test('for-artists page has correct meta tags', async ({ page }) => {
    await page.goto('/for-artists')
    await page.waitForLoadState('networkidle')

    const title = await page.title()
    expect(title.toLowerCase()).toContain('for artists')

    const description = await page
      .locator('meta[name="description"]')
      .getAttribute('content')
    expect(description).toBeTruthy()
    expect(description!.length).toBeGreaterThan(50)

    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      /.+/
    )

    // Verify JSON-LD WebPage schema
    const jsonLdEl = page.locator('script[type="application/ld+json"]')
    await expect(jsonLdEl.first()).toBeAttached()
    const jsonLd = await jsonLdEl.first().textContent()
    expect(jsonLd).toBeTruthy()
    const structured = JSON.parse(jsonLd!)
    expect(structured['@type']).toBe('WebPage')
  })
})

test.describe('SEO Metadata — Integrity Checks', () => {
  const PAGES_TO_CHECK = [
    '/',
    `/artist/${SEED_ARTIST_SLUG}`,
    `/studio/${SEED_ARTIST_SLUG}`,
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
