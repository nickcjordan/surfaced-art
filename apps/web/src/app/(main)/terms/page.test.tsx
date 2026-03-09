import { describe, it, expect, vi } from 'vitest'

vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://surfacedart.com')
vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.surfacedart.com')
import { render, screen } from '@testing-library/react'

import TermsPage, { metadata } from './page'

describe('Terms of Service Page', () => {
  it('should render the page heading', () => {
    render(<TermsPage />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent(/terms of service/i)
  })

  it('should cover eligibility', () => {
    render(<TermsPage />)
    expect(screen.getByTestId('terms-eligibility')).toBeInTheDocument()
  })

  it('should cover account responsibilities', () => {
    render(<TermsPage />)
    expect(screen.getByTestId('terms-account')).toBeInTheDocument()
  })

  it('should cover commission structure', () => {
    render(<TermsPage />)
    const commissionSection = screen.getByTestId('terms-commission')
    expect(commissionSection).toBeInTheDocument()
    expect(commissionSection.textContent).toMatch(/30%/)
  })

  it('should cover prohibited conduct', () => {
    render(<TermsPage />)
    expect(screen.getByTestId('terms-prohibited')).toBeInTheDocument()
  })

  it('should cover IP ownership', () => {
    render(<TermsPage />)
    expect(screen.getByTestId('terms-ip')).toBeInTheDocument()
  })

  it('should cover dispute resolution', () => {
    render(<TermsPage />)
    expect(screen.getByTestId('terms-disputes')).toBeInTheDocument()
  })

  it('should cover limitation of liability', () => {
    render(<TermsPage />)
    expect(screen.getByTestId('terms-liability')).toBeInTheDocument()
  })

  it('should cover modification clause', () => {
    render(<TermsPage />)
    expect(screen.getByTestId('terms-modifications')).toBeInTheDocument()
  })

  it('should have correct metadata title', () => {
    expect(metadata.title).toContain('Terms')
  })

  it('should have canonical URL in metadata', () => {
    expect(metadata.alternates?.canonical).toBe('https://surfacedart.com/terms')
  })

  it('should have metadata description', () => {
    expect(metadata.description).toBeDefined()
    expect(typeof metadata.description).toBe('string')
  })

  it('should have data-testid on hero section', () => {
    render(<TermsPage />)
    expect(screen.getByTestId('terms-hero')).toBeInTheDocument()
  })
})
