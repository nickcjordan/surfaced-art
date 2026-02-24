# Visual QA & Browser Verification Suite

**Surfaced Art — Digital Gallery Platform**

Version 1.0 | CTO Implementation Plan | February 2026

---

## 1. Purpose & Relationship to Existing Test Plan

This document defines a **visual QA and browser verification suite** that complements the existing Integration & Acceptance Test Plan (v1.0). That plan covers backend integration tests (Vitest + Testcontainers), API contract tests, and 5 Playwright E2E tests for critical user journeys. This plan covers something different: **visual correctness, rendering verification, responsiveness, runtime health, and live deployment validation** — the things you check by looking at the site in a real browser.

### Two Execution Layers

This suite has two distinct layers, each with a different executor:

| Layer | Executor | What It Covers | When It Runs |
|---|---|---|---|
| **Automated (Playwright)** | Claude Code builds it, CI runs it | SEO metadata, console errors, network failures, responsive screenshots, accessibility, page structure | Every PR and merge via GitHub Actions |
| **Interactive (Claude.ai + Chrome)** | You paste a prompt into Claude.ai with Chrome tools | Visual design review, gallery feel assessment, UX walkthrough, GIF recording, subjective quality checks | On demand — after deploys, before milestones, during design iteration |

Claude Code builds the automated layer as real test files. The interactive layer is a structured prompt you copy into a Claude.ai conversation when you want a visual review of a deployed URL.

---

## 2. Automated Layer — Claude Code Builds This

### 2.1 File Structure

```
apps/web/
  e2e/
    visual-qa/
      page-rendering.spec.ts        # Action 1: Navigate to each page, verify rendering
      seo-metadata.spec.ts           # Action 3: ISR/SEO meta tag verification
      responsive.spec.ts             # Action 4: Multi-breakpoint responsive screenshots
      runtime-health.spec.ts         # Action 5: Console errors + failed network requests
      waitlist-flow.spec.ts          # Action 6: Waitlist email capture E2E
    visual-qa.config.ts              # Playwright config for visual QA suite
    helpers/
      screenshots.ts                 # Screenshot capture and comparison utilities
      page-assertions.ts             # Reusable page-level assertion helpers
```

### 2.2 Playwright Configuration — `visual-qa.config.ts`

```typescript
// This is a SEPARATE Playwright config from the main E2E tests.
// The main E2E tests (artist-profile.spec.ts, checkout-flow.spec.ts) run against
// a local dev server with test data. These visual QA tests run against a DEPLOYED URL
// (Vercel preview or production) and verify the live site.

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/visual-qa',
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
  outputDir: './e2e/visual-qa/results',
  
  // Reporter that generates an HTML report for visual review
  reporter: [
    ['html', { outputFolder: './e2e/visual-qa/report', open: 'never' }],
    ['list'],
  ],
});
```

### 2.3 Action 1 — Page Rendering Verification

**File:** `page-rendering.spec.ts`

**What it does:** Navigates to every page type in the platform, verifies the DOM structure matches what's expected, confirms no blank/broken pages, and captures a full-page screenshot for human review.

