import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Navigation } from '../Navigation'
import { CATEGORIES } from '@/lib/categories'

describe('Navigation', () => {
  it('should render a nav element', () => {
    render(<Navigation />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('should render all 9 category links', () => {
    render(<Navigation />)
    expect(screen.getAllByRole('link')).toHaveLength(9)
  })

  it('should link each category to the correct path', () => {
    render(<Navigation />)
    for (const category of CATEGORIES) {
      const link = screen.getByRole('link', { name: category.label })
      expect(link).toHaveAttribute('href', category.href)
    }
  })

  it('should render Ceramics as the first category', () => {
    render(<Navigation />)
    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveTextContent('Ceramics')
  })

  it('should render Mixed Media as the last category', () => {
    render(<Navigation />)
    const links = screen.getAllByRole('link')
    expect(links[links.length - 1]).toHaveTextContent('Mixed Media')
  })
})
