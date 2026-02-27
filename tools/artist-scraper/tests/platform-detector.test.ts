import { describe, it, expect } from 'vitest'
import { detectPlatform } from '../src/detection/platform-detector.js'

describe('detectPlatform', () => {
  describe('Squarespace detection', () => {
    it('detects via X-ServedBy header', () => {
      const result = detectPlatform(
        { 'x-servedby': 'squarespace-nginx' },
        '<html><body>Hello</body></html>',
        'https://abbey-peters.com'
      )
      expect(result.platform).toBe('squarespace')
    })

    it('detects via Server header', () => {
      const result = detectPlatform(
        { server: 'Squarespace' },
        '<html></html>',
        'https://example.com'
      )
      expect(result.platform).toBe('squarespace')
    })

    it('detects via SQUARESPACE_CONTEXT in HTML', () => {
      const html = `<script>Static.SQUARESPACE_CONTEXT = {"websiteId":"abc123"};</script>`
      const result = detectPlatform({}, html, 'https://example.com')
      expect(result.platform).toBe('squarespace')
      expect(result.hints.siteId).toBe('abc123')
    })

    it('detects via squarespace-cdn.com in HTML', () => {
      const html = `<img src="https://images.squarespace-cdn.com/content/v1/abc/image.jpg">`
      const result = detectPlatform({}, html, 'https://example.com')
      expect(result.platform).toBe('squarespace')
    })

    it('detects via HTML comment', () => {
      const html = `<!-- This is Squarespace. --><html></html>`
      const result = detectPlatform({}, html, 'https://example.com')
      expect(result.platform).toBe('squarespace')
    })
  })

  describe('Cargo detection', () => {
    it('detects via .cargo.site domain', () => {
      const result = detectPlatform(
        {},
        '<html></html>',
        'https://makomud.cargo.site'
      )
      expect(result.platform).toBe('cargo')
    })

    it('detects via Cargo Collective in HTML', () => {
      const html = `<meta name="generator" content="Cargo Collective">`
      const result = detectPlatform({}, html, 'https://makomud.com')
      expect(result.platform).toBe('cargo')
    })
  })

  describe('WordPress detection', () => {
    it('detects via X-Powered-By header', () => {
      const result = detectPlatform(
        { 'x-powered-by': 'WordPress/6.0' },
        '<html></html>',
        'https://example.com'
      )
      expect(result.platform).toBe('wordpress')
    })

    it('detects via /wp-content/ in HTML', () => {
      const html = `<link rel="stylesheet" href="/wp-content/themes/mytheme/style.css">`
      const result = detectPlatform({}, html, 'https://example.com')
      expect(result.platform).toBe('wordpress')
    })

    it('detects via generator meta tag', () => {
      const html = `<meta name="generator" content="WordPress 6.4.2">`
      const result = detectPlatform({}, html, 'https://example.com')
      expect(result.platform).toBe('wordpress')
    })
  })

  describe('Shopify detection', () => {
    it('detects via Shopify.theme in HTML', () => {
      const html = `<script>Shopify.theme = {name: "Dawn"};</script>`
      const result = detectPlatform({}, html, 'https://example.com')
      expect(result.platform).toBe('shopify')
    })

    it('detects via cdn.shopify.com', () => {
      const html = `<script src="https://cdn.shopify.com/s/files/1/scripts.js"></script>`
      const result = detectPlatform({}, html, 'https://example.com')
      expect(result.platform).toBe('shopify')
    })
  })

  describe('Generic fallback', () => {
    it('returns generic for unknown platforms', () => {
      const result = detectPlatform(
        {},
        '<html><body>A custom site</body></html>',
        'https://custom-artist-site.com'
      )
      expect(result.platform).toBe('generic')
    })

    it('returns empty hints for generic', () => {
      const result = detectPlatform({}, '<html></html>', 'https://example.com')
      expect(result.hints).toEqual({})
    })
  })

  describe('priority order', () => {
    it('prefers Squarespace over generic when both signals present', () => {
      const html = `<img src="https://images.squarespace-cdn.com/content/image.jpg">`
      const result = detectPlatform({}, html, 'https://custom-domain.com')
      expect(result.platform).toBe('squarespace')
    })
  })
})
