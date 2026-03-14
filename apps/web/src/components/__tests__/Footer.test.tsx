import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Footer } from '../Footer'
import { CATEGORIES } from '@/lib/categories'

describe('Footer', () => {
  it('should render the footer as a contentinfo landmark', () => {
    render(<Footer />)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('should render the platform statement', () => {
    render(<Footer />)
    expect(
      screen.getByText(/a curated digital gallery for real makers/i)
    ).toBeInTheDocument()
  })

  it('should render the Surfaced Art brand wordmark', () => {
    render(<Footer />)
    const wordmarks = screen.getAllByRole('img', { name: /surfaced art/i })
    expect(wordmarks.length).toBeGreaterThanOrEqual(1)
  })

  it('should render all 9 category links', () => {
    render(<Footer />)
    for (const category of CATEGORIES) {
      const links = screen.getAllByRole('link', { name: category.label })
      // At least one link for each category in the footer
      const footerLink = links.find((link) => {
        const footer = link.closest('footer')
        return footer !== null
      })
      expect(footerLink).toBeDefined()
      expect(footerLink).toHaveAttribute('href', category.href)
    }
  })

  it('should render a categories heading', () => {
    render(<Footer />)
    expect(screen.getByText('Categories')).toBeInTheDocument()
  })

  it('should render social media placeholder section', () => {
    render(<Footer />)
    expect(screen.getByText('Follow')).toBeInTheDocument()
  })

  it('should render the For Artists link', () => {
    render(<Footer />)
    const link = screen.getByRole('link', { name: 'For Artists' })
    expect(link).toHaveAttribute('href', '/for-artists')
  })

  it('should render copyright text', () => {
    render(<Footer />)
    expect(
      screen.getByText(/all rights reserved/i)
    ).toBeInTheDocument()
  })
})
