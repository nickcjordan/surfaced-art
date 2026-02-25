import { describe, it, expect, vi, beforeEach } from 'vitest'
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

  it('should render the hero heading', async () => {
    const Component = await Home()
    render(Component)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('A curated digital gallery')
  })

  it('should render the hero description', async () => {
    const Component = await Home()
    render(Component)
    expect(screen.getByText(/Every artist is vetted/)).toBeInTheDocument()
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
})
