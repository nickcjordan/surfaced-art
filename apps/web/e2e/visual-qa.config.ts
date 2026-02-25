// This is a SEPARATE Playwright config from the main E2E tests.
// The main E2E tests run against a local dev server with test data.
// These visual QA tests run against a DEPLOYED URL (Vercel preview or production)
// and verify the live site's rendering, SEO, responsiveness, and runtime health.

import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './visual-qa',
  timeout: 30_000,
  retries: 1,
  fullyParallel: true,
  workers: process.env.CI ? 4 : 2,

  // Base URL comes from environment — Vercel preview URL or production URL
  use: {
    baseURL: process.env.VISUAL_QA_BASE_URL || 'https://surfaced.art',
    screenshot: 'on',
    trace: 'on-first-retry',
    // When running against a Vercel preview deployment, bypass deployment
    // protection by sending the secret token as a header. The token is set
    // in Vercel project settings (Protection Bypass for Automation) and stored
    // as VERCEL_AUTOMATION_BYPASS_SECRET in GitHub Actions secrets. When
    // targeting production or a local dev server the env var is unset and
    // no extra header is sent.
    extraHTTPHeaders: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      ? { 'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET }
      : {},
  },

  // Test across three device profiles — all use Chromium so only one browser binary
  // is needed in CI (installed with --with-deps chromium).
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'tablet',
      use: { ...devices['Galaxy Tab S4'] }, // 712x1138, Chromium
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] }, // 393x727, Chromium
    },
  ],

  // Screenshot output directory for visual review
  outputDir: './visual-qa/results',

  // In CI: emit a blob report per shard so the merge step can combine them.
  // Locally: HTML + list for interactive review.
  reporter: process.env.CI
    ? [['blob', { outputDir: './visual-qa/blob-report' }], ['list']]
    : [['html', { outputFolder: './visual-qa/report', open: 'never' }], ['list']],
})
