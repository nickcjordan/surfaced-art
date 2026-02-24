import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock the API module before importing the component
vi.mock('@/lib/api', () => ({
  getCategories: vi.fn().mockResolvedValue([]),
  getListings: vi.fn().mockResolvedValue({ data: [], meta: { page: 1, limit: 6, total: 0, totalPages: 0 } }),
  ApiError: class ApiError extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.status = status
      this.name = 'ApiError'
    }
  },
}))

// Must import after mock setup
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
    expect(heading).toHaveTextContent('for real makers')
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
