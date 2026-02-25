import { test, expect } from '@playwright/test'

test.describe('Waitlist Flow — Email Capture', () => {
  test('valid email submission shows success state', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const waitlistSection = page.getByTestId('waitlist')
    await expect(waitlistSection).toBeVisible()

    // Use a timestamp-based email to avoid collisions between test runs
    const testEmail = `visual-qa-${Date.now()}@example.com`
    await page.getByTestId('waitlist-email-input').fill(testEmail)
    await page.getByTestId('waitlist-submit').click()

    // Allow up to 15s for the API response — Lambda cold starts can take 3-8s
    await expect(page.getByTestId('waitlist-success')).toBeVisible({
      timeout: 15000,
    })
  })

  test('invalid email shows error state', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.getByTestId('waitlist-email-input').fill('not-an-email')
    await page.getByTestId('waitlist-submit').click()

    await expect(page.getByTestId('waitlist-error')).toBeVisible({
      timeout: 3000,
    })
  })

  test('empty submission does not show success', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.getByTestId('waitlist-submit').click()

    // Either client-side validation prevents submission or an error is shown —
    // the success state must not appear either way
    await expect(page.getByTestId('waitlist-success')).not.toBeVisible()
  })

  test('duplicate email submission does not show an error', async ({ page }) => {
    const testEmail = `visual-qa-dup-${Date.now()}@example.com`

    // First submission
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.getByTestId('waitlist-email-input').fill(testEmail)
    await page.getByTestId('waitlist-submit').click()
    await expect(page.getByTestId('waitlist-success')).toBeVisible({
      timeout: 15000,
    })

    // Second submission with the same email
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.getByTestId('waitlist-email-input').fill(testEmail)
    await page.getByTestId('waitlist-submit').click()

    // Must not show an error — the API handles duplicates gracefully.
    // Wait up to 15s for the response (Lambda cold start), then verify no error.
    await page.waitForTimeout(15000)
    await expect(page.getByTestId('waitlist-error')).not.toBeVisible()
  })
})
