import '@testing-library/jest-dom/vitest'

// Required env vars that site-config.ts and security-headers.ts throw on if absent.
// Tests that specifically test the throw-if-absent behavior must unstub these and
// call vi.resetModules() before re-importing the module.
process.env.NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://surfacedart.com'
process.env.NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.surfacedart.com'