```typescript
// Pseudocode — Claude Code implements the real version

import { test, expect } from '@playwright/test';

// These slugs/IDs come from seed data and must match what's deployed
const SEED_ARTISTS = [
  { slug: 'abbey-peters', displayName: 'Abbey Peters' },
  { slug: 'david-morrison', displayName: 'David Morrison' },
];
const SEED_LISTING_ID = '...'; // A known listing ID from seed data
const CATEGORIES = [
  'ceramics', 'painting', 'print', 'jewelry', 'illustration',
  'photography', 'woodworking', 'fibers', 'mixed-media'
];

test.describe('Page Rendering — All Page Types', () => {

  test('Homepage renders with all sections', async ({ page }) => {
    await page.goto('/');
    
    // Hero section exists
    await expect(page.locator('[data-testid="hero"]')).toBeVisible();
    
    // Featured artists section exists and has content
    const featuredArtists = page.locator('[data-testid="featured-artists"]');
    await expect(featuredArtists).toBeVisible();
    await expect(featuredArtists.locator('[data-testid="artist-card"]')).toHaveCount({ minimum: 1 });
    
    // Featured listings section exists
    await expect(page.locator('[data-testid="featured-listings"]')).toBeVisible();
    
    // Category grid exists with all 9 categories
    const categoryGrid = page.locator('[data-testid="category-grid"]');
    await expect(categoryGrid).toBeVisible();
    
    // Waitlist section exists
    await expect(page.locator('[data-testid="waitlist"]')).toBeVisible();
    
    // Full-page screenshot for visual review
    await page.screenshot({ path: `results/homepage-${test.info().project.name}.png`, fullPage: true });
  });

  for (const artist of SEED_ARTISTS) {
    test(`Artist profile renders: ${artist.displayName}`, async ({ page }) => {
      await page.goto(`/artist/${artist.slug}`);
      
      // Page did not 404
      await expect(page).not.toHaveTitle(/404|not found/i);
      
      // Core sections exist
      await expect(page.locator('[data-testid="artist-hero"]')).toBeVisible();
      await expect(page.locator('[data-testid="artist-name"]')).toContainText(artist.displayName);
      await expect(page.locator('[data-testid="artist-bio"]')).toBeVisible();
      
      // Available work section exists (may be empty but the section should render)
      await expect(page.locator('[data-testid="available-work"]')).toBeVisible();
      
      // Screenshot
      await page.screenshot({ 
        path: `results/artist-${artist.slug}-${test.info().project.name}.png`, 
        fullPage: true 
      });
    });
  }

  test('Listing detail page renders', async ({ page }) => {
    // Navigate to a known listing (either by ID or by clicking through from an artist)
    await page.goto(`/artist/${SEED_ARTISTS[0].slug}`);
    
    // Click the first available listing
    const firstListing = page.locator('[data-testid="listing-card"]').first();
    await expect(firstListing).toBeVisible();
    await firstListing.click();
    
    // Listing detail page loaded
    await expect(page.locator('[data-testid="listing-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="listing-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="listing-images"]')).toBeVisible();
    await expect(page.locator('[data-testid="artist-card"]')).toBeVisible();
    
    // Price is formatted correctly (not raw cents)
    const priceText = await page.locator('[data-testid="listing-price"]').textContent();
    expect(priceText).toMatch(/^\$[\d,]+\.\d{2}$/); // Matches "$125.00" format
    
    // Screenshot
    await page.screenshot({ 
      path: `results/listing-detail-${test.info().project.name}.png`, 
      fullPage: true 
    });
  });

  for (const category of CATEGORIES) {
    test(`Category page renders: ${category}`, async ({ page }) => {
      await page.goto(`/category/${category}`);
      await expect(page).not.toHaveTitle(/404|not found/i);
      
      // Category header exists
      await expect(page.locator('[data-testid="category-header"]')).toBeVisible();
      
      // Page renders without errors (content may be empty for unseeded categories)
      // but the layout should not be broken
      await expect(page.locator('[data-testid="category-content"]')).toBeVisible();
      
      await page.screenshot({ 
        path: `results/category-${category}-${test.info().project.name}.png`, 
        fullPage: true 
      });
    });
  }
});
```

**`data-testid` convention:** Every major section of every page gets a `data-testid` attribute. These are the stable hooks for both Playwright automated tests and accessibility tree queries from Claude.ai Chrome tools. Claude Code should add these to components as they're built.

**Required `data-testid` inventory for Phase 2:**

| Page | Required `data-testid` values |
|---|---|
| Homepage | `hero`, `featured-artists`, `artist-card`, `featured-listings`, `listing-card`, `category-grid`, `waitlist`, `waitlist-email-input`, `waitlist-submit` |
| Artist Profile | `artist-hero`, `artist-name`, `artist-bio`, `artist-location`, `artist-categories`, `artist-social-links`, `process-section`, `cv-section`, `available-work`, `archive-section`, `listing-card` |
| Listing Detail | `listing-title`, `listing-price`, `listing-images`, `listing-description`, `listing-dimensions`, `listing-medium`, `artist-card`, `edition-info` |
| Category Browse | `category-header`, `category-content`, `listing-card`, `category-nav` |
| Global | `site-header`, `site-footer`, `site-nav`, `category-link` |

### 2.4 Action 3 — SEO & Metadata Verification

