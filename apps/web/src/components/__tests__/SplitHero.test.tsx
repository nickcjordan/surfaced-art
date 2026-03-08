import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SplitHero } from '../SplitHero'

describe('SplitHero', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN = 'test.cloudfront.net'
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN
    vi.restoreAllMocks()
  })

  it('should render the hero section with data-testid', () => {
    render(<SplitHero />)
    expect(screen.getByTestId('hero')).toBeInTheDocument()
  })

  it('should render the heading', () => {
    render(<SplitHero />)
    expect(
      screen.getByRole('heading', { level: 1, name: /a curated gallery/i })
    ).toBeInTheDocument()
  })

  it('should render an artwork image with env-aware CDN URL', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    render(<SplitHero />)
    const images = screen.getAllByRole('img')
    expect(images.length).toBeGreaterThanOrEqual(1)
    expect(images[0]).toHaveAttribute(
      'src',
      expect.stringContaining('test.cloudfront.net')
    )
  })

  it('should not contain hardcoded prod CloudFront URLs', () => {
    render(<SplitHero />)
    const images = screen.getAllByRole('img')
    for (const img of images) {
      expect(img.getAttribute('src')).not.toContain('dmfu4c7s6z2cc.cloudfront.net')
    }
  })

  it('should use demo artist slugs, not real artist slugs', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    render(<SplitHero />)
    const img = screen.getAllByRole('img')[0]
    const src = img.getAttribute('src') || ''
    expect(src).not.toContain('abbey-peters')
    expect(src).not.toContain('david-morrison')
    expect(src).not.toContain('karina-yanes')
  })

  it('should render the primary CTA linking to /apply', () => {
    render(<SplitHero />)
    const cta = screen.getByRole('link', { name: /join the gallery/i })
    expect(cta).toHaveAttribute('href', '/apply')
  })

  it('should render the secondary link to /for-artists', () => {
    render(<SplitHero />)
    const link = screen.getByRole('link', { name: /learn more/i })
    expect(link).toHaveAttribute('href', '/for-artists')
  })

  it('should render value proposition text', () => {
    render(<SplitHero />)
    expect(screen.getByText(/every artist is vetted/i)).toBeInTheDocument()
  })
})
