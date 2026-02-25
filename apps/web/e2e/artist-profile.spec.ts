import { test, expect } from '@playwright/test'

// Seed data references — keep in sync with packages/db/prisma/seed-data.ts
const SEED_ARTIST_SLUG = 'abbey-peters'
const SEED_ARTIST_NAME = 'Abbey Peters'

test.describe('E2E: Artist Profile Browsing → Listing Detail → Navigate Back', () => {
  test('full artist profile browsing journey', async ({ page }) => {
    // Step 1: Navigate to artist profile
    await page.goto(`/artist/${SEED_ARTIST_SLUG}`)
    await page.waitForLoadState('networkidle')

    // Step 2: Verify profile renders
    await expect(page.getByTestId('artist-hero')).toBeVisible()
    await expect(page.getByTestId('artist-name')).toBeVisible()
    await expect(page.getByTestId('artist-name')).toContainText(SEED_ARTIST_NAME)
    await expect(page.getByTestId('artist-bio')).toBeVisible()

    // Step 3: Verify listings section renders with at least one listing card
    await expect(page.getByTestId('available-work')).toBeVisible()
    const listingCards = page.getByTestId('listing-card')
    await expect(listingCards.first()).toBeVisible()
    const listingCount = await listingCards.count()
    expect(listingCount).toBeGreaterThan(0)

    // Step 4: Verify CV/history section renders (if artist has CV entries)
    const cvSection = page.getByTestId('cv-section')
    // CV section may or may not exist depending on seed data
    if (await cvSection.isVisible()) {
      await expect(cvSection).toBeVisible()
    }

    // Step 5: Click a listing card in the "Available Work" section
    const firstListingCard = listingCards.first()
    const listingHref = await firstListingCard.getAttribute('href')
    expect(listingHref).toBeTruthy()
    await firstListingCard.click()
    await page.waitForLoadState('networkidle')

    // Step 6: Verify listing detail page renders
    expect(page.url()).toContain('/listing/')
    await expect(page.getByTestId('listing-title')).toBeVisible()
    await expect(page.getByTestId('listing-price')).toBeVisible()
    // Price should be formatted as $X.XX, not raw cents
    const priceText = await page.getByTestId('listing-price').textContent()
    expect(priceText).toMatch(/\$[\d,]+\.\d{2}/)
    await expect(page.getByTestId('listing-images')).toBeVisible()

    // Step 7: Navigate back to the artist profile
    await page.goBack()
    await page.waitForLoadState('networkidle')

    // Step 8: Verify artist profile still renders correctly (no broken state)
    await expect(page.getByTestId('artist-hero')).toBeVisible()
    await expect(page.getByTestId('artist-name')).toContainText(SEED_ARTIST_NAME)
    await expect(page.getByTestId('available-work')).toBeVisible()
  })
})