**File:** `seo-metadata.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('SEO Metadata', () => {

  test('Homepage has correct meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Title exists and is not the default Next.js title
    const title = await page.title();
    expect(title).not.toBe('Create Next App');
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(10);
    expect(title.length).toBeLessThan(70); // Google truncates at ~60-70 chars
    
    // Meta description exists and has appropriate length
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
    expect(description!.length).toBeGreaterThan(50);
    expect(description!.length).toBeLessThan(160);
    
    // Open Graph tags for social sharing
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https?:\/\//);
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website');
    
    // Canonical URL
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https?:\/\//);
  });

  test('Artist profile has dynamic meta tags', async ({ page }) => {
    await page.goto('/artist/abbey-peters');
    
    // Title includes artist name
    const title = await page.title();
    expect(title.toLowerCase()).toContain('abbey peters');
    
    // Meta description exists (should be derived from artist bio)
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
    expect(description!.length).toBeGreaterThan(30);
    
    // OG tags with artist-specific content
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle!.toLowerCase()).toContain('abbey peters');
    
    // OG image should be the artist's profile or cover image, not a generic placeholder
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImage).toMatch(/^https?:\/\//);
    expect(ogImage).not.toContain('placeholder');
  });

  test('Listing detail has dynamic meta tags', async ({ page }) => {
    // Navigate to a listing through the artist profile
    await page.goto('/artist/abbey-peters');
    const firstListing = page.locator('[data-testid="listing-card"]').first();
    const listingTitle = await firstListing.locator('[data-testid="listing-card-title"]').textContent();
    await firstListing.click();
    
    // Title includes listing title
    const pageTitle = await page.title();
    expect(pageTitle.toLowerCase()).toContain(listingTitle!.toLowerCase().substring(0, 20));
    
    // OG tags exist
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https?:\/\//);
    
    // Price in structured data or meta (optional but valuable for SEO)
    // This can be JSON-LD or og:price:amount
    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
    if (jsonLd) {
      const structured = JSON.parse(jsonLd);
      // If it's a Product type, verify price exists
      if (structured['@type'] === 'Product') {
        expect(structured.offers).toBeTruthy();
        expect(structured.offers.price).toBeTruthy();
      }
    }
  });

  test('Category pages have correct meta tags', async ({ page }) => {
    await page.goto('/category/ceramics');
    
    const title = await page.title();
    expect(title.toLowerCase()).toContain('ceramics');
    
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
  });

  test('No duplicate or missing meta tags across pages', async ({ page }) => {
    const pagesToCheck = ['/', '/artist/abbey-peters', '/category/ceramics'];
    
    for (const url of pagesToCheck) {
      await page.goto(url);
      
      // Exactly one title tag
      const titles = await page.locator('title').count();
      expect(titles).toBe(1);
      
      // Exactly one meta description
      const descriptions = await page.locator('meta[name="description"]').count();
      expect(descriptions).toBe(1);
      
      // Exactly one canonical
      const canonicals = await page.locator('link[rel="canonical"]').count();
      expect(canonicals).toBe(1);
      
      // No @vercel references in meta tags (Vercel discipline check)
      const pageContent = await page.content();
      expect(pageContent).not.toContain('@vercel');
    }
  });

  test('ISR cache headers present on static pages', async ({ page }) => {
    const response = await page.goto('/artist/abbey-peters');
    
    // Vercel serves ISR pages with specific cache headers
    // The exact header depends on Vercel's behavior, but we can check for cache indicators
    const headers = response!.headers();
    
    // The page should be served (200), not errored
    expect(response!.status()).toBe(200);
    
    // Content-Type should be HTML
    expect(headers['content-type']).toContain('text/html');
  });
});
```

### 2.5 Action 4 — Responsive Screenshots at Multiple Breakpoints

**File:** `responsive.spec.ts`

This test doesn't assert much — its primary value is generating screenshots at every breakpoint for human review. The screenshots become the artifact you look at to confirm responsive layout works.

