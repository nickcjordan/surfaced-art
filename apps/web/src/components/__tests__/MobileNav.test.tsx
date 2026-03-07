import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CATEGORIES } from '@/lib/categories'

let mockPathname = '/'

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}))

import { MobileNav } from '../MobileNav'

describe('MobileNav', () => {
  beforeEach(() => {
    mockPathname = '/'
  })

  it('should render a menu button', () => {
    render(<MobileNav />)
    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument()
  })

  it('should render all 4 category links when opened', async () => {
    render(<MobileNav />)
    await userEvent.click(screen.getByRole('button', { name: 'Menu' }))

    for (const category of CATEGORIES) {
      expect(screen.getByRole('link', { name: category.label })).toBeInTheDocument()
    }
  })

  it('should highlight the active category', async () => {
    mockPathname = '/category/drawing_painting'
    render(<MobileNav />)
    await userEvent.click(screen.getByRole('button', { name: 'Menu' }))

    const activeLink = screen.getByRole('link', { name: 'Drawing & Painting' })
    expect(activeLink.className).toContain('text-accent-primary')
    expect(activeLink.className).toContain('font-medium')
  })

  it('should not highlight inactive categories', async () => {
    mockPathname = '/category/drawing_painting'
    render(<MobileNav />)
    await userEvent.click(screen.getByRole('button', { name: 'Menu' }))

    const inactiveLink = screen.getByRole('link', { name: 'Ceramics' })
    expect(inactiveLink.className).not.toContain('text-accent-primary')
    expect(inactiveLink.className).toContain('text-muted-foreground')
  })

  it('should add aria-current="page" to the active link', async () => {
    mockPathname = '/category/ceramics'
    render(<MobileNav />)
    await userEvent.click(screen.getByRole('button', { name: 'Menu' }))

    const activeLink = screen.getByRole('link', { name: 'Ceramics' })
    expect(activeLink).toHaveAttribute('aria-current', 'page')
  })

  it('should not add aria-current to inactive links', async () => {
    mockPathname = '/category/ceramics'
    render(<MobileNav />)
    await userEvent.click(screen.getByRole('button', { name: 'Menu' }))

    const inactiveLink = screen.getByRole('link', { name: 'Drawing & Painting' })
    expect(inactiveLink).not.toHaveAttribute('aria-current')
  })
})
