import { describe, it, expect } from 'vitest'
import { generateSlug, validateSlug } from './slug'

describe('Slug Utilities', () => {
  describe('generateSlug', () => {
    it('should convert to lowercase', () => {
      expect(generateSlug('StudioName')).toBe('studioname')
      expect(generateSlug('UPPERCASE')).toBe('uppercase')
    })

    it('should replace spaces with hyphens', () => {
      expect(generateSlug('studio name')).toBe('studio-name')
      expect(generateSlug('the  art  studio')).toBe('the-art-studio')
    })

    it('should replace underscores with hyphens', () => {
      expect(generateSlug('studio_name')).toBe('studio-name')
    })

    it('should remove special characters', () => {
      expect(generateSlug("John's Art")).toBe('johns-art')
      expect(generateSlug('Art & Design')).toBe('art-design')
      expect(generateSlug('Studio @123')).toBe('studio-123')
    })

    it('should trim whitespace', () => {
      expect(generateSlug('  studio name  ')).toBe('studio-name')
    })

    it('should handle multiple consecutive hyphens', () => {
      expect(generateSlug('art---studio')).toBe('art-studio')
      expect(generateSlug('art - - - studio')).toBe('art-studio')
    })

    it('should remove leading/trailing hyphens', () => {
      expect(generateSlug('-studio-')).toBe('studio')
      expect(generateSlug('---art---')).toBe('art')
    })
  })

  describe('validateSlug', () => {
    it('should accept valid slugs', () => {
      expect(validateSlug('studioname')).toBe(true)
      expect(validateSlug('studio-name')).toBe(true)
      expect(validateSlug('art-studio-123')).toBe(true)
      expect(validateSlug('a1')).toBe(true)
    })

    it('should reject slugs with invalid characters', () => {
      expect(validateSlug('Studio Name')).toBe(false) // Spaces
      expect(validateSlug('studio_name')).toBe(false) // Underscore
      expect(validateSlug('UPPERCASE')).toBe(false) // Uppercase
      expect(validateSlug("john's")).toBe(false) // Apostrophe
    })

    it('should reject slugs with consecutive hyphens', () => {
      expect(validateSlug('art--studio')).toBe(false)
    })

    it('should reject slugs starting or ending with hyphen', () => {
      expect(validateSlug('-studio')).toBe(false)
      expect(validateSlug('studio-')).toBe(false)
    })

    it('should reject slugs that are too short', () => {
      expect(validateSlug('a')).toBe(false) // 1 char
    })

    it('should reject slugs that are too long', () => {
      expect(validateSlug('a'.repeat(51))).toBe(false) // 51 chars
    })

    it('should accept max length slugs', () => {
      expect(validateSlug('a'.repeat(50))).toBe(true) // 50 chars
    })
  })
})