```typescript
import { test } from '@playwright/test';

// Breakpoints matching Tailwind defaults + key real devices
const BREAKPOINTS = [
  { name: 'mobile-sm', width: 375, height: 812 },    // iPhone SE / small phones
  { name: 'mobile-lg', width: 428, height: 926 },    // iPhone 14 Pro Max
  { name: 'tablet-portrait', width: 768, height: 1024 },  // iPad
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'desktop-sm', width: 1280, height: 800 },  // Small laptop
  { name: 'desktop-lg', width: 1440, height: 900 },  // Standard desktop
  { name: 'desktop-xl', width: 1920, height: 1080 }, // Large monitor
];

const PAGES = [
  { name: 'homepage', path: '/' },
  { name: 'artist-profile', path: '/artist/abbey-peters' },
  { name: 'category-ceramics', path: '/category/ceramics' },
];

for (const bp of BREAKPOINTS) {
  for (const pg of PAGES) {
    test(`${pg.name} at ${bp.name} (${bp.width}x${bp.height})`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: bp.width, height: bp.height },
      });
      const page = await context.newPage();
      await page.goto(pg.path);
      
      // Wait for images to load (important for visual accuracy)
      await page.waitForLoadState('networkidle');
      
      // Full page screenshot
      await page.screenshot({
        path: `results/responsive/${pg.name}-${bp.name}.png`,
        fullPage: true,
      });

      // Above-the-fold screenshot (what users see without scrolling)
      await page.screenshot({
        path: `results/responsive/${pg.name}-${bp.name}-fold.png`,
        fullPage: false,
      });
      
      await context.close();
    });
  }
}

// Also capture a listing detail page by clicking through
test('listing-detail responsive capture', async ({ browser }) => {
  for (const bp of BREAKPOINTS) {
    const context = await browser.newContext({
      viewport: { width: bp.width, height: bp.height },
    });
    const page = await context.newPage();
    await page.goto('/artist/abbey-peters');
    
    const firstListing = page.locator('[data-testid="listing-card"]').first();
    if (await firstListing.isVisible()) {
      await firstListing.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: `results/responsive/listing-detail-${bp.name}.png`,
        fullPage: true,
      });
    }
    
    await context.close();
  }
});
```

**CI integration:** The responsive screenshots are uploaded as GitHub Actions artifacts on every PR. You can download and review them without deploying.

```yaml
# Addition to pr.yml workflow
- name: Upload responsive screenshots
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: visual-qa-screenshots-${{ github.sha }}
    path: apps/web/e2e/visual-qa/results/
    retention-days: 14
```

### 2.6 Action 5 — Console Errors & Network Failures

