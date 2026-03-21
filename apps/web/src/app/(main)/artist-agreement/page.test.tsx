import { describe, it, expect, vi } from 'vitest'

vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://surfaced.art')
vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.surfaced.art')
import { render, screen } from '@testing-library/react'

import ArtistAgreementPage, { metadata } from './page'

describe('Artist Agreement Page', () => {
  it('should render the page heading', () => {
    render(<ArtistAgreementPage />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent(/artist agreement/i)
  })

  it('should cover who the agreement is between', () => {
    render(<ArtistAgreementPage />)
    expect(screen.getByTestId('agreement-parties')).toBeInTheDocument()
  })

  it('should cover what Surfaced Art is', () => {
    render(<ArtistAgreementPage />)
    expect(screen.getByTestId('agreement-platform')).toBeInTheDocument()
  })

  it('should cover handmade definition', () => {
    render(<ArtistAgreementPage />)
    const section = screen.getByTestId('agreement-handmade')
    expect(section).toBeInTheDocument()
    expect(section.textContent).toMatch(/meaningfully involved/i)
  })

  it('should cover application process', () => {
    render(<ArtistAgreementPage />)
    expect(screen.getByTestId('agreement-application')).toBeInTheDocument()
  })

  it('should cover profile and listings', () => {
    render(<ArtistAgreementPage />)
    expect(screen.getByTestId('agreement-listings')).toBeInTheDocument()
  })

  it('should cover commission and payment', () => {
    render(<ArtistAgreementPage />)
    const section = screen.getByTestId('agreement-commission')
    expect(section).toBeInTheDocument()
    expect(section.textContent).toMatch(/30%/)
  })

  it('should cover shipping', () => {
    render(<ArtistAgreementPage />)
    expect(screen.getByTestId('agreement-shipping')).toBeInTheDocument()
  })

  it('should cover buyer disputes', () => {
    render(<ArtistAgreementPage />)
    expect(screen.getByTestId('agreement-disputes')).toBeInTheDocument()
  })

  it('should cover intellectual property', () => {
    render(<ArtistAgreementPage />)
    expect(screen.getByTestId('agreement-ip')).toBeInTheDocument()
  })

  it('should cover artist expectations', () => {
    render(<ArtistAgreementPage />)
    expect(screen.getByTestId('agreement-expectations')).toBeInTheDocument()
  })

  it('should cover platform commitments', () => {
    render(<ArtistAgreementPage />)
    expect(screen.getByTestId('agreement-commitments')).toBeInTheDocument()
  })

  it('should cover non-exclusivity', () => {
    render(<ArtistAgreementPage />)
    const section = screen.getByTestId('agreement-nonexclusive')
    expect(section).toBeInTheDocument()
    expect(section.textContent).toMatch(/non-exclusive/i)
  })

  it('should cover changes to agreement', () => {
    render(<ArtistAgreementPage />)
    expect(screen.getByTestId('agreement-changes')).toBeInTheDocument()
  })

  it('should cover account closure', () => {
    render(<ArtistAgreementPage />)
    expect(screen.getByTestId('agreement-closure')).toBeInTheDocument()
  })

  it('should cover legal terms', () => {
    render(<ArtistAgreementPage />)
    const section = screen.getByTestId('agreement-legal')
    expect(section).toBeInTheDocument()
    expect(section.textContent).toMatch(/Texas/i)
  })

  it('should cover questions/contact', () => {
    render(<ArtistAgreementPage />)
    expect(screen.getByTestId('agreement-questions')).toBeInTheDocument()
  })

  it('should have correct metadata title', () => {
    expect(metadata.title).toContain('Artist Agreement')
  })

  it('should have canonical URL in metadata', () => {
    expect(metadata.alternates?.canonical).toBe(
      'https://surfaced.art/artist-agreement'
    )
  })

  it('should have metadata description', () => {
    expect(metadata.description).toBeDefined()
    expect(typeof metadata.description).toBe('string')
  })

  it('should have data-testid on hero section', () => {
    render(<ArtistAgreementPage />)
    expect(screen.getByTestId('agreement-hero')).toBeInTheDocument()
  })

  it('should show draft notice', () => {
    render(<ArtistAgreementPage />)
    expect(screen.getByTestId('agreement-draft-notice')).toBeInTheDocument()
  })
})
