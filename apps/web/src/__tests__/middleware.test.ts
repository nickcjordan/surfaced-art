import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock NextResponse before importing middleware
const mockRedirect = vi.fn()
const mockNext = vi.fn()

vi.mock('next/server', () => ({
  NextResponse: {
    redirect: (...args: unknown[]) => {
      mockRedirect(...args)
      return { type: 'redirect' }
    },
    next: (...args: unknown[]) => {
      mockNext(...args)
      return { type: 'next' }
    },
  },
}))

import { middleware, config } from '../middleware'
import { AUTH_COOKIE_NAME } from '@/lib/auth/constants'

function createRequest(url: string, cookies: Record<string, string> = {}) {
  const fullUrl = new URL(url, 'https://surfaced.art')
  return {
    nextUrl: fullUrl,
    url: fullUrl.toString(),
    cookies: {
      get: (name: string) => cookies[name] ? { value: cookies[name] } : undefined,
    },
  } as unknown as Parameters<typeof middleware>[0]
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Auth middleware', () => {
  it('should redirect /dashboard to /sign-in when no auth token exists', () => {
    const request = createRequest('/dashboard')
    middleware(request)

    expect(mockRedirect).toHaveBeenCalled()
    const redirectUrl = mockRedirect.mock.calls[0][0] as URL
    expect(redirectUrl.pathname).toBe('/sign-in')
    expect(redirectUrl.searchParams.get('redirect')).toBe('/dashboard')
  })

  it('should redirect /dashboard/profile to /sign-in when no auth token exists', () => {
    const request = createRequest('/dashboard/profile')
    middleware(request)

    expect(mockRedirect).toHaveBeenCalled()
    const redirectUrl = mockRedirect.mock.calls[0][0] as URL
    expect(redirectUrl.pathname).toBe('/sign-in')
    expect(redirectUrl.searchParams.get('redirect')).toBe('/dashboard/profile')
  })

  it('should allow /dashboard access when auth token exists', () => {
    const request = createRequest('/dashboard', {
      [AUTH_COOKIE_NAME]: '1',
    })
    middleware(request)

    expect(mockNext).toHaveBeenCalled()
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('should only match dashboard routes via config.matcher', () => {
    // Next.js uses config.matcher to decide which routes invoke middleware.
    // Public routes never reach the middleware function at all.
    expect(config.matcher).toContain('/dashboard/:path*')
    expect(config.matcher).not.toContain('/')
    expect(config.matcher).not.toContain('/artists/:path*')
  })
})