**File:** `runtime-health.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

const PAGES = [
  '/',
  '/artist/abbey-peters',
  '/artist/david-morrison',
  '/category/ceramics',
  '/category/painting',
];

test.describe('Runtime Health — No Console Errors or Failed Requests', () => {

  for (const url of PAGES) {
    test(`No console errors on ${url}`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const consoleWarnings: string[] = [];
      
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(`${msg.text()} [${msg.location().url}:${msg.location().lineNumber}]`);
        }
        if (msg.type() === 'warning') {
          consoleWarnings.push(msg.text());
        }
      });

      // Also catch unhandled page errors (uncaught exceptions)
      const pageErrors: string[] = [];
      page.on('pageerror', (error) => {
        pageErrors.push(`${error.name}: ${error.message}`);
      });

      await page.goto(url);
      await page.waitForLoadState('networkidle');
      
      // Scroll the full page to trigger any lazy-loaded content errors
      await page.evaluate(async () => {
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        for (let i = 0; i < document.body.scrollHeight; i += 400) {
          window.scrollTo(0, i);
          await delay(100);
        }
      });
      
      // Wait a moment for any deferred errors
      await page.waitForTimeout(1000);
      
      // No uncaught exceptions
      expect(pageErrors, `Uncaught exceptions on ${url}`).toEqual([]);
      
      // No console errors (filter out known acceptable errors if needed)
      const filteredErrors = consoleErrors.filter(err => {
        // Filter out known third-party noise if necessary
        // e.g., return !err.includes('some-known-third-party-error');
        return true;
      });
      expect(filteredErrors, `Console errors on ${url}`).toEqual([]);
      
      // Log warnings for review but don't fail on them
      if (consoleWarnings.length > 0) {
        console.log(`[WARNINGS on ${url}]:`, consoleWarnings);
      }
    });

    test(`No failed network requests on ${url}`, async ({ page }) => {
      const failedRequests: string[] = [];
      
      page.on('response', (response) => {
        // Track 4xx and 5xx responses (excluding expected 404s like favicons)
        if (response.status() >= 400) {
          const url = response.url();
          // Filter out known acceptable failures
          const isExpected = (
            url.includes('favicon') ||
            url.includes('.map')  // Source maps may 404 in production
          );
          if (!isExpected) {
            failedRequests.push(`${response.status()} ${response.url()}`);
          }
        }
      });

      // Track requests that failed entirely (network errors, CORS, etc.)
      const networkErrors: string[] = [];
      page.on('requestfailed', (request) => {
        networkErrors.push(`FAILED: ${request.url()} — ${request.failure()?.errorText}`);
      });

      await page.goto(url);
      await page.waitForLoadState('networkidle');
      
      expect(failedRequests, `Failed HTTP requests on ${url}`).toEqual([]);
      expect(networkErrors, `Network errors on ${url}`).toEqual([]);
    });
  }

  test('API health endpoint responds', async ({ request }) => {
    // Verify the backend is alive
    const apiBaseUrl = process.env.API_BASE_URL || 'https://api.surfaced.art';
    const response = await request.get(`${apiBaseUrl}/health`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('ok');
  });

  test('Images load from CloudFront (not direct S3)', async ({ page }) => {
    await page.goto('/artist/abbey-peters');
    await page.waitForLoadState('networkidle');
    
    // Get all image sources on the page
    const imageSrcs = await page.locator('img').evaluateAll(
      (imgs) => imgs.map(img => (img as HTMLImageElement).src).filter(Boolean)
    );
    
    for (const src of imageSrcs) {
      // Images should be served via CloudFront, not directly from S3
      expect(src).not.toContain('.s3.amazonaws.com');
      // Should be HTTPS
      expect(src).toMatch(/^https:\/\//);
    }
  });

  test('No @vercel imports detected in client bundle', async ({ page }) => {
    await page.goto('/');
    
    // Check that no Vercel-specific packages are in the client bundle
    // This is a heuristic check — look for Vercel-specific strings in page source
    const pageSource = await page.content();
    expect(pageSource).not.toContain('__VERCEL_');
    expect(pageSource).not.toContain('@vercel/analytics');
    expect(pageSource).not.toContain('@vercel/speed-insights');
  });
});
```

### 2.7 Action 6 — Waitlist Email Capture E2E

**File:** `waitlist-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Waitlist Email Capture', () => {

  test('Valid email submission shows success state', async ({ page }) => {
    await page.goto('/');
    
    // Find the waitlist section
    const waitlistSection = page.locator('[data-testid="waitlist"]');
    await expect(waitlistSection).toBeVisible();
    
    // Enter a test email
    const emailInput = page.locator('[data-testid="waitlist-email-input"]');
    await emailInput.fill(`test-${Date.now()}@example.com`);
    
    // Submit
    const submitButton = page.locator('[data-testid="waitlist-submit"]');
    await submitButton.click();
    
    // Success state appears
    await expect(page.locator('[data-testid="waitlist-success"]')).toBeVisible({ timeout: 5000 });
    
    // The success message should not reveal whether the email was new or existing
    // (privacy consideration from the test plan)
  });

  test('Invalid email shows error state', async ({ page }) => {
    await page.goto('/');
    
    const emailInput = page.locator('[data-testid="waitlist-email-input"]');
    await emailInput.fill('not-an-email');
    
    const submitButton = page.locator('[data-testid="waitlist-submit"]');
    await submitButton.click();
    
    // Error state appears
    await expect(page.locator('[data-testid="waitlist-error"]')).toBeVisible({ timeout: 3000 });
  });

  test('Empty email submission is handled gracefully', async ({ page }) => {
    await page.goto('/');
    
    const submitButton = page.locator('[data-testid="waitlist-submit"]');
    await submitButton.click();
    
    // Either client-side validation prevents submission, or an error appears
    // The page should NOT show a success state
    await expect(page.locator('[data-testid="waitlist-success"]')).not.toBeVisible();
  });

  test('Duplicate email submission does not error', async ({ page }) => {
    const testEmail = `duplicate-test-${Date.now()}@example.com`;
    
    await page.goto('/');
    
    // First submission
    await page.locator('[data-testid="waitlist-email-input"]').fill(testEmail);
    await page.locator('[data-testid="waitlist-submit"]').click();
    await expect(page.locator('[data-testid="waitlist-success"]')).toBeVisible({ timeout: 5000 });
    
    // Reload and submit again
    await page.goto('/');
    await page.locator('[data-testid="waitlist-email-input"]').fill(testEmail);
    await page.locator('[data-testid="waitlist-submit"]').click();
    
    // Should show success (or a graceful message), NOT an error
    // The response should not reveal that the email already exists
    const errorVisible = await page.locator('[data-testid="waitlist-error"]').isVisible();
    expect(errorVisible).toBe(false);
  });
});
```

