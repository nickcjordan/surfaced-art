import { describe, it, expect, vi } from 'vitest'

vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://surfacedart.com')
vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.surfacedart.com')
import { render, screen } from '@testing-library/react'
import RootNotFound from '../not-found'

describe('Root Not Found Page', () => {
  it('should render a 404 heading', () => {
    render(<RootNotFound />)
    expect(
      screen.getByRole('heading', { level: 1, name: /page not found/i })
    ).toBeInTheDocument()
  })

  it('should render a link back to the homepage', () => {
    render(<RootNotFound />)
    const link = screen.getByRole('link', { name: /back to gallery/i })
    expect(link).toHaveAttribute('href', '/')
  })

  it('should have noindex metadata', async () => {
    const { metadata } = await import('../not-found')
    expect(metadata).toBeDefined()
    expect(metadata.robots).toEqual({ index: false })
  })
})
