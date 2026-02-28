import { describe, it, expect } from 'vitest'
import {
  normalizeUrl,
  extractDomain,
  slugify,
  resolveUrl,
  isSameDomain,
  detectSocialPlatform,
  classifyNavLink,
} from '../src/utils/url.js'

describe('normalizeUrl', () => {
  it('adds https:// to bare domain', () => {
    expect(normalizeUrl('abbey-peters.com')).toBe('https://abbey-peters.com/')
  })

  it('keeps existing https://', () => {
    expect(normalizeUrl('https://abbey-peters.com')).toBe('https://abbey-peters.com/')
  })

  it('keeps existing http://', () => {
    expect(normalizeUrl('http://abbey-peters.com')).toBe('http://abbey-peters.com/')
  })

  it('removes trailing slash from path', () => {
    expect(normalizeUrl('https://abbey-peters.com/about/')).toBe(
      'https://abbey-peters.com/about'
    )
  })

  it('keeps root trailing slash', () => {
    expect(normalizeUrl('https://abbey-peters.com/')).toBe('https://abbey-peters.com/')
  })

  it('handles whitespace', () => {
    expect(normalizeUrl('  https://abbey-peters.com  ')).toBe('https://abbey-peters.com/')
  })

  it('returns empty string for empty input', () => {
    expect(normalizeUrl('')).toBe('')
  })
})

describe('extractDomain', () => {
  it('extracts domain without www', () => {
    expect(extractDomain('https://www.abbey-peters.com/about')).toBe('abbey-peters.com')
  })

  it('extracts domain without www prefix', () => {
    expect(extractDomain('https://morrison-david.com')).toBe('morrison-david.com')
  })

  it('handles Squarespace subdomains', () => {
    expect(extractDomain('https://karinayanesceramics.squarespace.com')).toBe(
      'karinayanesceramics.squarespace.com'
    )
  })

  it('returns null for invalid URL', () => {
    expect(extractDomain('not a url')).toBeNull()
  })
})

describe('slugify', () => {
  it('converts name to slug', () => {
    expect(slugify('Abbey Peters')).toBe('abbey-peters')
  })

  it('handles special characters', () => {
    expect(slugify("David O'Morrison")).toBe('david-omorrison')
  })

  it('collapses multiple spaces', () => {
    expect(slugify('Karina   Yanes')).toBe('karina-yanes')
  })

  it('handles already-slugified text', () => {
    expect(slugify('abbey-peters')).toBe('abbey-peters')
  })

  it('trims whitespace', () => {
    expect(slugify('  Abbey Peters  ')).toBe('abbey-peters')
  })
})

describe('resolveUrl', () => {
  it('resolves relative URL', () => {
    expect(resolveUrl('/about', 'https://abbey-peters.com')).toBe(
      'https://abbey-peters.com/about'
    )
  })

  it('keeps absolute URL', () => {
    expect(resolveUrl('https://other.com/page', 'https://abbey-peters.com')).toBe(
      'https://other.com/page'
    )
  })

  it('returns null for invalid input', () => {
    expect(resolveUrl('', '')).toBeNull()
  })
})

describe('isSameDomain', () => {
  it('returns true for same domain', () => {
    expect(
      isSameDomain('https://abbey-peters.com/shop', 'https://abbey-peters.com/about')
    ).toBe(true)
  })

  it('returns false for different domain', () => {
    expect(
      isSameDomain('https://other.com/page', 'https://abbey-peters.com')
    ).toBe(false)
  })
})

describe('detectSocialPlatform', () => {
  it('detects Instagram', () => {
    expect(detectSocialPlatform('https://instagram.com/abbey_peters')).toBe('instagram')
  })

  it('detects Twitter/X', () => {
    expect(detectSocialPlatform('https://x.com/someartist')).toBe('twitter')
  })

  it('detects Etsy', () => {
    expect(detectSocialPlatform('https://etsy.com/shop/myshop')).toBe('etsy')
  })

  it('detects TikTok', () => {
    expect(detectSocialPlatform('https://tiktok.com/@artist')).toBe('tiktok')
  })

  it('returns null for non-social URL', () => {
    expect(detectSocialPlatform('https://abbey-peters.com')).toBeNull()
  })
})

describe('classifyNavLink', () => {
  it('classifies about page', () => {
    const result = classifyNavLink('About', 'https://example.com/about')
    expect(result?.hint).toBe('about')
  })

  it('classifies shop page', () => {
    const result = classifyNavLink('Shop', 'https://example.com/shop')
    expect(result?.hint).toBe('shop')
  })

  it('classifies CV page', () => {
    const result = classifyNavLink('CV', 'https://example.com/cv')
    expect(result?.hint).toBe('cv')
  })

  it('classifies work/portfolio page', () => {
    const result = classifyNavLink('Portfolio', 'https://example.com/portfolio')
    expect(result?.hint).toBe('work')
  })

  it('classifies process page', () => {
    const result = classifyNavLink('Studio Process', 'https://example.com/process')
    expect(result?.hint).toBe('process')
  })

  it('returns null for unrecognized link', () => {
    expect(classifyNavLink('Home', 'https://example.com/')).toBeNull()
  })
})