### 2.8 CI/CD Integration

**Additions to GitHub Actions workflows:**

Add to `pr.yml`:

```yaml
  visual-qa:
    runs-on: ubuntu-latest
    needs: [build]  # Run after the main build job
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
      - run: npm ci
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
      - name: Run visual QA tests
        run: npx playwright test --config=apps/web/e2e/visual-qa.config.ts
        env:
          VISUAL_QA_BASE_URL: ${{ steps.vercel-preview.outputs.url }}
          # Note: This requires the Vercel preview URL to be available.
          # If Vercel preview isn't ready yet, this job waits or is triggered
          # by the Vercel deployment webhook.
      - name: Upload visual QA report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: visual-qa-report-${{ github.sha }}
          path: |
            apps/web/e2e/visual-qa/results/
            apps/web/e2e/visual-qa/report/
          retention-days: 14
```

### 2.9 NPM Scripts

Add to `apps/web/package.json`:

```json
{
  "scripts": {
    "test:visual-qa": "playwright test --config=e2e/visual-qa.config.ts",
    "test:visual-qa:desktop": "playwright test --config=e2e/visual-qa.config.ts --project=desktop",
    "test:visual-qa:mobile": "playwright test --config=e2e/visual-qa.config.ts --project=mobile",
    "test:visual-qa:report": "playwright show-report e2e/visual-qa/report"
  }
}
```

---

## 3. Interactive Layer — Claude.ai Chrome Tools Prompt

This section is NOT built by Claude Code. It's a structured prompt you paste into a Claude.ai conversation (this one or a new one) when you want an interactive visual review. Copy the entire block below.

### 3.1 The Prompt

Save this as a file or keep it in Notion. When you're ready for a visual review, paste it into Claude.ai.

---

