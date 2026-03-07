import { describe, it, expect, vi } from 'vitest'

vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://surfacedart.com')
vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.surfacedart.com')
import { render, screen } from '@testing-library/react'

import { Footer } from './Footer'

describe('Footer', () => {
  it('should render a link to the privacy policy page', () => {
    render(<Footer />)
    const link = screen.getByRole('link', { name: /privacy policy/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/privacy')
  })

  it('should render a link to the terms of service page', () => {
    render(<Footer />)
    const link = screen.getByRole('link', { name: /terms of service/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/terms')
  })
})
