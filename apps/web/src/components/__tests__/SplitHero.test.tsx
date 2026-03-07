import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SplitHero } from '../SplitHero'

describe('SplitHero', () => {
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

  it('should render an artwork image', () => {
    render(<SplitHero />)
    const images = screen.getAllByRole('img')
    expect(images.length).toBeGreaterThanOrEqual(1)
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
