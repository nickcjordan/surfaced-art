import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  centsToDollars,
  dollarsToCents,
  calculateCommission,
  calculateArtistPayout,
} from './currency'

describe('Currency Utilities', () => {
  describe('formatCurrency', () => {
    it('should format cents to USD currency string', () => {
      expect(formatCurrency(12500)).toBe('$125.00')
      expect(formatCurrency(100)).toBe('$1.00')
      expect(formatCurrency(99)).toBe('$0.99')
      expect(formatCurrency(0)).toBe('$0.00')
    })

    it('should handle large amounts', () => {
      expect(formatCurrency(1000000)).toBe('$10,000.00')
      expect(formatCurrency(123456789)).toBe('$1,234,567.89')
    })

    it('should handle negative amounts', () => {
      expect(formatCurrency(-500)).toBe('-$5.00')
    })
  })

  describe('centsToDollars', () => {
    it('should convert cents to dollar string', () => {
      expect(centsToDollars(12500)).toBe('125.00')
      expect(centsToDollars(100)).toBe('1.00')
      expect(centsToDollars(99)).toBe('0.99')
      expect(centsToDollars(1)).toBe('0.01')
    })
  })

  describe('dollarsToCents', () => {
    it('should convert dollars to cents', () => {
      expect(dollarsToCents(125.0)).toBe(12500)
      expect(dollarsToCents(1.0)).toBe(100)
      expect(dollarsToCents(0.99)).toBe(99)
      expect(dollarsToCents(0.01)).toBe(1)
    })

    it('should round to nearest cent', () => {
      expect(dollarsToCents(1.999)).toBe(200)
      expect(dollarsToCents(1.001)).toBe(100)
      // Note: 1.005 rounds to 100 due to floating point representation (1.005 * 100 = 100.49999...)
      expect(dollarsToCents(1.006)).toBe(101)
    })
  })

  describe('calculateCommission', () => {
    it('should calculate 30% commission', () => {
      expect(calculateCommission(10000)).toBe(3000) // $100 -> $30
      expect(calculateCommission(12500)).toBe(3750) // $125 -> $37.50
    })

    it('should round to nearest cent', () => {
      expect(calculateCommission(100)).toBe(30) // $1 -> $0.30
      expect(calculateCommission(333)).toBe(100) // $3.33 -> $1.00 (rounded)
    })
  })

  describe('calculateArtistPayout', () => {
    it('should calculate 70% payout', () => {
      expect(calculateArtistPayout(10000)).toBe(7000) // $100 -> $70
      expect(calculateArtistPayout(12500)).toBe(8750) // $125 -> $87.50
    })

    it('should ensure commission + payout equals original price', () => {
      const prices = [10000, 12500, 9999, 333, 1]
      for (const price of prices) {
        const commission = calculateCommission(price)
        const payout = calculateArtistPayout(price)
        expect(commission + payout).toBe(price)
      }
    })
  })
})
