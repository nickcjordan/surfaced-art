import { describe, it, expect } from 'vitest'
import { parsePrice } from '../src/utils/price-parser.js'

describe('parsePrice', () => {
  describe('valid prices', () => {
    it('parses dollar amount with cents', () => {
      expect(parsePrice('$125.00')).toEqual({ cents: 12500, isSoldOut: false })
    })

    it('parses dollar amount without cents', () => {
      expect(parsePrice('$125')).toEqual({ cents: 12500, isSoldOut: false })
    })

    it('parses plain number', () => {
      expect(parsePrice('125')).toEqual({ cents: 12500, isSoldOut: false })
    })

    it('parses plain number with cents', () => {
      expect(parsePrice('125.50')).toEqual({ cents: 12550, isSoldOut: false })
    })

    it('parses amount with commas', () => {
      expect(parsePrice('$1,250.00')).toEqual({ cents: 125000, isSoldOut: false })
    })

    it('parses small amount', () => {
      expect(parsePrice('$42')).toEqual({ cents: 4200, isSoldOut: false })
    })

    it('parses amount with leading currency code', () => {
      expect(parsePrice('USD 125')).toEqual({ cents: 12500, isSoldOut: false })
    })

    it('parses amount with trailing currency code', () => {
      expect(parsePrice('125 USD')).toEqual({ cents: 12500, isSoldOut: false })
    })

    it('parses euro symbol', () => {
      expect(parsePrice('€55.00')).toEqual({ cents: 5500, isSoldOut: false })
    })

    it('parses pound symbol', () => {
      expect(parsePrice('£42.50')).toEqual({ cents: 4250, isSoldOut: false })
    })

    it('handles whitespace', () => {
      expect(parsePrice('  $115.00  ')).toEqual({ cents: 11500, isSoldOut: false })
    })

    it('handles single cent digit', () => {
      expect(parsePrice('$55.5')).toEqual({ cents: 5550, isSoldOut: false })
    })

    it('parses zero', () => {
      expect(parsePrice('$0')).toEqual({ cents: 0, isSoldOut: false })
    })

    it('parses realistic artist prices from seed data', () => {
      // Abbey Peters prices
      expect(parsePrice('$115.00')).toEqual({ cents: 11500, isSoldOut: false })
      expect(parsePrice('$100.00')).toEqual({ cents: 10000, isSoldOut: false })
      expect(parsePrice('$60.00')).toEqual({ cents: 6000, isSoldOut: false })
      expect(parsePrice('$125.00')).toEqual({ cents: 12500, isSoldOut: false })
      expect(parsePrice('$150.00')).toEqual({ cents: 15000, isSoldOut: false })
      expect(parsePrice('$55.00')).toEqual({ cents: 5500, isSoldOut: false })
      // David Morrison prices
      expect(parsePrice('$550.00')).toEqual({ cents: 55000, isSoldOut: false })
      // Karina Yanes prices
      expect(parsePrice('$42.00')).toEqual({ cents: 4200, isSoldOut: false })
      expect(parsePrice('$65.00')).toEqual({ cents: 6500, isSoldOut: false })
    })
  })

  describe('sold out indicators', () => {
    it('detects "Sold"', () => {
      expect(parsePrice('Sold')).toEqual({ cents: null, isSoldOut: true })
    })

    it('detects "SOLD OUT"', () => {
      expect(parsePrice('SOLD OUT')).toEqual({ cents: null, isSoldOut: true })
    })

    it('detects "sold out" lowercase', () => {
      expect(parsePrice('sold out')).toEqual({ cents: null, isSoldOut: true })
    })

    it('detects "Unavailable"', () => {
      expect(parsePrice('Unavailable')).toEqual({ cents: null, isSoldOut: true })
    })

    it('detects "No longer available"', () => {
      expect(parsePrice('No longer available')).toEqual({ cents: null, isSoldOut: true })
    })

    it('detects "soldout" (no space)', () => {
      expect(parsePrice('soldout')).toEqual({ cents: null, isSoldOut: true })
    })
  })

  describe('unparseable inputs', () => {
    it('returns null for empty string', () => {
      expect(parsePrice('')).toEqual({ cents: null, isSoldOut: false })
    })

    it('returns null for whitespace only', () => {
      expect(parsePrice('   ')).toEqual({ cents: null, isSoldOut: false })
    })

    it('returns null for random text', () => {
      expect(parsePrice('contact for pricing')).toEqual({ cents: null, isSoldOut: false })
    })

    it('returns null for just a currency symbol', () => {
      expect(parsePrice('$')).toEqual({ cents: null, isSoldOut: false })
    })

    it('returns null for price range', () => {
      expect(parsePrice('$50 - $100')).toEqual({ cents: null, isSoldOut: false })
    })
  })
})
