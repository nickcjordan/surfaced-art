import { describe, it, expect } from 'vitest'
import {
  UserRole,
  ArtistStatus,
  ListingStatus,
  ListingType,
  Category,
  CommissionStatus,
  OrderStatus,
  CvEntryType,
  ProcessMediaType,
} from './index'

describe('Enums', () => {
  describe('UserRole', () => {
    it('should have all expected role values', () => {
      expect(UserRole.BUYER).toBe('buyer')
      expect(UserRole.ARTIST).toBe('artist')
      expect(UserRole.ADMIN).toBe('admin')
      expect(UserRole.CURATOR).toBe('curator')
      expect(UserRole.MODERATOR).toBe('moderator')
    })

    it('should have exactly 5 roles', () => {
      expect(Object.keys(UserRole)).toHaveLength(5)
    })
  })

  describe('ArtistStatus', () => {
    it('should have all expected status values', () => {
      expect(ArtistStatus.PENDING).toBe('pending')
      expect(ArtistStatus.APPROVED).toBe('approved')
      expect(ArtistStatus.SUSPENDED).toBe('suspended')
    })

    it('should have exactly 3 statuses', () => {
      expect(Object.keys(ArtistStatus)).toHaveLength(3)
    })
  })

  describe('ListingStatus', () => {
    it('should have all expected status values', () => {
      expect(ListingStatus.AVAILABLE).toBe('available')
      expect(ListingStatus.RESERVED_SYSTEM).toBe('reserved_system')
      expect(ListingStatus.RESERVED_ARTIST).toBe('reserved_artist')
      expect(ListingStatus.SOLD).toBe('sold')
    })

    it('should have exactly 4 statuses', () => {
      expect(Object.keys(ListingStatus)).toHaveLength(4)
    })
  })

  describe('ListingType', () => {
    it('should have all expected type values', () => {
      expect(ListingType.STANDARD).toBe('standard')
      expect(ListingType.COMMISSION).toBe('commission')
    })

    it('should have exactly 2 types', () => {
      expect(Object.keys(ListingType)).toHaveLength(2)
    })
  })

  describe('Category', () => {
    it('should have all expected category values', () => {
      expect(Category.CERAMICS).toBe('ceramics')
      expect(Category.PAINTING).toBe('painting')
      expect(Category.PRINT).toBe('print')
      expect(Category.JEWELRY).toBe('jewelry')
      expect(Category.ILLUSTRATION).toBe('illustration')
      expect(Category.PHOTOGRAPHY).toBe('photography')
      expect(Category.WOODWORKING).toBe('woodworking')
      expect(Category.FIBERS).toBe('fibers')
      expect(Category.MIXED_MEDIA).toBe('mixed_media')
    })

    it('should have exactly 9 categories', () => {
      expect(Object.keys(Category)).toHaveLength(9)
    })
  })

  describe('CommissionStatus', () => {
    it('should have all expected status values', () => {
      expect(CommissionStatus.PROPOSED).toBe('proposed')
      expect(CommissionStatus.ACCEPTED).toBe('accepted')
      expect(CommissionStatus.IN_PROGRESS).toBe('in_progress')
      expect(CommissionStatus.COMPLETED).toBe('completed')
      expect(CommissionStatus.CANCELLED).toBe('cancelled')
    })

    it('should have exactly 5 statuses', () => {
      expect(Object.keys(CommissionStatus)).toHaveLength(5)
    })
  })

  describe('OrderStatus', () => {
    it('should have all expected status values', () => {
      expect(OrderStatus.PENDING).toBe('pending')
      expect(OrderStatus.PAID).toBe('paid')
      expect(OrderStatus.SHIPPED).toBe('shipped')
      expect(OrderStatus.DELIVERED).toBe('delivered')
      expect(OrderStatus.COMPLETE).toBe('complete')
      expect(OrderStatus.DISPUTED).toBe('disputed')
      expect(OrderStatus.REFUNDED).toBe('refunded')
    })

    it('should have exactly 7 statuses', () => {
      expect(Object.keys(OrderStatus)).toHaveLength(7)
    })
  })

  describe('CvEntryType', () => {
    it('should have all expected type values', () => {
      expect(CvEntryType.EXHIBITION).toBe('exhibition')
      expect(CvEntryType.AWARD).toBe('award')
      expect(CvEntryType.EDUCATION).toBe('education')
      expect(CvEntryType.PRESS).toBe('press')
      expect(CvEntryType.RESIDENCY).toBe('residency')
      expect(CvEntryType.OTHER).toBe('other')
    })

    it('should have exactly 6 types', () => {
      expect(Object.keys(CvEntryType)).toHaveLength(6)
    })
  })

  describe('ProcessMediaType', () => {
    it('should have all expected type values', () => {
      expect(ProcessMediaType.PHOTO).toBe('photo')
      expect(ProcessMediaType.VIDEO).toBe('video')
    })

    it('should have exactly 2 types', () => {
      expect(Object.keys(ProcessMediaType)).toHaveLength(2)
    })
  })
})

describe('Type Exports', () => {
  it('should export all enum values as objects', () => {
    // These should be importable and usable as objects
    expect(typeof UserRole).toBe('object')
    expect(typeof ArtistStatus).toBe('object')
    expect(typeof ListingStatus).toBe('object')
    expect(typeof ListingType).toBe('object')
    expect(typeof Category).toBe('object')
    expect(typeof CommissionStatus).toBe('object')
    expect(typeof OrderStatus).toBe('object')
    expect(typeof CvEntryType).toBe('object')
    expect(typeof ProcessMediaType).toBe('object')
  })
})
