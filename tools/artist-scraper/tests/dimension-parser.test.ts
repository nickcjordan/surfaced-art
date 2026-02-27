import { describe, it, expect } from 'vitest'
import { parseDimensions } from '../src/utils/dimension-parser.js'

describe('parseDimensions', () => {
  describe('three dimensions (L x W x H)', () => {
    it('parses "8 x 10 x 2 inches"', () => {
      expect(parseDimensions('8 x 10 x 2 inches')).toEqual({
        length: 8,
        width: 10,
        height: 2,
        unit: 'in',
      })
    })

    it('parses decimal dimensions', () => {
      expect(parseDimensions('4.5 x 5.5 x 4')).toEqual({
        length: 4.5,
        width: 5.5,
        height: 4,
        unit: 'in',
      })
    })

    it('parses with unicode × separator', () => {
      expect(parseDimensions('8 × 10 × 2 in')).toEqual({
        length: 8,
        width: 10,
        height: 2,
        unit: 'in',
      })
    })

    it('parses with inch marks', () => {
      expect(parseDimensions('8" x 10" x 2"')).toEqual({
        length: 8,
        width: 10,
        height: 2,
        unit: 'in',
      })
    })

    it('parses with (L) (W) (H) labels', () => {
      expect(parseDimensions('8 (L) x 10 (W) x 2 (H) in')).toEqual({
        length: 8,
        width: 10,
        height: 2,
        unit: 'in',
      })
    })

    it('parses centimeters', () => {
      expect(parseDimensions('20 x 25 x 10 cm')).toEqual({
        length: 20,
        width: 25,
        height: 10,
        unit: 'cm',
      })
    })

    it('parses millimeters', () => {
      expect(parseDimensions('200 x 250 x 100 mm')).toEqual({
        length: 200,
        width: 250,
        height: 100,
        unit: 'mm',
      })
    })

    it('parses real seed data dimensions (Abbey Peters)', () => {
      // From abbey_peters_seed_data.md listings
      expect(parseDimensions('4.5 x 5.5 x 4')).toEqual({
        length: 4.5, width: 5.5, height: 4, unit: 'in',
      })
      expect(parseDimensions('6 x 5 x 3.5')).toEqual({
        length: 6, width: 5, height: 3.5, unit: 'in',
      })
      expect(parseDimensions('9.5 x 4 x 4')).toEqual({
        length: 9.5, width: 4, height: 4, unit: 'in',
      })
      expect(parseDimensions('5 x 5 x 7')).toEqual({
        length: 5, width: 5, height: 7, unit: 'in',
      })
    })

    it('handles extra whitespace', () => {
      expect(parseDimensions('  8  x  10  x  2  inches  ')).toEqual({
        length: 8,
        width: 10,
        height: 2,
        unit: 'in',
      })
    })
  })

  describe('two dimensions (L x W)', () => {
    it('parses "8 x 8 in"', () => {
      expect(parseDimensions('8 x 8 in')).toEqual({
        length: 8,
        width: 8,
        height: null,
        unit: 'in',
      })
    })

    it('parses tile dimensions', () => {
      // Karina Yanes tile dimensions
      expect(parseDimensions('8 x 8')).toEqual({
        length: 8,
        width: 8,
        height: null,
        unit: 'in',
      })
    })
  })

  describe('single dimension', () => {
    it('parses single number as length', () => {
      expect(parseDimensions('12 in')).toEqual({
        length: 12,
        width: null,
        height: null,
        unit: 'in',
      })
    })
  })

  describe('unit detection', () => {
    it('defaults to inches when no unit specified', () => {
      expect(parseDimensions('8 x 10 x 2')?.unit).toBe('in')
    })

    it('detects "inches"', () => {
      expect(parseDimensions('8 x 10 inches')?.unit).toBe('in')
    })

    it('detects "inch"', () => {
      expect(parseDimensions('8 inch')?.unit).toBe('in')
    })

    it('detects "in"', () => {
      expect(parseDimensions('8 x 10 in')?.unit).toBe('in')
    })

    it('detects "cm"', () => {
      expect(parseDimensions('20 x 25 cm')?.unit).toBe('cm')
    })

    it('detects "centimeters"', () => {
      expect(parseDimensions('20 x 25 centimeters')?.unit).toBe('cm')
    })
  })

  describe('unparseable inputs', () => {
    it('returns null for empty string', () => {
      expect(parseDimensions('')).toBeNull()
    })

    it('returns null for whitespace only', () => {
      expect(parseDimensions('   ')).toBeNull()
    })

    it('returns null for non-numeric text', () => {
      expect(parseDimensions('large')).toBeNull()
    })

    it('returns null for null-like input', () => {
      expect(parseDimensions('' as string)).toBeNull()
    })
  })
})
