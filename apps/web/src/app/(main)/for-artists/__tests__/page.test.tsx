import { describe, it, expect, vi } from 'vitest'

vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://surfacedart.com')
vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.surfacedart.com')
import { render, screen } from '@testing-library/react'
import ForArtistsPage from '../page'

describe('For Artists Page', () => {
  it('should render the page heading', () => {
    render(<ForArtistsPage />)
    expect(
      screen.getByRole('heading', { level: 1, name: /why surfaced art/i })
    ).toBeInTheDocument()
  })

  it('should render the curated section', () => {
    render(<ForArtistsPage />)
    expect(screen.getByTestId('for-artists-curated')).toBeInTheDocument()
  })

  it('should render the platform section', () => {
    render(<ForArtistsPage />)
    expect(screen.getByTestId('for-artists-platform')).toBeInTheDocument()
  })

  it('should render the commission section', () => {
    render(<ForArtistsPage />)
    expect(screen.getByTestId('for-artists-commission')).toBeInTheDocument()
  })

  it('should render the design section', () => {
    render(<ForArtistsPage />)
    expect(screen.getByTestId('for-artists-design')).toBeInTheDocument()
  })

  it('should render the CTA linking to /apply', () => {
    render(<ForArtistsPage />)
    const cta = screen.getByTestId('for-artists-cta')
    expect(cta).toBeInTheDocument()
    const link = cta.querySelector('a[href="/apply"]')
    expect(link).toBeInTheDocument()
  })

  it('should render breadcrumbs', () => {
    render(<ForArtistsPage />)
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(screen.getByText('For Artists')).toBeInTheDocument()
  })
})
