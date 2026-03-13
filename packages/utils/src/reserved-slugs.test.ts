import { describe, it, expect } from 'vitest'
import { isReservedSlug, RESERVED_SLUGS } from './reserved-slugs'

describe('Reserved Slug Validation', () => {
  describe('RESERVED_SLUGS', () => {
    it('should be a non-empty set of strings', () => {
      expect(RESERVED_SLUGS.size).toBeGreaterThan(100)
      for (const slug of RESERVED_SLUGS) {
        expect(typeof slug).toBe('string')
        expect(slug).toBe(slug.toLowerCase())
      }
    })

    it('should contain all current routes', () => {
      const currentRoutes = [
        'about', 'admin', 'api', 'apply', 'artist', 'artists',
        'category', 'dashboard', 'for-artists', 'forgot-password',
        'listing', 'privacy', 'reset-password', 'search',
        'sign-in', 'sign-up', 'studio', 'terms', 'verify-email',
      ]
      for (const route of currentRoutes) {
        expect(RESERVED_SLUGS.has(route)).toBe(true)
      }
    })

    it('should contain planned routes', () => {
      const plannedRoutes = [
        'account', 'blog', 'cart', 'checkout', 'commissions',
        'contact', 'content-guidelines', 'dmca', 'faq', 'for-buyers',
        'help', 'orders', 'refund-policy', 'shipping-policy',
      ]
      for (const route of plannedRoutes) {
        expect(RESERVED_SLUGS.has(route)).toBe(true)
      }
    })

    it('should contain brand terms', () => {
      const brandTerms = ['surfaced', 'surfaced-art', 'surfacedart', 'sa']
      for (const term of brandTerms) {
        expect(RESERVED_SLUGS.has(term)).toBe(true)
      }
    })

    it('should contain technical slugs', () => {
      const technicalSlugs = [
        '_next', 'sitemap.xml', 'robots.txt', 'favicon.ico',
      ]
      for (const slug of technicalSlugs) {
        expect(RESERVED_SLUGS.has(slug)).toBe(true)
      }
    })
  })

  describe('isReservedSlug', () => {
    it('should return true for reserved slugs', () => {
      expect(isReservedSlug('admin')).toBe(true)
      expect(isReservedSlug('about')).toBe(true)
      expect(isReservedSlug('dashboard')).toBe(true)
      expect(isReservedSlug('cart')).toBe(true)
    })

    it('should be case-insensitive', () => {
      expect(isReservedSlug('Admin')).toBe(true)
      expect(isReservedSlug('ABOUT')).toBe(true)
      expect(isReservedSlug('Dashboard')).toBe(true)
    })

    it('should return false for non-reserved slugs', () => {
      expect(isReservedSlug('jane-smith')).toBe(false)
      expect(isReservedSlug('elena-cordova')).toBe(false)
      expect(isReservedSlug('abstract-painter-42')).toBe(false)
    })

    it('should use exact match — not prefix match', () => {
      // "admin" is reserved but "admin-tools" is not
      expect(isReservedSlug('admin')).toBe(true)
      expect(isReservedSlug('admin-tools')).toBe(false)

      // "art" is reserved but "art-smith" is not
      expect(isReservedSlug('art')).toBe(true)
      expect(isReservedSlug('art-smith')).toBe(false)

      // "blog" is reserved but "blog-posts" is not
      expect(isReservedSlug('blog')).toBe(true)
      expect(isReservedSlug('blog-posts')).toBe(false)
    })

    it('should reject profane slugs', () => {
      expect(isReservedSlug('shit')).toBe(true)
      expect(isReservedSlug('fuck')).toBe(true)
      expect(isReservedSlug('ass')).toBe(true)
    })

    it('should return false for empty string', () => {
      expect(isReservedSlug('')).toBe(false)
    })
  })
})
