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
  searchQuery,
  adminApplicationsQuery,
  adminUsersQuery,
  adminArtistsQuery,
  adminListingsQuery,
  adminRoleGrantBody,
  adminSuspendBody,
  adminArtistUpdateBody,
  adminListingUpdateBody,
  adminListingHideBody,
  adminAuditLogQuery,
  adminWaitlistQuery,
  adminBulkListingStatusBody,
  adminBulkRoleGrantBody,
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

    it('should strip incomplete/split tag injection attempts', () => {
      // "<scr<script>ipt>" → after tag strip → "<script>" → loop strips → ""
      // Final angle bracket strip ensures no residual "<" or ">"
      expect(sanitizeText('<scr<script>ipt>alert(1)</scr<script>ipt>')).not.toContain('<')
      expect(sanitizeText('<scr<script>ipt>alert(1)</scr<script>ipt>')).not.toContain('>')
    })

    it('should strip stray angle brackets', () => {
      // Lone < or > without forming a complete tag are stripped
      expect(sanitizeText('5 > 3')).toBe('5 3')
      expect(sanitizeText('2 < 4')).toBe('2 4')
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

  // ========================================================================
  // Admin management schemas
  // ========================================================================

  describe('adminApplicationsQuery', () => {
    it('should use defaults when no params provided', () => {
      const result = adminApplicationsQuery.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
      }
    })

    it('should accept valid status filter', () => {
      for (const status of ['pending', 'approved', 'rejected', 'withdrawn']) {
        const result = adminApplicationsQuery.safeParse({ status })
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid status', () => {
      expect(adminApplicationsQuery.safeParse({ status: 'invalid' }).success).toBe(false)
    })

    it('should accept search param', () => {
      const result = adminApplicationsQuery.safeParse({ search: 'jane' })
      expect(result.success).toBe(true)
    })

    it('should reject search longer than 200 characters', () => {
      expect(adminApplicationsQuery.safeParse({ search: 'x'.repeat(201) }).success).toBe(false)
    })

    it('should cap limit at 100', () => {
      const result = adminApplicationsQuery.safeParse({ limit: '200' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(100)
      }
    })

    it('should coerce string page and limit', () => {
      const result = adminApplicationsQuery.safeParse({ page: '3', limit: '50' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(3)
        expect(result.data.limit).toBe(50)
      }
    })
  })

  describe('adminUsersQuery', () => {
    it('should use defaults when no params provided', () => {
      const result = adminUsersQuery.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
      }
    })

    it('should accept valid role filter', () => {
      for (const role of ['buyer', 'artist', 'admin', 'curator', 'moderator']) {
        const result = adminUsersQuery.safeParse({ role })
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid role', () => {
      expect(adminUsersQuery.safeParse({ role: 'superadmin' }).success).toBe(false)
    })

    it('should accept search param', () => {
      const result = adminUsersQuery.safeParse({ search: 'john' })
      expect(result.success).toBe(true)
    })

    it('should reject search longer than 200 characters', () => {
      expect(adminUsersQuery.safeParse({ search: 'x'.repeat(201) }).success).toBe(false)
    })

    it('should cap limit at 100', () => {
      const result = adminUsersQuery.safeParse({ limit: '200' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(100)
      }
    })
  })

  describe('adminArtistsQuery', () => {
    it('should use defaults when no params provided', () => {
      const result = adminArtistsQuery.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
      }
    })

    it('should accept valid status filter', () => {
      for (const status of ['pending', 'approved', 'suspended']) {
        const result = adminArtistsQuery.safeParse({ status })
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid status', () => {
      expect(adminArtistsQuery.safeParse({ status: 'active' }).success).toBe(false)
    })

    it('should accept search param', () => {
      const result = adminArtistsQuery.safeParse({ search: 'abbey' })
      expect(result.success).toBe(true)
    })

    it('should cap limit at 100', () => {
      const result = adminArtistsQuery.safeParse({ limit: '200' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(100)
      }
    })
  })

  describe('adminListingsQuery', () => {
    it('should use defaults when no params provided', () => {
      const result = adminListingsQuery.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
      }
    })

    it('should accept standard listing statuses', () => {
      for (const status of ['available', 'reserved_system', 'reserved_artist', 'sold']) {
        const result = adminListingsQuery.safeParse({ status })
        expect(result.success).toBe(true)
      }
    })

    it('should accept hidden status (admin-only)', () => {
      const result = adminListingsQuery.safeParse({ status: 'hidden' })
      expect(result.success).toBe(true)
    })

    it('should reject invalid status', () => {
      expect(adminListingsQuery.safeParse({ status: 'deleted' }).success).toBe(false)
    })

    it('should accept artistId as valid UUID', () => {
      const result = adminListingsQuery.safeParse({ artistId: '550e8400-e29b-41d4-a716-446655440000' })
      expect(result.success).toBe(true)
    })

    it('should reject invalid artistId', () => {
      expect(adminListingsQuery.safeParse({ artistId: 'not-a-uuid' }).success).toBe(false)
    })

    it('should accept category filter', () => {
      const result = adminListingsQuery.safeParse({ category: 'ceramics' })
      expect(result.success).toBe(true)
    })

    it('should reject invalid category', () => {
      expect(adminListingsQuery.safeParse({ category: 'invalid' }).success).toBe(false)
    })

    it('should accept priceMin and priceMax', () => {
      const result = adminListingsQuery.safeParse({ priceMin: '1000', priceMax: '50000' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.priceMin).toBe(1000)
        expect(result.data.priceMax).toBe(50000)
      }
    })

    it('should reject negative priceMin', () => {
      expect(adminListingsQuery.safeParse({ priceMin: '-1' }).success).toBe(false)
    })

    it('should accept search param', () => {
      const result = adminListingsQuery.safeParse({ search: 'landscape' })
      expect(result.success).toBe(true)
    })

    it('should cap limit at 100', () => {
      const result = adminListingsQuery.safeParse({ limit: '200' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(100)
      }
    })
  })

  describe('adminRoleGrantBody', () => {
    it('should accept valid roles', () => {
      for (const role of ['buyer', 'artist', 'admin', 'curator', 'moderator']) {
        const result = adminRoleGrantBody.safeParse({ role })
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid role', () => {
      expect(adminRoleGrantBody.safeParse({ role: 'superadmin' }).success).toBe(false)
    })

    it('should reject missing role', () => {
      expect(adminRoleGrantBody.safeParse({}).success).toBe(false)
    })
  })

  describe('adminSuspendBody', () => {
    it('should accept valid reason', () => {
      const result = adminSuspendBody.safeParse({ reason: 'Violation of terms of service' })
      expect(result.success).toBe(true)
    })

    it('should reject empty reason', () => {
      const result = adminSuspendBody.safeParse({ reason: '' })
      expect(result.success).toBe(false)
    })

    it('should reject missing reason', () => {
      expect(adminSuspendBody.safeParse({}).success).toBe(false)
    })

    it('should reject reason longer than 2000 characters', () => {
      expect(adminSuspendBody.safeParse({ reason: 'x'.repeat(2001) }).success).toBe(false)
    })
  })

  describe('adminArtistUpdateBody', () => {
    it('should accept valid partial update', () => {
      const result = adminArtistUpdateBody.safeParse({
        displayName: 'New Name',
        bio: 'Updated bio',
      })
      expect(result.success).toBe(true)
    })

    it('should accept empty object (no fields to update)', () => {
      const result = adminArtistUpdateBody.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should accept valid slug', () => {
      const result = adminArtistUpdateBody.safeParse({ slug: 'new-slug' })
      expect(result.success).toBe(true)
    })

    it('should reject invalid slug', () => {
      expect(adminArtistUpdateBody.safeParse({ slug: 'INVALID' }).success).toBe(false)
    })

    it('should accept valid status values', () => {
      for (const status of ['pending', 'approved', 'suspended']) {
        const result = adminArtistUpdateBody.safeParse({ status })
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid status', () => {
      expect(adminArtistUpdateBody.safeParse({ status: 'active' }).success).toBe(false)
    })

    it('should accept websiteUrl as valid URL or empty string', () => {
      expect(adminArtistUpdateBody.safeParse({ websiteUrl: 'https://example.com' }).success).toBe(true)
      expect(adminArtistUpdateBody.safeParse({ websiteUrl: '' }).success).toBe(true)
    })

    it('should reject invalid websiteUrl', () => {
      expect(adminArtistUpdateBody.safeParse({ websiteUrl: 'not-a-url' }).success).toBe(false)
    })

    it('should accept nullable profileImageUrl', () => {
      expect(adminArtistUpdateBody.safeParse({ profileImageUrl: null }).success).toBe(true)
      expect(adminArtistUpdateBody.safeParse({ profileImageUrl: 'https://example.com/img.jpg' }).success).toBe(true)
    })

    it('should accept isDemo boolean', () => {
      expect(adminArtistUpdateBody.safeParse({ isDemo: true }).success).toBe(true)
      expect(adminArtistUpdateBody.safeParse({ isDemo: false }).success).toBe(true)
    })
  })

  describe('adminListingUpdateBody', () => {
    it('should accept valid partial update', () => {
      const result = adminListingUpdateBody.safeParse({
        title: 'Updated Title',
        price: 5000,
      })
      expect(result.success).toBe(true)
    })

    it('should accept empty object', () => {
      const result = adminListingUpdateBody.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should accept standard listing statuses plus hidden', () => {
      for (const status of ['available', 'reserved_system', 'reserved_artist', 'sold', 'hidden']) {
        const result = adminListingUpdateBody.safeParse({ status })
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid status', () => {
      expect(adminListingUpdateBody.safeParse({ status: 'deleted' }).success).toBe(false)
    })

    it('should accept valid category', () => {
      const result = adminListingUpdateBody.safeParse({ category: 'ceramics' })
      expect(result.success).toBe(true)
    })

    it('should reject invalid category', () => {
      expect(adminListingUpdateBody.safeParse({ category: 'invalid' }).success).toBe(false)
    })

    it('should accept valid dimensions', () => {
      const result = adminListingUpdateBody.safeParse({
        artworkLength: 12.5,
        artworkWidth: 8,
        packedLength: 15,
        packedWidth: 10,
        packedHeight: 5,
        packedWeight: 3.5,
      })
      expect(result.success).toBe(true)
    })

    it('should reject non-positive dimensions', () => {
      expect(adminListingUpdateBody.safeParse({ packedLength: 0 }).success).toBe(false)
      expect(adminListingUpdateBody.safeParse({ packedLength: -1 }).success).toBe(false)
    })

    it('should accept nullable artwork dimensions', () => {
      const result = adminListingUpdateBody.safeParse({
        artworkLength: null,
        artworkWidth: null,
        artworkHeight: null,
      })
      expect(result.success).toBe(true)
    })

    it('should accept nullable edition fields', () => {
      const result = adminListingUpdateBody.safeParse({
        editionNumber: null,
        editionTotal: null,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('adminListingHideBody', () => {
    it('should accept valid reason', () => {
      const result = adminListingHideBody.safeParse({ reason: 'Inappropriate content' })
      expect(result.success).toBe(true)
    })

    it('should reject empty reason', () => {
      const result = adminListingHideBody.safeParse({ reason: '' })
      expect(result.success).toBe(false)
    })

    it('should reject missing reason', () => {
      expect(adminListingHideBody.safeParse({}).success).toBe(false)
    })

    it('should reject reason longer than 2000 characters', () => {
      expect(adminListingHideBody.safeParse({ reason: 'x'.repeat(2001) }).success).toBe(false)
    })
  })

  describe('adminAuditLogQuery', () => {
    it('should use defaults when no params provided', () => {
      const result = adminAuditLogQuery.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
      }
    })

    it('should accept valid UUID filters', () => {
      const result = adminAuditLogQuery.safeParse({
        adminId: '550e8400-e29b-41d4-a716-446655440000',
        targetId: '550e8400-e29b-41d4-a716-446655440001',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid adminId UUID', () => {
      expect(adminAuditLogQuery.safeParse({ adminId: 'not-a-uuid' }).success).toBe(false)
    })

    it('should accept targetType and action strings', () => {
      const result = adminAuditLogQuery.safeParse({ targetType: 'user', action: 'role_grant' })
      expect(result.success).toBe(true)
    })

    it('should accept valid datetime strings for date range', () => {
      const result = adminAuditLogQuery.safeParse({
        dateFrom: '2025-03-01T00:00:00Z',
        dateTo: '2025-03-31T23:59:59Z',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid datetime format', () => {
      expect(adminAuditLogQuery.safeParse({ dateFrom: 'not-a-date' }).success).toBe(false)
    })

    it('should cap limit at 100', () => {
      const result = adminAuditLogQuery.safeParse({ limit: '200' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(100)
      }
    })
  })

  describe('adminWaitlistQuery', () => {
    it('should use defaults when no params provided', () => {
      const result = adminWaitlistQuery.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
      }
    })

    it('should accept search param', () => {
      const result = adminWaitlistQuery.safeParse({ search: 'test@example.com' })
      expect(result.success).toBe(true)
    })

    it('should reject search longer than 200 characters', () => {
      expect(adminWaitlistQuery.safeParse({ search: 'x'.repeat(201) }).success).toBe(false)
    })

    it('should cap limit at 100', () => {
      const result = adminWaitlistQuery.safeParse({ limit: '200' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(100)
      }
    })
  })

  describe('adminBulkListingStatusBody', () => {
    it('should accept valid body', () => {
      const result = adminBulkListingStatusBody.safeParse({
        listingIds: ['550e8400-e29b-41d4-a716-446655440000'],
        status: 'hidden',
        reason: 'Inappropriate content',
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty listingIds', () => {
      expect(adminBulkListingStatusBody.safeParse({
        listingIds: [],
        status: 'hidden',
        reason: 'test',
      }).success).toBe(false)
    })

    it('should reject more than 100 IDs', () => {
      const ids = Array.from({ length: 101 }, (_, i) =>
        `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}`,
      )
      expect(adminBulkListingStatusBody.safeParse({
        listingIds: ids,
        status: 'hidden',
        reason: 'test',
      }).success).toBe(false)
    })

    it('should reject invalid UUIDs in listingIds', () => {
      expect(adminBulkListingStatusBody.safeParse({
        listingIds: ['not-a-uuid'],
        status: 'hidden',
        reason: 'test',
      }).success).toBe(false)
    })

    it('should accept all listing statuses including hidden', () => {
      for (const status of ['available', 'reserved_system', 'reserved_artist', 'sold', 'hidden']) {
        const result = adminBulkListingStatusBody.safeParse({
          listingIds: ['550e8400-e29b-41d4-a716-446655440000'],
          status,
          reason: 'test',
        })
        expect(result.success).toBe(true)
      }
    })

    it('should reject missing reason', () => {
      expect(adminBulkListingStatusBody.safeParse({
        listingIds: ['550e8400-e29b-41d4-a716-446655440000'],
        status: 'hidden',
      }).success).toBe(false)
    })
  })

  describe('searchQuery', () => {
    it('should accept valid search query', () => {
      const result = searchQuery.safeParse({ q: 'ceramic vase' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.q).toBe('ceramic vase')
      }
    })

    it('should require q parameter', () => {
      const result = searchQuery.safeParse({})
      expect(result.success).toBe(false)
    })

    it('should reject empty q string', () => {
      const result = searchQuery.safeParse({ q: '' })
      expect(result.success).toBe(false)
    })

    it('should reject q longer than 200 characters', () => {
      const result = searchQuery.safeParse({ q: 'x'.repeat(201) })
      expect(result.success).toBe(false)
    })

    it('should strip HTML tags from q via sanitizeText', () => {
      const result = searchQuery.safeParse({ q: '<b>ceramic</b> vase' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.q).toBe('ceramic vase')
      }
    })

    it('should default page to 1', () => {
      const result = searchQuery.safeParse({ q: 'test' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
      }
    })

    it('should default limit to 20', () => {
      const result = searchQuery.safeParse({ q: 'test' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(20)
      }
    })

    it('should cap limit at 100', () => {
      const result = searchQuery.safeParse({ q: 'test', limit: '200' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(100)
      }
    })

    it('should coerce string page and limit', () => {
      const result = searchQuery.safeParse({ q: 'test', page: '3', limit: '50' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(3)
        expect(result.data.limit).toBe(50)
      }
    })

    it('should reject page less than 1', () => {
      expect(searchQuery.safeParse({ q: 'test', page: '0' }).success).toBe(false)
    })

    it('should reject whitespace-only q after sanitization', () => {
      const result = searchQuery.safeParse({ q: '   ' })
      expect(result.success).toBe(false)
    })
  })

  describe('adminBulkRoleGrantBody', () => {
    it('should accept valid body', () => {
      const result = adminBulkRoleGrantBody.safeParse({
        userIds: ['550e8400-e29b-41d4-a716-446655440000'],
        role: 'artist',
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty userIds', () => {
      expect(adminBulkRoleGrantBody.safeParse({
        userIds: [],
        role: 'artist',
      }).success).toBe(false)
    })

    it('should reject more than 100 user IDs', () => {
      const ids = Array.from({ length: 101 }, (_, i) =>
        `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}`,
      )
      expect(adminBulkRoleGrantBody.safeParse({
        userIds: ids,
        role: 'artist',
      }).success).toBe(false)
    })

    it('should accept valid roles', () => {
      for (const role of ['buyer', 'artist', 'admin', 'curator', 'moderator']) {
        const result = adminBulkRoleGrantBody.safeParse({
          userIds: ['550e8400-e29b-41d4-a716-446655440000'],
          role,
        })
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid role', () => {
      expect(adminBulkRoleGrantBody.safeParse({
        userIds: ['550e8400-e29b-41d4-a716-446655440000'],
        role: 'superadmin',
      }).success).toBe(false)
    })
  })
})
