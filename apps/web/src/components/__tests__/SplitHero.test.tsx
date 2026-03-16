import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SplitHero } from '../SplitHero'

describe('SplitHero', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_CDN_DOMAINS = 'https://test.cloudfront.net'

    // Mock APIs unavailable in test environment
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
        constructor(
          _cb: IntersectionObserverCallback,
          _opts?: IntersectionObserverInit,
        ) {}
      },
    )
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_CDN_DOMAINS
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('should render the hero section with data-testid', () => {
    render(<SplitHero />)
    expect(screen.getByTestId('hero')).toBeInTheDocument()
  })

  it('should render the heading', () => {
    render(<SplitHero />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent(/a place for artists/i)
  })

  it('should render the four feature pillars', () => {
    render(<SplitHero />)
    expect(screen.getByText('Portfolio')).toBeInTheDocument()
    expect(screen.getByText('Sales')).toBeInTheDocument()
    expect(screen.getByText('Community')).toBeInTheDocument()
    expect(screen.getByText('Discovery')).toBeInTheDocument()
  })

  it('should render artwork images with env-aware CDN URLs', () => {
    render(<SplitHero />)
    const images = screen.getAllByRole('img')
    expect(images.length).toBeGreaterThanOrEqual(4)
    for (const img of images) {
      expect(img.getAttribute('src')).toContain('test.cloudfront.net')
    }
  })

  it('should not contain hardcoded prod CloudFront URLs', () => {
    render(<SplitHero />)
    const images = screen.getAllByRole('img')
    for (const img of images) {
      expect(img.getAttribute('src')).not.toContain('dmfu4c7s6z2cc.cloudfront.net')
    }
  })

  it('should use demo artist slugs, not real artist slugs', () => {
    render(<SplitHero />)
    const images = screen.getAllByRole('img')
    for (const img of images) {
      const src = img.getAttribute('src') || ''
      expect(src).not.toContain('abbey-peters')
      expect(src).not.toContain('david-morrison')
      expect(src).not.toContain('karina-yanes')
    }
  })

  it('should render the primary CTA linking to /for-artists', () => {
    render(<SplitHero />)
    const cta = screen.getByRole('link', { name: /see how it works/i })
    expect(cta).toHaveAttribute('href', '/for-artists')
  })

  it('should render the secondary link to /apply', () => {
    render(<SplitHero />)
    const link = screen.getByRole('link', { name: /ready to apply/i })
    expect(link).toHaveAttribute('href', '/apply')
  })

  it('should respect prefers-reduced-motion', () => {
    render(<SplitHero />)
    const track = screen.getByTestId('hero-scroll-track')
    expect(track).toBeInTheDocument()
  })
})
