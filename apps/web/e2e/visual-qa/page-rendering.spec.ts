import { test, expect } from '@playwright/test'

// Seed data references — keep in sync with packages/db/prisma/seed-data.ts
const SEED_ARTISTS = [
  { slug: 'abbey-peters', displayName: 'Abbey Peters' },
  { slug: 'david-morrison', displayName: 'David Morrison' },
  { slug: 'karina-yanes', displayName: 'Karina Yanes' },
]

const CATEGORIES = [
  'ceramics',
  'painting',
  'print',
  'jewelry',
  'illustration',
  'photography',
  'woodworking',
  'fibers',
  'mixed_media',
]

test.describe('Page Rendering — Homepage', () => {
  test('homepage renders with all sections', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page.getByTestId('hero')).toBeVisible()
    await expect(page.getByTestId('featured-artists')).toBeVisible()

    // At least one artist card rendered
    const artistCards = page.getByTestId('artist-card')
    await expect(artistCards.first()).toBeVisible()

    await expect(page.getByTestId('featured-listings')).toBeVisible()

    // At least one listing card rendered
    const listingCards = page.getByTestId('listing-card')
    await expect(listingCards.first()).toBeVisible()

    // Category grid rendered (lives inside the CategoryGrid component)
    await expect(page.getByTestId('category-grid')).toBeVisible()

    await expect(page.getByTestId('waitlist')).toBeVisible()

    await page.screenshot({
      path: `results/homepage-${test.info().project.name}.png`,
      fullPage: true,
    })
  })
})

test.describe('Page Rendering — Artist Profiles', () => {
  for (const artist of SEED_ARTISTS) {
    test(`artist profile renders: ${artist.displayName}`, async ({ page }) => {
      await page.goto(`/artist/${artist.slug}`)
      await page.waitForLoadState('networkidle')

      // Did not 404
      await expect(page).not.toHaveTitle(/404|not found/i)

      await expect(page.getByTestId('artist-hero')).toBeVisible()
      await expect(page.getByTestId('artist-name')).toContainText(
        artist.displayName
      )
      await expect(page.getByTestId('artist-bio')).toBeVisible()
      await expect(page.getByTestId('available-work')).toBeVisible()

      await page.screenshot({
        path: `results/artist-${artist.slug}-${test.info().project.name}.png`,
        fullPage: true,
      })
    })
  }
})

test.describe('Page Rendering — Listing Detail', () => {
  test('listing detail renders after clicking through from artist profile', async ({
    page,
  }) => {
    await page.goto(`/artist/${SEED_ARTISTS[0].slug}`)
    await page.waitForLoadState('networkidle')

    // Click first listing card in the available work section
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

    await expect(page.getByTestId('listing-title')).toBeVisible()
    await expect(page.getByTestId('listing-price')).toBeVisible()
    await expect(page.getByTestId('listing-images')).toBeVisible()
    await expect(page.getByTestId('listing-description')).toBeVisible()
    await expect(page.getByTestId('artist-card')).toBeVisible()

    // Price must be formatted as $X.XX — not raw cents
    const priceText = await page.getByTestId('listing-price').textContent()
    expect(priceText).toMatch(/\$[\d,]+\.\d{2}/)

    await page.screenshot({
      path: `results/listing-detail-${test.info().project.name}.png`,
      fullPage: true,
    })
  })
})

test.describe('Page Rendering — Category Pages', () => {
  for (const category of CATEGORIES) {
    test(`category page renders: ${category}`, async ({ page }) => {
      await page.goto(`/category/${category}`)
      await page.waitForLoadState('networkidle')

      await expect(page).not.toHaveTitle(/404|not found/i)
      await expect(page.getByTestId('category-header')).toBeVisible()
      await expect(page.getByTestId('category-content')).toBeVisible()

      await page.screenshot({
        path: `results/category-${category}-${test.info().project.name}.png`,
        fullPage: true,
      })
    })
  }
})