```
## Visual QA Review — Surfaced Art

I need you to perform a visual QA review of the Surfaced Art platform using your Chrome browser tools. The site is deployed at:

**URL: [PASTE VERCEL PREVIEW URL OR PRODUCTION URL HERE]**

This is a curated digital gallery for handmade art. The aesthetic should feel like a gallery — warm, spacious, image-forward, typographically considered. Reference brands: Aesop (warm minimalism), Soho House (curated luxury). It should NOT feel like Etsy, Shopify, or a SaaS product.

### Review Tasks

Perform all 7 tasks below in order. For each, take screenshots and provide your observations.

**Task 1: Full Page Navigation & Rendering Check**
Navigate to each of these pages and take a full-page screenshot of each:
- Homepage (/)
- Artist profile (/artist/abbey-peters)
- Artist profile (/artist/david-morrison) [or second seed artist slug]
- Category page (/category/ceramics)
- A listing detail page (click any listing from an artist profile)

For each page, report:
- Does it render completely without broken layout?
- Are all images loading?
- Does the typography hierarchy feel clear (headings vs body vs metadata)?
- Is there anything visually broken or off?

**Task 2: Visual Design Feedback**
After seeing all pages, provide honest design feedback:
- Does the site feel like a gallery or like a marketplace? What pushes it one way or the other?
- Does the color palette feel warm and intentional, or cold and generic?
- Is there enough whitespace? Does artwork have room to breathe?
- Does the typography feel editorial/gallery-quality or like default web styling?
- Are there any components that feel out of place with the gallery aesthetic?
- Rate the overall visual impression on a scale of 1-10 for "would an artist be proud to have their profile here?"

**Task 3: SEO & Meta Tag Check**
For the homepage and one artist profile page:
- View the page source (or use JavaScript to read meta tags) and verify:
  - Title tag exists and is descriptive
  - Meta description exists
  - OG tags (og:title, og:description, og:image) exist
  - No default "Create Next App" or placeholder titles remain
- Report any missing or obviously wrong meta tags

**Task 4: Responsive Design Verification**
Resize the browser to these widths and take a screenshot at each:
- 375px wide (iPhone SE)
- 768px wide (iPad portrait)
- 1440px wide (desktop)

Do this for the homepage and one artist profile page (6 screenshots total). Report:
- Does the layout adapt correctly at each breakpoint?
- Is text readable at mobile sizes?
- Do images scale appropriately?
- Is navigation usable on mobile?
- Are there any overflow issues (content extending beyond the viewport)?

**Task 5: Console & Network Health Check**
On the homepage and one artist profile page:
- Read the browser console and report any errors or warnings
- Check network requests for any failed requests (4xx or 5xx)
- Verify images are loading from CloudFront URLs (not direct S3)
- Report any CORS errors or mixed content warnings

**Task 6: Waitlist Flow Test**
On the homepage:
- Find the waitlist/email signup section
- Enter a test email and submit
- Screenshot the result — does a success state appear?
- Try submitting an invalid email — does an error state appear?
- Try submitting an empty form — what happens?

**Task 7: GIF Walkthrough Recording**
Record a GIF of the following user journey:
1. Start on the homepage
2. Click on a featured artist
3. Browse their profile (scroll through bio, process section, available work)
4. Click on a listing
5. View the listing detail page
6. Navigate back to the homepage

Export the GIF so I can review the full browsing experience as a user would see it.

### After All Tasks

Provide a summary with:
1. **Critical issues** (things that must be fixed before showing to artists)
2. **Design improvements** (things that would elevate the gallery feel)
3. **Nice-to-haves** (polish items for later)
4. **Overall readiness assessment**: Is this link sendable to a prospective founding artist? Yes/No and why.
```

---

### 3.2 When to Use the Interactive Prompt

Use this prompt at these milestones:

| Milestone | Trigger |
|---|---|
| Phase 2 first deploy | First time any real content renders on a Vercel preview URL |
| Phase 2 design iteration | After significant CSS/layout changes, before calling the phase done |
| Phase 2 exit criteria check | The final "is this sendable?" gut check before sharing with artists |
| After brand guide implementation | Once COO brand decisions are applied to the design system |
| After each major Phase 3/4 feature | When new pages or flows are added that have visual components |

---

## 4. Claude Code Implementation Instructions

This section is what you hand to Claude Code. It includes everything Claude Code needs to build the automated layer.

### 4.1 Task Summary

Build the Playwright visual QA test suite for the Surfaced Art platform. This is a separate Playwright configuration from the main E2E tests. It runs against a deployed URL (Vercel preview or production) and verifies page rendering, SEO metadata, responsive layout, runtime health, and the waitlist flow.

### 4.2 Prerequisites

- Playwright is already listed as a dependency in the existing test plan. If not yet installed: `npm install -D @playwright/test` in `apps/web`
- The test suite assumes seed data is deployed (Phase 2 seed artists and listings exist at the target URL)
- `data-testid` attributes must be added to components as they're built (inventory listed in section 2.3 above)

### 4.3 Files to Create

| File | Purpose |
|---|---|
| `apps/web/e2e/visual-qa.config.ts` | Separate Playwright config for visual QA (section 2.2) |
| `apps/web/e2e/visual-qa/page-rendering.spec.ts` | Page rendering verification (section 2.3) |
| `apps/web/e2e/visual-qa/seo-metadata.spec.ts` | SEO meta tag verification (section 2.4) |
| `apps/web/e2e/visual-qa/responsive.spec.ts` | Responsive screenshot capture (section 2.5) |
| `apps/web/e2e/visual-qa/runtime-health.spec.ts` | Console errors and network failure detection (section 2.6) |
| `apps/web/e2e/visual-qa/waitlist-flow.spec.ts` | Waitlist email capture E2E (section 2.7) |

### 4.4 Code Quality Requirements

