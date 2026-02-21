import { describe, it, expect } from 'vitest'
import { formatDimensions, formatPackedDimensions } from './dimensions'

describe('Dimension Utilities', () => {
  describe('formatDimensions', () => {
    it('should format 3D dimensions', () => {
      expect(formatDimensions(12, 8, 4)).toBe('12 × 8 × 4 in')
      expect(formatDimensions(24, 18, 6)).toBe('24 × 18 × 6 in')
    })

    it('should format 2D dimensions when height is null/undefined/0', () => {
      expect(formatDimensions(12, 8)).toBe('12 × 8 in')
      expect(formatDimensions(12, 8, null)).toBe('12 × 8 in')
      expect(formatDimensions(12, 8, undefined)).toBe('12 × 8 in')
      expect(formatDimensions(12, 8, 0)).toBe('12 × 8 in')
    })

    it('should handle decimal dimensions', () => {
      expect(formatDimensions(12.5, 8.25, 4.75)).toBe('12.5 × 8.25 × 4.75 in')
      expect(formatDimensions(12.0, 8.0, 4.0)).toBe('12 × 8 × 4 in') // Whole numbers
    })

    it('should handle custom units', () => {
      expect(formatDimensions(30, 20, 10, 'cm')).toBe('30 × 20 × 10 cm')
    })

    it('should return empty string for null/undefined dimensions', () => {
      expect(formatDimensions(null, 8, 4)).toBe('')
      expect(formatDimensions(12, null, 4)).toBe('')
      expect(formatDimensions(undefined, undefined)).toBe('')
    })
  })

  describe('formatPackedDimensions', () => {
    it('should format packed dimensions with weight', () => {
      expect(formatPackedDimensions(12, 8, 4, 5)).toBe('12 × 8 × 4 in, 5 lbs')
      expect(formatPackedDimensions(24, 18, 12, 10.5)).toBe('24 × 18 × 12 in, 10.5 lbs')
    })

    it('should handle decimal values', () => {
      expect(formatPackedDimensions(12.5, 8.25, 4.75, 3.5)).toBe('12.5 × 8.25 × 4.75 in, 3.5 lbs')
    })
  })
})
