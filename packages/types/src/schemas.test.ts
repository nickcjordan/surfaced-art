import { describe, it, expect } from 'vitest'
import {
  slugParam,
  uuidParam,
  paginationQuery,
  artistsQuery,
  listingsQuery,
  waitlistBody,
  artistSlugParam,
  listingIdParam,
  sanitizeText,
  artistApplicationBody,
  checkEmailQuery,
} from './schemas'

describe('Shared Validation Schemas', () => {
  describe('slugParam', () => {
    it('should accept valid slugs', () => {
      expect(slugParam.safeParse('abbey-peters').success).toBe(true)
      expect(slugParam.safeParse('david-morrison').success).toBe(true)
      expect(slugParam.safeParse('ab').success).toBe(true)
    })

    it('should reject empty strings', () => {
      expect(slugParam.safeParse('').success).toBe(false)
    })

    it('should reject slugs with uppercase', () => {
      expect(slugParam.safeParse('Abbey-Peters').success).toBe(false)
    })

    it('should reject slugs with special characters', () => {
      expect(slugParam.safeParse('abbey@peters').success).toBe(false)
      expect(slugParam.safeParse('abbey peters').success).toBe(false)
    })

    it('should reject slugs starting or ending with hyphens', () => {
      expect(slugParam.safeParse('-abbey').success).toBe(false)
      expect(slugParam.safeParse('abbey-').success).toBe(false)
    })

    it('should reject slugs with consecutive hyphens', () => {
      expect(slugParam.safeParse('abbey--peters').success).toBe(false)
    })

    it('should reject slugs shorter than 2 characters', () => {
      expect(slugParam.safeParse('a').success).toBe(false)
    })

    it('should reject slugs longer than 50 characters', () => {
      expect(slugParam.safeParse('a'.repeat(51)).success).toBe(false)
    })
  })

  describe('uuidParam', () => {
    it('should accept valid UUIDs', () => {
      expect(uuidParam.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true)
      expect(uuidParam.safeParse('6ba7b810-9dad-11d1-80b4-00c04fd430c8').success).toBe(true)
    })

    it('should reject invalid UUIDs', () => {
      expect(uuidParam.safeParse('not-a-uuid').success).toBe(false)
      expect(uuidParam.safeParse('').success).toBe(false)
      expect(uuidParam.safeParse('550e8400-e29b-41d4-a716').success).toBe(false)
    })
  })

  describe('paginationQuery', () => {
    it('should use defaults when no params provided', () => {
      const result = paginationQuery.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
      }
    })

    it('should accept valid page and limit', () => {
      const result = paginationQuery.safeParse({ page: '3', limit: '50' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(3)
        expect(result.data.limit).toBe(50)
      }
    })

    it('should reject page less than 1', () => {
      expect(paginationQuery.safeParse({ page: '0' }).success).toBe(false)
      expect(paginationQuery.safeParse({ page: '-1' }).success).toBe(false)
    })

    it('should reject limit less than 1', () => {
      expect(paginationQuery.safeParse({ limit: '0' }).success).toBe(false)
    })

    it('should cap limit at 100', () => {
      const result = paginationQuery.safeParse({ limit: '200' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(100)
      }
    })
  })

  describe('artistsQuery', () => {
    it('should accept valid category filter', () => {
      const result = artistsQuery.safeParse({ category: 'ceramics' })
      expect(result.success).toBe(true)
    })

    it('should reject invalid category', () => {
      expect(artistsQuery.safeParse({ category: 'invalid' }).success).toBe(false)
    })

    it('should accept valid limit', () => {
      const result = artistsQuery.safeParse({ limit: '10' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(10)
      }
    })

    it('should cap limit at 50', () => {
      const result = artistsQuery.safeParse({ limit: '100' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(50)
      }
    })

    it('should default limit to 4', () => {
      const result = artistsQuery.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(4)
      }
    })
  })

  describe('listingsQuery', () => {
    it('should accept valid query with all params', () => {
      const result = listingsQuery.safeParse({
        category: 'painting',
        status: 'available',
        page: '2',
        limit: '10',
      })
      expect(result.success).toBe(true)
    })

    it('should default status to available', () => {
      const result = listingsQuery.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('available')
      }
    })

    it('should reject invalid status', () => {
      expect(listingsQuery.safeParse({ status: 'invalid' }).success).toBe(false)
    })

    it('should cap limit at 100', () => {
      const result = listingsQuery.safeParse({ limit: '200' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(100)
      }
    })
  })

  describe('waitlistBody', () => {
    it('should accept valid email', () => {
      expect(waitlistBody.safeParse({ email: 'test@example.com' }).success).toBe(true)
    })

    it('should reject invalid email', () => {
      expect(waitlistBody.safeParse({ email: 'not-an-email' }).success).toBe(false)
    })

    it('should reject empty email', () => {
      expect(waitlistBody.safeParse({ email: '' }).success).toBe(false)
    })

    it('should reject missing email', () => {
      expect(waitlistBody.safeParse({}).success).toBe(false)
    })
  })

  describe('artistSlugParam', () => {
    it('should accept object with valid slug', () => {
      const result = artistSlugParam.safeParse({ slug: 'abbey-peters' })
      expect(result.success).toBe(true)
    })

    it('should reject object with invalid slug', () => {
      expect(artistSlugParam.safeParse({ slug: '' }).success).toBe(false)
      expect(artistSlugParam.safeParse({ slug: 'INVALID' }).success).toBe(false)
    })
  })

  describe('listingIdParam', () => {
    it('should accept object with valid UUID', () => {
      const result = listingIdParam.safeParse({ id: '550e8400-e29b-41d4-a716-446655440000' })
      expect(result.success).toBe(true)
    })

    it('should reject object with invalid UUID', () => {
      expect(listingIdParam.safeParse({ id: 'not-a-uuid' }).success).toBe(false)
    })
  })

  describe('sanitizeText', () => {
    it('should strip HTML tags but preserve text content', () => {
      expect(sanitizeText('<b>bold</b> text')).toBe('bold text')
      expect(sanitizeText('<script>alert("xss")</script>')).toBe('alert("xss")')
      expect(sanitizeText('<a href="http://evil.com">click me</a>')).toBe('click me')
    })

    it('should strip nested HTML', () => {
      expect(sanitizeText('<div><b>bold</b></div>')).toBe('bold')
    })

    it('should preserve normal text', () => {
      expect(sanitizeText('Hello, this is a bio.')).toBe('Hello, this is a bio.')
    })

    it('should trim whitespace', () => {
      expect(sanitizeText('  hello  ')).toBe('hello')
    })

    it('should collapse multiple spaces', () => {
      expect(sanitizeText('hello    world')).toBe('hello world')
    })

    it('should handle empty string', () => {
      expect(sanitizeText('')).toBe('')
    })

    it('should strip HTML entities used for injection', () => {
      expect(sanitizeText('hello&lt;script&gt;')).not.toContain('<script>')
    })
  })

  describe('artistApplicationBody', () => {
    const validData = {
      fullName: 'Jane Artist',
      email: 'jane@example.com',
      statement:
        'I create handmade ceramics that explore the intersection of form and function in everyday life.',
      categories: ['ceramics'] as string[],
    }

    it('should accept valid complete submission', () => {
      const data = {
        ...validData,
        instagramUrl: 'https://instagram.com/janeartist',
        websiteUrl: 'https://janeartist.com',
        exhibitionHistory: 'Solo show at Local Gallery, 2024',
      }
      const result = artistApplicationBody.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept valid minimal submission (required fields only)', () => {
      const result = artistApplicationBody.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept multiple categories', () => {
      const result = artistApplicationBody.safeParse({
        ...validData,
        categories: ['ceramics', 'painting', 'mixed_media'],
      })
      expect(result.success).toBe(true)
    })

    it('should accept empty string for optional URL fields', () => {
      const result = artistApplicationBody.safeParse({
        ...validData,
        instagramUrl: '',
        websiteUrl: '',
        exhibitionHistory: '',
      })
      expect(result.success).toBe(true)
    })

    it('should reject missing fullName', () => {
      const { fullName: _, ...data } = validData
      const result = artistApplicationBody.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject fullName shorter than 2 characters', () => {
      const result = artistApplicationBody.safeParse({
        ...validData,
        fullName: 'J',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2')
      }
    })

    it('should reject missing email', () => {
      const { email: _, ...data } = validData
      const result = artistApplicationBody.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject invalid email format', () => {
      const result = artistApplicationBody.safeParse({
        ...validData,
        email: 'not-an-email',
      })
      expect(result.success).toBe(false)
    })

    it('should reject missing statement', () => {
      const { statement: _, ...data } = validData
      const result = artistApplicationBody.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject statement shorter than 50 characters', () => {
      const result = artistApplicationBody.safeParse({
        ...validData,
        statement: 'Too short.',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 50')
      }
    })

    it('should reject statement longer than 5000 characters', () => {
      const result = artistApplicationBody.safeParse({
        ...validData,
        statement: 'x'.repeat(5001),
      })
      expect(result.success).toBe(false)
    })

    it('should reject missing categories', () => {
      const { categories: _, ...data } = validData
      const result = artistApplicationBody.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject empty categories array', () => {
      const result = artistApplicationBody.safeParse({
        ...validData,
        categories: [],
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least one')
      }
    })

    it('should reject invalid category values', () => {
      const result = artistApplicationBody.safeParse({
        ...validData,
        categories: ['not_a_category'],
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid Instagram URL', () => {
      const result = artistApplicationBody.safeParse({
        ...validData,
        instagramUrl: 'not-a-url',
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid website URL', () => {
      const result = artistApplicationBody.safeParse({
        ...validData,
        websiteUrl: 'not-a-url',
      })
      expect(result.success).toBe(false)
    })

    it('should reject exhibition history longer than 5000 characters', () => {
      const result = artistApplicationBody.safeParse({
        ...validData,
        exhibitionHistory: 'x'.repeat(5001),
      })
      expect(result.success).toBe(false)
    })
  })

  describe('checkEmailQuery', () => {
    it('should accept valid email', () => {
      const result = checkEmailQuery.safeParse({ email: 'test@example.com' })
      expect(result.success).toBe(true)
    })

    it('should reject empty email', () => {
      const result = checkEmailQuery.safeParse({ email: '' })
      expect(result.success).toBe(false)
    })

    it('should reject invalid email format', () => {
      const result = checkEmailQuery.safeParse({ email: 'not-email' })
      expect(result.success).toBe(false)
    })
  })
})
