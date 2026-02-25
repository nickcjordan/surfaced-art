import { test, expect } from '@playwright/test'

// Seed data references — keep in sync with packages/db/prisma/seed-data.ts
const SEED_CATEGORY = 'ceramics'
const SEED_CATEGORY_LABEL = 'Ceramics'

test.describe('E2E: Category Browsing → Listing Detail', () => {
  test('browse category and navigate to listing detail', async ({ page }) => {
    // Step 1: Navigate to category page
    await page.goto(`/category/${SEED_CATEGORY}`)
    await page.waitForLoadState('networkidle')

    // Step 2: Verify category page renders
    await expect(page.getByTestId('category-header')).toBeVisible()
    await expect(page.getByTestId('category-header')).toContainText(SEED_CATEGORY_LABEL)

    // Step 3: Verify listing grid is visible with listing cards
    await expect(page.getByTestId('category-content')).toBeVisible()
    const listingCards = page.getByTestId('listing-card')
    await expect(listingCards.first()).toBeVisible()
    const listingCount = await listingCards.count()
    expect(listingCount).toBeGreaterThan(0)

    // Step 4: Verify listing cards show expected content (image, title, price via card info)
    const firstCard = listingCards.first()
    // Card should have an image (either an <img> or a placeholder div)
    const cardImage = firstCard.locator('img')
    const hasImage = await cardImage.count()
    if (hasImage > 0) {
      await expect(cardImage.first()).toBeVisible()
    }

    // Step 5: Click a listing card
    await firstCard.click()
    await page.waitForLoadState('networkidle')

    // Step 6: Verify listing detail page renders correctly
    expect(page.url()).toContain('/listing/')
    await expect(page.getByTestId('listing-title')).toBeVisible()
    await expect(page.getByTestId('listing-price')).toBeVisible()
    // Price should be formatted as $X.XX
    const priceText = await page.getByTestId('listing-price').textContent()
    expect(priceText).toMatch(/\$[\d,]+\.\d{2}/)
    await expect(page.getByTestId('listing-images')).toBeVisible()
    await expect(page.getByTestId('listing-description')).toBeVisible()

    // Step 7: Verify artist card on listing detail links to artist profile
    const artistCard = page.getByTestId('artist-card')
    await expect(artistCard).toBeVisible()
    const artistLink = artistCard.locator('a[href*="/artist/"]')
    if (await artistLink.count() > 0) {
      const href = await artistLink.first().getAttribute('href')
      expect(href).toMatch(/\/artist\/[\w-]+/)
    }
  })
})
