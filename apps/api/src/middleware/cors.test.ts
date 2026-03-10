import { describe, it, expect, vi } from 'vitest'

vi.mock('@surfaced-art/utils', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@surfaced-art/db', () => ({
  prisma: {
    $queryRawUnsafe: vi.fn().mockResolvedValue([{ now: new Date() }]),
    artistProfile: { findUnique: vi.fn(), findFirst: vi.fn().mockResolvedValue({ id: 'test-id' }) },
    listing: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0), findUnique: vi.fn() },
  },
  CategoryType: {
    ceramics: 'ceramics',
    drawing_painting: 'drawing_painting',
    printmaking_photography: 'printmaking_photography',
    mixed_media_3d: 'mixed_media_3d',
  },
}))

vi.stubEnv('FRONTEND_URL', 'https://surfacedart.com')
vi.stubEnv('ADDITIONAL_CORS_ORIGINS', 'https://surfaced.art,https://www.surfaced.art,https://dev.surfaced.art')

const { app } = await import('../index')

describe('CORS configuration', () => {
  it('should allow requests from the configured FRONTEND_URL', async () => {
    const res = await app.request('/health', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://surfacedart.com',
        'Access-Control-Request-Method': 'GET',
      },
    })
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://surfacedart.com')
  })

  it('should allow requests from the www variant of FRONTEND_URL', async () => {
    const res = await app.request('/health', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://www.surfacedart.com',
        'Access-Control-Request-Method': 'GET',
      },
    })
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://www.surfacedart.com')
  })

  it('should allow requests from localhost:3000', async () => {
    const res = await app.request('/health', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
      },
    })
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000')
  })

  it('should allow requests from Vercel preview deploys', async () => {
    const res = await app.request('/health', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://surfaced-art-abc123.vercel.app',
        'Access-Control-Request-Method': 'GET',
      },
    })
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://surfaced-art-abc123.vercel.app')
  })

  it('should allow requests from ADDITIONAL_CORS_ORIGINS', async () => {
    const res = await app.request('/health', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://surfaced.art',
        'Access-Control-Request-Method': 'GET',
      },
    })
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://surfaced.art')
  })

  it('should allow requests from all additional origins', async () => {
    for (const origin of ['https://www.surfaced.art', 'https://dev.surfaced.art']) {
      const res = await app.request('/health', {
        method: 'OPTIONS',
        headers: {
          Origin: origin,
          'Access-Control-Request-Method': 'GET',
        },
      })
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe(origin)
    }
  })

  it('should reject requests from unauthorized origins', async () => {
    const res = await app.request('/health', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://evil.com',
        'Access-Control-Request-Method': 'GET',
      },
    })
    // When origin is rejected, Hono does not set Access-Control-Allow-Origin
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull()
  })

  it('should include credentials support', async () => {
    const res = await app.request('/health', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://surfacedart.com',
        'Access-Control-Request-Method': 'GET',
      },
    })
    expect(res.headers.get('Access-Control-Allow-Credentials')).toBe('true')
  })
})

describe('CORS: missing FRONTEND_URL', () => {
  it('should throw if FRONTEND_URL is not set', async () => {
    vi.resetModules()
    vi.stubEnv('FRONTEND_URL', '')
    await expect(import('../index')).rejects.toThrow('FRONTEND_URL is required')
    vi.unstubAllEnvs()
    vi.stubEnv('FRONTEND_URL', 'https://surfacedart.com')
  })
})
