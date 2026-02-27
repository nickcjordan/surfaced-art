import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Header } from '../Header'
import { CATEGORIES } from '@/lib/categories'

// Mock auth so Header can render without AuthProvider
vi.mock('@/lib/auth', () => ({
  useAuth: () => ({ user: null, loading: false, signOut: vi.fn() }),
}))

describe('Header', () => {
  it('should render the Surfaced Art brand name', () => {
    render(<Header />)
    expect(screen.getByText('Surfaced Art')).toBeInTheDocument()
  })

  it('should have a link to the home page from the brand name', () => {
    render(<Header />)
    const homeLink = screen.getByRole('link', { name: /surfaced art/i })
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('should render the header as a banner landmark', () => {
    render(<Header />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('should render category navigation', () => {
    render(<Header />)
    const nav = screen.getByRole('navigation', {
      name: 'Category navigation',
    })
    expect(nav).toBeInTheDocument()
  })

  it('should render all 9 category links in the navigation', () => {
    render(<Header />)
    for (const category of CATEGORIES) {
      const links = screen.getAllByRole('link', { name: category.label })
      // At least one link for this category exists (desktop nav has it)
      expect(links.length).toBeGreaterThanOrEqual(1)
      const hasCorrectHref = links.some(
        (link) => link.getAttribute('href') === category.href
      )
      expect(hasCorrectHref).toBe(true)
    }
  })

  it('should render a mobile menu button for small screens', () => {
    render(<Header />)
    const menuButton = screen.getByRole('button', { name: 'Menu' })
    expect(menuButton).toBeInTheDocument()
  })
})
