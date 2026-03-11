import { describe, it, expect, vi } from 'vitest'

vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://surfaced.art')
vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.surfaced.art')
import { render, screen } from '@testing-library/react'

import PrivacyPage, { metadata } from './page'

describe('Privacy Policy Page', () => {
  it('should render the page heading', () => {
    render(<PrivacyPage />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent(/privacy policy/i)
  })

  it('should cover data collection', () => {
    render(<PrivacyPage />)
    expect(screen.getByTestId('privacy-data-collected')).toBeInTheDocument()
  })

  it('should cover third-party services', () => {
    render(<PrivacyPage />)
    expect(screen.getByTestId('privacy-third-party')).toBeInTheDocument()
  })

  it('should cover cookies and analytics', () => {
    render(<PrivacyPage />)
    expect(screen.getByTestId('privacy-cookies')).toBeInTheDocument()
  })

  it('should cover data retention', () => {
    render(<PrivacyPage />)
    expect(screen.getByTestId('privacy-retention')).toBeInTheDocument()
  })

  it('should cover deletion rights', () => {
    render(<PrivacyPage />)
    expect(screen.getByTestId('privacy-rights')).toBeInTheDocument()
  })

  it('should include contact information', () => {
    render(<PrivacyPage />)
    expect(screen.getByTestId('privacy-contact')).toBeInTheDocument()
  })

  it('should have correct metadata title', () => {
    expect(metadata.title).toContain('Privacy')
  })

  it('should have canonical URL in metadata', () => {
    expect(metadata.alternates?.canonical).toBe('https://surfaced.art/privacy')
  })

  it('should have metadata description', () => {
    expect(metadata.description).toBeDefined()
    expect(typeof metadata.description).toBe('string')
  })

  it('should have data-testid on hero section', () => {
    render(<PrivacyPage />)
    expect(screen.getByTestId('privacy-hero')).toBeInTheDocument()
  })
})
