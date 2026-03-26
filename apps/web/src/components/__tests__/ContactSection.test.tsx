import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContactSection, type ContactSectionProps } from '../ContactSection'

// Mock the ContactArtistDialog since it's a client component with complex behavior
vi.mock('@/components/ContactArtistDialog', () => ({
  ContactArtistDialog: ({ artistName }: { artistName: string; artistSlug: string }) => (
    <button data-testid="contact-artist-button">Contact {artistName}</button>
  ),
}))

const fullProps: ContactSectionProps = {
  hasContactForm: true,
  artistSlug: 'abbey-peters',
  artistName: 'Abbey Peters',
  websiteUrl: 'https://abbey-peters.com',
  instagramUrl: 'https://instagram.com/abbeypetersart',
  location: 'Brooklyn, NY',
  commissionsOpen: true,
}

describe('ContactSection', () => {
  it('should render the section with artist-contact testid', () => {
    render(<ContactSection {...fullProps} />)
    expect(screen.getByTestId('artist-contact')).toBeInTheDocument()
  })

  it('should render "Get in Touch" heading', () => {
    render(<ContactSection {...fullProps} />)
    expect(
      screen.getByRole('heading', { name: 'Get in Touch' })
    ).toBeInTheDocument()
  })

  it('should render contact button when hasContactForm is true', () => {
    render(<ContactSection {...fullProps} />)
    expect(screen.getByTestId('contact-artist-button')).toBeInTheDocument()
  })

  it('should not render contact button when hasContactForm is false', () => {
    render(<ContactSection {...fullProps} hasContactForm={false} />)
    expect(screen.queryByTestId('contact-artist-button')).not.toBeInTheDocument()
  })

  it('should not render a mailto link (email is hidden)', () => {
    render(<ContactSection {...fullProps} />)
    const links = screen.queryAllByRole('link')
    const mailtoLinks = links.filter((l) => l.getAttribute('href')?.startsWith('mailto:'))
    expect(mailtoLinks).toHaveLength(0)
  })

  it('should render website as an external link with clean domain', () => {
    render(<ContactSection {...fullProps} />)
    const websiteLink = screen.getByRole('link', { name: /abbey-peters\.com/i })
    expect(websiteLink).toHaveAttribute('href', 'https://abbey-peters.com')
    expect(websiteLink).toHaveAttribute('target', '_blank')
    expect(websiteLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('should render Instagram as an external link with handle', () => {
    render(<ContactSection {...fullProps} />)
    const igLink = screen.getByRole('link', { name: /@abbeypetersart/i })
    expect(igLink).toHaveAttribute(
      'href',
      'https://instagram.com/abbeypetersart'
    )
    expect(igLink).toHaveAttribute('target', '_blank')
  })

  it('should render location text', () => {
    render(<ContactSection {...fullProps} />)
    expect(screen.getByText('Brooklyn, NY')).toBeInTheDocument()
  })

  it('should show "Open for commissions" when commissionsOpen is true', () => {
    render(<ContactSection {...fullProps} commissionsOpen={true} />)
    expect(screen.getByText('Open for commissions')).toBeInTheDocument()
  })

  it('should show "Not taking commissions" when commissionsOpen is false', () => {
    render(<ContactSection {...fullProps} commissionsOpen={false} />)
    expect(screen.getByText('Not taking commissions')).toBeInTheDocument()
  })

  it('should not render website row when websiteUrl is null', () => {
    render(<ContactSection {...fullProps} websiteUrl={null} />)
    expect(
      screen.queryByRole('link', { name: /abbey-peters\.com/i })
    ).not.toBeInTheDocument()
  })

  it('should not render Instagram row when instagramUrl is null', () => {
    render(<ContactSection {...fullProps} instagramUrl={null} />)
    expect(
      screen.queryByRole('link', { name: /@abbeypetersart/i })
    ).not.toBeInTheDocument()
  })

  it('should render with only location and commissions (minimal props)', () => {
    render(
      <ContactSection
        hasContactForm={false}
        artistSlug="test-artist"
        artistName="Test Artist"
        websiteUrl={null}
        instagramUrl={null}
        location="Austin, TX"
        commissionsOpen={false}
      />
    )
    expect(screen.getByTestId('artist-contact')).toBeInTheDocument()
    expect(screen.getByText('Austin, TX')).toBeInTheDocument()
    expect(screen.getByText('Not taking commissions')).toBeInTheDocument()
  })

  it('should strip protocol from website URL for display', () => {
    render(
      <ContactSection
        {...fullProps}
        websiteUrl="https://www.abbey-peters.com/portfolio"
      />
    )
    expect(
      screen.getByRole('link', { name: /abbey-peters\.com\/portfolio/i })
    ).toBeInTheDocument()
    // Should not show "https://www." in display text
    expect(screen.queryByText(/https:\/\//)).not.toBeInTheDocument()
  })

  it('should extract Instagram handle from URL for display', () => {
    render(
      <ContactSection
        {...fullProps}
        instagramUrl="https://www.instagram.com/abbeypetersart/"
      />
    )
    expect(
      screen.getByRole('link', { name: /@abbeypetersart/ })
    ).toBeInTheDocument()
  })
})