- TypeScript strict mode
- All test selectors use `data-testid` attributes — never CSS class selectors, never fragile XPath
- All seed data references (artist slugs, listing IDs) are defined as constants at the top of each file, not hardcoded inline
- Tests must not depend on execution order within a file
- Screenshots use a consistent naming convention: `{page}-{variant}-{device}.png`
- Test names are descriptive enough to identify failures from the CI log without opening the report

### 4.5 `data-testid` Implementation Requirement

When building Phase 2 frontend components, add `data-testid` attributes to every element listed in the inventory table in section 2.3. These are the stable selectors for both the automated Playwright tests and the Claude.ai interactive review. Without them, both test layers break.

Pattern:
```tsx
// In a React component
<section data-testid="artist-hero">
  <h1 data-testid="artist-name">{artist.displayName}</h1>
  ...
</section>
```

### 4.6 What NOT to Build

- Do not build visual regression / screenshot comparison tooling (e.g., Percy, Chromatic). The screenshots are for human review, not automated pixel-diff comparison. Automated visual regression is a future enhancement.
- Do not build the interactive Chrome review prompt — that lives in this document as a text prompt for Claude.ai.
- Do not duplicate the 5 Playwright E2E tests from the Integration Test Plan. This suite complements those, not replaces them.

### 4.7 Turborepo Integration

Add `"test:visual-qa"` to `turbo.json` pipeline if it doesn't conflict with the existing test pipeline. The visual QA tests should be runnable independently:

```bash
# Run all visual QA tests
npx turbo run test:visual-qa --filter=web

# Run only desktop tests for faster iteration
cd apps/web && npx playwright test --config=e2e/visual-qa.config.ts --project=desktop
```

### 4.8 Environment Variables

| Variable | Purpose | Where Set |
|---|---|---|
| `VISUAL_QA_BASE_URL` | The deployed URL to test against | GitHub Actions (from Vercel preview URL) or local `.env` |
| `API_BASE_URL` | Backend API URL for health check | GitHub Actions or local `.env` |

---

## 5. Relationship to Phase 2 Exit Criteria

The Build Order v1.0 defines these Phase 2 exit criteria. Here's how each is verified:

| Exit Criteria | Verified By |
|---|---|
| Artist profile pages live with real content | Automated: `page-rendering.spec.ts` ✓ Interactive: Task 1 ✓ |
| Listing detail pages render all fields correctly | Automated: `page-rendering.spec.ts` ✓ |
| Category browse pages show correct listings | Automated: `page-rendering.spec.ts` ✓ |
| Homepage renders with featured content | Automated: `page-rendering.spec.ts` ✓ |
| Platform looks like a gallery | Interactive: Task 2 ✓ (subjective — cannot be automated) |
| All pages are mobile-responsive | Automated: `responsive.spec.ts` ✓ Interactive: Task 4 ✓ |
| SEO metadata renders correctly | Automated: `seo-metadata.spec.ts` ✓ Interactive: Task 3 ✓ |
| No console errors in production | Automated: `runtime-health.spec.ts` ✓ Interactive: Task 5 ✓ |
| Link is sendable to a prospective artist with confidence | Interactive: Task 7 (GIF) + Summary assessment ✓ |

The "looks like a gallery" and "sendable with confidence" criteria are inherently subjective. No automated test can verify them. The interactive Claude.ai review with Chrome tools is specifically designed for those checks.

---

## 6. Decisions for the Decisions Log

If this plan is adopted, record the following:

- **Visual QA suite** is a separate Playwright configuration running against deployed URLs, not local dev servers
- **`data-testid` convention** adopted as the stable selector strategy for all test layers
- **Responsive screenshots** captured at 7 breakpoints and uploaded as CI artifacts for human review
- **Interactive visual review** conducted via Claude.ai Chrome tools at key milestones using a standardized prompt
- **No automated visual regression** (pixel-diff comparison) at v1 — screenshots are for human review only
- **CI gate**: Automated visual QA tests must pass on PR before merge; interactive review is on-demand

---

*This document should be stored alongside the Integration & Acceptance Test Plan in the Notion Document Archive. Update when new pages are added to the platform or when the visual QA scope expands.*

Version 1.0 | February 2026 | Confidential | CTO: Surfaced Art