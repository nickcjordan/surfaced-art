import { describe, it, expect, vi } from 'vitest'

vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://surfacedart.com')
vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.surfacedart.com')
import { render, screen } from '@testing-library/react'

import AboutPage, { metadata } from './page'

describe('About Page', () => {
  it('should render the page heading', () => {
    render(<AboutPage />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('About Surfaced Art')
  })

  it('should explain the gallery vs marketplace distinction', () => {
    render(<AboutPage />)
    expect(screen.getByText(/digital gallery/i)).toBeInTheDocument()
  })

  it('should mention the vetting process', () => {
    render(<AboutPage />)
    expect(screen.getByText(/Every artist is vetted/i)).toBeInTheDocument()
  })

  it('should state what the platform is not', () => {
    render(<AboutPage />)
    expect(screen.getByText(/No AI/i)).toBeInTheDocument()
    expect(screen.getByText(/No dropshipping/i)).toBeInTheDocument()
  })

  it('should have correct metadata title', () => {
    expect(metadata.title).toContain('About')
  })

  it('should have correct metadata description', () => {
    expect(metadata.description).toBeDefined()
    expect(typeof metadata.description).toBe('string')
  })

  it('should have data-testid attributes on all major sections', () => {
    render(<AboutPage />)
    expect(screen.getByTestId('about-hero')).toBeInTheDocument()
    expect(screen.getByTestId('about-gallery')).toBeInTheDocument()
    expect(screen.getByTestId('about-artists')).toBeInTheDocument()
    expect(screen.getByTestId('about-buyers')).toBeInTheDocument()
  })
})
