import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { triggerRevalidation } from './revalidation'

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Suppress logger output during tests
vi.mock('@surfaced-art/utils', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('triggerRevalidation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({ ok: true })
    process.env.FRONTEND_URL = 'https://surfaced.art'
    process.env.REVALIDATION_SECRET = 'test-secret'
  })

  afterEach(() => {
    delete process.env.FRONTEND_URL
    delete process.env.REVALIDATION_SECRET
  })

  it('should skip when FRONTEND_URL is not set', () => {
    delete process.env.FRONTEND_URL

    triggerRevalidation({ type: 'listing', id: 'abc' })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should skip when REVALIDATION_SECRET is not set', () => {
    delete process.env.REVALIDATION_SECRET

    triggerRevalidation({ type: 'listing', id: 'abc' })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should POST listing revalidation with correct payload', () => {
    triggerRevalidation({ type: 'listing', id: 'listing-123', category: 'ceramics' })

    expect(mockFetch).toHaveBeenCalledWith(
      'https://surfaced.art/api/revalidate',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-secret',
        },
        body: JSON.stringify({ type: 'listing', id: 'listing-123', category: 'ceramics' }),
      }),
    )
  })

  it('should POST artist revalidation when artistSlug is provided', () => {
    triggerRevalidation({ type: 'listing', id: 'listing-123', artistSlug: 'karina-yanes' })

    // Should fire two requests: listing + artist
    expect(mockFetch).toHaveBeenCalledTimes(2)

    expect(mockFetch).toHaveBeenCalledWith(
      'https://surfaced.art/api/revalidate',
      expect.objectContaining({
        body: JSON.stringify({ type: 'artist', slug: 'karina-yanes' }),
      }),
    )
  })

  it('should not POST artist revalidation when artistSlug is not provided', () => {
    triggerRevalidation({ type: 'listing', id: 'listing-123' })

    // Only listing request
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('should not throw when fetch rejects (fire-and-forget)', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    // Should not throw
    expect(() => {
      triggerRevalidation({ type: 'listing', id: 'listing-123' })
    }).not.toThrow()
  })

  it('should include category in listing payload when provided', () => {
    triggerRevalidation({ type: 'listing', id: 'listing-123', category: 'drawing_painting' })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.category).toBe('drawing_painting')
  })

  it('should omit category from listing payload when not provided', () => {
    triggerRevalidation({ type: 'listing', id: 'listing-123' })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.category).toBeUndefined()
  })
})
