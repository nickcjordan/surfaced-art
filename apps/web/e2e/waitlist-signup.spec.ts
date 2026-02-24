import { test, expect } from '@playwright/test'

// Generate a unique email for each test run to avoid conflicts
function uniqueEmail(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `e2e-test-${timestamp}-${random}@example.com`
}

test.describe('E2E: Waitlist Signup', () => {
  test('submit waitlist form and verify success', async ({ page }) => {
    const testEmail = uniqueEmail()

    // Step 1: Navigate to homepage
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Step 2: Locate the waitlist signup form
    const waitlistSection = page.getByTestId('waitlist')
    await expect(waitlistSection).toBeVisible()

    // Step 3: Enter a valid email address
    const emailInput = page.getByTestId('waitlist-email-input')
    await expect(emailInput).toBeVisible()
    await emailInput.fill(testEmail)

    // Step 4: Submit the form
    const submitButton = page.getByTestId('waitlist-submit')
    await expect(submitButton).toBeVisible()
    await submitButton.click()

    // Step 5: Verify success state is displayed
    const successMessage = page.getByTestId('waitlist-success')
    await expect(successMessage).toBeVisible({ timeout: 10_000 })

    // Step 6: Navigate away and back to reset form state, then try same email
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Step 7: Attempt to submit the same email again
    const emailInputAgain = page.getByTestId('waitlist-email-input')
    await emailInputAgain.fill(testEmail)
    const submitButtonAgain = page.getByTestId('waitlist-submit')
    await submitButtonAgain.click()

    // Step 8: Verify appropriate feedback is shown (either success or "already signed up" — not a crash)
    // The form should respond gracefully — either show success again or an informational message
    await page.waitForTimeout(3000)
    // Verify no uncaught errors — page should still be functional
    const waitlistSectionStillVisible = page.getByTestId('waitlist')
    await expect(waitlistSectionStillVisible).toBeVisible()
    // Should see either success message or an error message — not a blank/broken state
    const hasSuccess = await page.getByTestId('waitlist-success').isVisible()
    const hasError = await page.getByTestId('waitlist-error').isVisible()
    expect(hasSuccess || hasError).toBeTruthy()
  })
})
