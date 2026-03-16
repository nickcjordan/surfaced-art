import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'

vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://surfaced.art')
vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.surfaced.art')
vi.stubEnv('NEXT_PUBLIC_CDN_DOMAINS', 'https://test.cloudfront.net')

// SplitHero uses browser APIs unavailable in test environment
vi.stubGlobal(
  'matchMedia',
  vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }),
)
vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(1))
vi.stubGlobal('cancelAnimationFrame', vi.fn())
vi.stubGlobal(
  'IntersectionObserver',
  class {
    observe = vi.fn()
    disconnect = vi.fn()
    constructor(_cb: IntersectionObserverCallback, _opts?: IntersectionObserverInit) {}
  },
)

import { render, screen } from '@testing-library/react'

vi.mock('@/lib/api', () => ({
  getCategories: vi.fn().mockResolvedValue([]),
  getListings: vi.fn().mockResolvedValue({ data: [], meta: { page: 1, limit: 6, total: 0, totalPages: 0 } }),
  getFeaturedArtists: vi.fn().mockResolvedValue([]),
}))

import Home from './page'

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('should render the hero heading', async () => {
    const Component = await Home()
    render(Component)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('A Place for Artists')
  })

  it('should render the hero CTA links', async () => {
    const Component = await Home()
    render(Component)
    expect(screen.getByRole('link', { name: /see how it works/i })).toHaveAttribute('href', '/for-artists')
    expect(screen.getByRole('link', { name: /ready to apply/i })).toHaveAttribute('href', '/apply')
  })

  it('should render the waitlist section', async () => {
    const Component = await Home()
    render(Component)
    expect(screen.getByText('Be the first to know')).toBeInTheDocument()
  })

  it('should render the category grid section', async () => {
    const Component = await Home()
    render(Component)
    expect(screen.getByText('Browse by Category')).toBeInTheDocument()
  })

  it('should link Browse all to /search, not a hardcoded category', async () => {
    const { getListings } = await import('@/lib/api')
    vi.mocked(getListings).mockResolvedValueOnce({
      data: [{ id: '1', title: 'Test', medium: 'Oil', category: 'ceramics', price: 1000, status: 'available', primaryImage: { url: '/img.jpg', width: 400, height: 300 }, artist: { displayName: 'Test Artist' } }] as never,
      meta: { page: 1, limit: 6, total: 1, totalPages: 1 },
    })
    const Component = await Home()
    render(Component)
    const browseLink = screen.getByRole('link', { name: /browse all/i })
    expect(browseLink).toHaveAttribute('href', '/search')
  })
})
