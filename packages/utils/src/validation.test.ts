import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validateRating,
  validateUuid,
  validateZipCode,
  validateQuantity,
  validatePrice,
} from './validation'

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.org')).toBe(true)
      expect(validateEmail('user+tag@example.co.uk')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false)
      expect(validateEmail('invalid@')).toBe(false)
      expect(validateEmail('@invalid.com')).toBe(false)
      expect(validateEmail('invalid@domain')).toBe(false)
      expect(validateEmail('')).toBe(false)
      expect(validateEmail('spaces in@email.com')).toBe(false)
    })
  })

  describe('validateRating', () => {
    it('should accept ratings 1-5', () => {
      expect(validateRating(1)).toBe(true)
      expect(validateRating(2)).toBe(true)
      expect(validateRating(3)).toBe(true)
      expect(validateRating(4)).toBe(true)
      expect(validateRating(5)).toBe(true)
    })

    it('should reject ratings outside 1-5', () => {
      expect(validateRating(0)).toBe(false)
      expect(validateRating(6)).toBe(false)
      expect(validateRating(-1)).toBe(false)
    })

    it('should reject non-integer ratings', () => {
      expect(validateRating(3.5)).toBe(false)
      expect(validateRating(4.9)).toBe(false)
    })
  })

  describe('validateUuid', () => {
    it('should accept valid UUIDs', () => {
      expect(validateUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
      expect(validateUuid('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true)
      expect(validateUuid('6BA7B810-9DAD-11D1-80B4-00C04FD430C8')).toBe(true) // Case insensitive
    })

    it('should reject invalid UUIDs', () => {
      expect(validateUuid('invalid')).toBe(false)
      expect(validateUuid('550e8400-e29b-41d4-a716')).toBe(false) // Too short
      expect(validateUuid('550e8400-e29b-41d4-a716-446655440000-extra')).toBe(false) // Too long
      expect(validateUuid('')).toBe(false)
    })
  })

  describe('validateZipCode', () => {
    it('should accept valid US zip codes', () => {
      expect(validateZipCode('12345')).toBe(true)
      expect(validateZipCode('12345-6789')).toBe(true)
    })

    it('should reject invalid zip codes', () => {
      expect(validateZipCode('1234')).toBe(false) // Too short
      expect(validateZipCode('123456')).toBe(false) // Wrong format
      expect(validateZipCode('12345-678')).toBe(false) // Wrong +4 format
      expect(validateZipCode('ABCDE')).toBe(false) // Letters
      expect(validateZipCode('')).toBe(false)
    })
  })

  describe('validateQuantity', () => {
    it('should accept non-negative integers', () => {
      expect(validateQuantity(0)).toBe(true)
      expect(validateQuantity(1)).toBe(true)
      expect(validateQuantity(100)).toBe(true)
    })

    it('should reject negative numbers', () => {
      expect(validateQuantity(-1)).toBe(false)
    })

    it('should reject non-integers', () => {
      expect(validateQuantity(1.5)).toBe(false)
    })
  })

  describe('validatePrice', () => {
    it('should accept positive integers', () => {
      expect(validatePrice(1)).toBe(true)
      expect(validatePrice(100)).toBe(true)
      expect(validatePrice(12500)).toBe(true)
    })

    it('should reject zero', () => {
      expect(validatePrice(0)).toBe(false)
    })

    it('should reject negative numbers', () => {
      expect(validatePrice(-100)).toBe(false)
    })

    it('should reject non-integers', () => {
      expect(validatePrice(99.99)).toBe(false)
    })
  })
})
