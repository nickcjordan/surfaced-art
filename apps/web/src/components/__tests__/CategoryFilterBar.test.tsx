import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CategoryFilterBar } from '../CategoryFilterBar'
import { CATEGORIES } from '@/lib/categories'

describe('CategoryFilterBar', () => {
  it('should render all 9 category pills', () => {
    render(<CategoryFilterBar activeCategory="ceramics" />)

    for (const cat of CATEGORIES) {
      expect(screen.getByRole('link', { name: cat.label })).toBeInTheDocument()
    }
  })

  it('should highlight the active category', () => {
    render(<CategoryFilterBar activeCategory="ceramics" />)

    const activeLink = screen.getByRole('link', { name: 'Ceramics' })
    expect(activeLink.className).toContain('bg-accent-primary')

    const inactiveLink = screen.getByRole('link', { name: 'Painting' })
    expect(inactiveLink.className).toContain('border')
    expect(inactiveLink.className).not.toContain('bg-accent-primary')
  })

  it('should generate default hrefs from basePath', () => {
    render(<CategoryFilterBar activeCategory="ceramics" />)

    const link = screen.getByRole('link', { name: 'Painting' })
    expect(link).toHaveAttribute('href', '/category/painting')
  })

  it('should use custom hrefBuilder when provided', () => {
    render(
      <CategoryFilterBar
        activeCategory="ceramics"
        hrefBuilder={(slug) => `/art?category=${slug}`}
      />
    )

    const link = screen.getByRole('link', { name: 'Painting' })
    expect(link).toHaveAttribute('href', '/art?category=painting')
  })

  it('should render "All" pill when showAll is true', () => {
    render(
      <CategoryFilterBar
        activeCategory={null}
        showAll
        allHref="/art"
      />
    )

    const allLink = screen.getByRole('link', { name: 'All' })
    expect(allLink).toBeInTheDocument()
    expect(allLink).toHaveAttribute('href', '/art')
    // All should be active when activeCategory is null
    expect(allLink.className).toContain('bg-accent-primary')
  })

  it('should not render "All" pill by default', () => {
    render(<CategoryFilterBar activeCategory="ceramics" />)

    expect(screen.queryByRole('link', { name: 'All' })).not.toBeInTheDocument()
  })

  it('should apply data-testid', () => {
    render(<CategoryFilterBar activeCategory="ceramics" data-testid="my-nav" />)

    expect(screen.getByTestId('my-nav')).toBeInTheDocument()
  })

  it('should render a nav element with aria-label', () => {
    render(<CategoryFilterBar activeCategory="ceramics" />)

    expect(screen.getByRole('navigation', { name: 'Category navigation' })).toBeInTheDocument()
  })
})
