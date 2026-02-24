import { defineConfig, devices } from '@playwright/test'

/**
 * E2E acceptance tests for Phase 2.
 * These test critical user journeys against a running dev server with seeded data.
 *
 * Usage:
 *   npx playwright test --config=e2e/playwright.config.ts
 *
 * Requires:
 *   - Next.js dev server running (or use webServer config below)
 *   - API server running with seeded database
 */
export default defineConfig({
  testDir: './',
  testMatch: '*.spec.ts',
  testIgnore: ['visual-qa/**'],
  timeout: 30_000,
  retries: 1,

  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  reporter: [['list'], ['html', { outputFolder: './e2e-report', open: 'never' }]],
})
