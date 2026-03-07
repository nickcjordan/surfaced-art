import { describe, it, expect } from 'vitest'
import { categoryToUrlSlug, urlSlugToCategory } from '../category-slugs'
import { Category } from '@surfaced-art/types'

describe('categoryToUrlSlug', () => {
  it('should convert ceramics (no change needed)', () => {
    expect(categoryToUrlSlug('ceramics')).toBe('ceramics')
  })

  it('should convert drawing_painting to drawing-painting', () => {
    expect(categoryToUrlSlug('drawing_painting')).toBe('drawing-painting')
  })

  it('should convert printmaking_photography to printmaking-photography', () => {
    expect(categoryToUrlSlug('printmaking_photography')).toBe('printmaking-photography')
  })

  it('should convert mixed_media_3d to mixed-media-3d', () => {
    expect(categoryToUrlSlug('mixed_media_3d')).toBe('mixed-media-3d')
  })

  it('should handle all Category enum values', () => {
    for (const cat of Object.values(Category)) {
      const urlSlug = categoryToUrlSlug(cat)
      expect(urlSlug).not.toContain('_')
    }
  })
})

describe('urlSlugToCategory', () => {
  it('should convert ceramics (no change needed)', () => {
    expect(urlSlugToCategory('ceramics')).toBe('ceramics')
  })

  it('should convert drawing-painting to drawing_painting', () => {
    expect(urlSlugToCategory('drawing-painting')).toBe('drawing_painting')
  })

  it('should convert printmaking-photography to printmaking_photography', () => {
    expect(urlSlugToCategory('printmaking-photography')).toBe('printmaking_photography')
  })

  it('should convert mixed-media-3d to mixed_media_3d', () => {
    expect(urlSlugToCategory('mixed-media-3d')).toBe('mixed_media_3d')
  })

  it('should return undefined for invalid slugs', () => {
    expect(urlSlugToCategory('nonexistent')).toBeUndefined()
    expect(urlSlugToCategory('painting')).toBeUndefined()
    expect(urlSlugToCategory('jewelry')).toBeUndefined()
  })

  it('should roundtrip all Category values', () => {
    for (const cat of Object.values(Category)) {
      const urlSlug = categoryToUrlSlug(cat)
      expect(urlSlugToCategory(urlSlug)).toBe(cat)
    }
  })
})
