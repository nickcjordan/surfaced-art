import { describe, it, expect, vi, beforeEach } from 'vitest'
import { revalidatePath } from 'next/cache'
import { POST } from '../route'

function makeRequest(body: unknown, authHeader?: string) {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (authHeader) headers.set('Authorization', authHeader)
  return new Request('http://localhost/api/revalidate', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

describe('POST /api/revalidate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('REVALIDATION_SECRET', 'test-secret')
  })

  describe('authentication', () => {
    it('should return 401 when no authorization header is provided', async () => {
      const response = await POST(makeRequest({ type: 'all' }))
      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.error).toBe('Unauthorized')
    })

    it('should return 401 when the secret is wrong', async () => {
      const response = await POST(makeRequest({ type: 'all' }, 'Bearer wrong-secret'))
      expect(response.status).toBe(401)
    })

    it('should return 401 when REVALIDATION_SECRET is not configured', async () => {
      vi.stubEnv('REVALIDATION_SECRET', '')
      const response = await POST(makeRequest({ type: 'all' }, 'Bearer test-secret'))
      expect(response.status).toBe(401)
    })
  })

  describe('path-based revalidation', () => {
    it('should revalidate specific paths', async () => {
      const paths = ['/artist/abbey-peters', '/listing/abc123']
      const response = await POST(makeRequest({ paths }, 'Bearer test-secret'))
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.revalidated).toEqual(paths)
      expect(revalidatePath).toHaveBeenCalledTimes(2)
      expect(revalidatePath).toHaveBeenCalledWith('/artist/abbey-peters')
      expect(revalidatePath).toHaveBeenCalledWith('/listing/abc123')
    })

    it('should reject non-array paths', async () => {
      const response = await POST(makeRequest({ paths: '/artist/abbey-peters' }, 'Bearer test-secret'))
      expect(response.status).toBe(400)
    })
  })

  describe('artist revalidation', () => {
    it('should revalidate artist page, homepage, and all category pages', async () => {
      const response = await POST(
        makeRequest({ type: 'artist', slug: 'abbey-peters' }, 'Bearer test-secret')
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.revalidated).toContain('/artist/abbey-peters')
      expect(body.revalidated).toContain('/')
      // Should include all 9 category pages
      expect(body.revalidated).toContain('/category/ceramics')
      expect(body.revalidated).toContain('/category/painting')
      expect(body.revalidated).toContain('/category/mixed_media')
    })

    it('should return 400 when slug is missing', async () => {
      const response = await POST(makeRequest({ type: 'artist' }, 'Bearer test-secret'))
      expect(response.status).toBe(400)
    })
  })

  describe('listing revalidation', () => {
    it('should revalidate listing, homepage, and specified category page', async () => {
      const response = await POST(
        makeRequest({ type: 'listing', id: 'abc123', category: 'ceramics' }, 'Bearer test-secret')
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.revalidated).toContain('/listing/abc123')
      expect(body.revalidated).toContain('/')
      expect(body.revalidated).toContain('/category/ceramics')
      // Should NOT include other category pages
      expect(body.revalidated).not.toContain('/category/painting')
    })

    it('should revalidate all category pages when category is not specified', async () => {
      const response = await POST(
        makeRequest({ type: 'listing', id: 'abc123' }, 'Bearer test-secret')
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.revalidated).toContain('/category/ceramics')
      expect(body.revalidated).toContain('/category/painting')
      expect(body.revalidated).toContain('/category/mixed_media')
    })

    it('should return 400 when id is missing', async () => {
      const response = await POST(makeRequest({ type: 'listing' }, 'Bearer test-secret'))
      expect(response.status).toBe(400)
    })
  })

  describe('full revalidation', () => {
    it('should revalidate all pages via layout', async () => {
      const response = await POST(makeRequest({ type: 'all' }, 'Bearer test-secret'))
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
    })
  })

  describe('invalid requests', () => {
    it('should return 400 for unknown type', async () => {
      const response = await POST(makeRequest({ type: 'unknown' }, 'Bearer test-secret'))
      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toBeDefined()
    })

    it('should return 400 for empty body', async () => {
      const response = await POST(makeRequest({}, 'Bearer test-secret'))
      expect(response.status).toBe(400)
    })
  })
})
