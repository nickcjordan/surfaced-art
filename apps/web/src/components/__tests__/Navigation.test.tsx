import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CATEGORIES } from '@/lib/categories'

let mockPathname = '/'

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}))

import { Navigation } from '../Navigation'

describe('Navigation', () => {
  beforeEach(() => {
    mockPathname = '/'
  })

  it('should render a nav element', () => {
    render(<Navigation />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('should render all 4 category links', () => {
    render(<Navigation />)
    expect(screen.getAllByRole('link')).toHaveLength(4)
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

  it('should render Mixed Media & 3D as the last category', () => {
    render(<Navigation />)
    const links = screen.getAllByRole('link')
    expect(links[links.length - 1]).toHaveTextContent('Mixed Media & 3D')
  })

  it('should highlight the active category when on a category page', () => {
    mockPathname = '/category/drawing_painting'
    render(<Navigation />)

    const activeLink = screen.getByRole('link', { name: 'Drawing & Painting' })
    expect(activeLink.className).toContain('text-foreground')
    expect(activeLink.className).toContain('border-accent-primary')
  })

  it('should not highlight any category when on the home page', () => {
    mockPathname = '/'
    render(<Navigation />)

    const links = screen.getAllByRole('link')
    for (const link of links) {
      expect(link.className).not.toContain('border-accent-primary')
      expect(link.className).toContain('text-muted-foreground')
    }
  })

  it('should add aria-current="page" to the active link', () => {
    mockPathname = '/category/ceramics'
    render(<Navigation />)

    const activeLink = screen.getByRole('link', { name: 'Ceramics' })
    expect(activeLink).toHaveAttribute('aria-current', 'page')
  })

  it('should not add aria-current to inactive links', () => {
    mockPathname = '/category/ceramics'
    render(<Navigation />)

    const inactiveLink = screen.getByRole('link', { name: 'Drawing & Painting' })
    expect(inactiveLink).not.toHaveAttribute('aria-current')
  })
})
