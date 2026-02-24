// This is a SEPARATE Playwright config from the main E2E tests.
// The main E2E tests run against a local dev server with test data.
// These visual QA tests run against a DEPLOYED URL (Vercel preview or production)
// and verify the live site's rendering, SEO, responsiveness, and runtime health.

import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './visual-qa',
  timeout: 30_000,
  retries: 1,

  // Base URL comes from environment — Vercel preview URL or production URL
  use: {
    baseURL: process.env.VISUAL_QA_BASE_URL || 'https://surfaced.art',
    screenshot: 'on',
    trace: 'on-first-retry',
  },

  // Test across three device profiles
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'tablet',
      use: { ...devices['iPad Pro 11'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 14'] },
    },
  ],

  // Screenshot output directory for visual review
  outputDir: './visual-qa/results',

  // Reporter that generates an HTML report for visual review
  reporter: [
    ['html', { outputFolder: './visual-qa/report', open: 'never' }],
    ['list'],
  ],
})
