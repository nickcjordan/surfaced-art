import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContactArtistDialog } from '../ContactArtistDialog'

// Mock the api module
vi.mock('@/lib/api', () => ({
  contactArtist: vi.fn(),
}))

describe('ContactArtistDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the trigger button', () => {
    render(
      <ContactArtistDialog artistSlug="abbey-peters" artistName="Abbey Peters" />
    )
    expect(screen.getByTestId('contact-artist-button')).toBeInTheDocument()
    expect(screen.getByText('Contact')).toBeInTheDocument()
  })

  it('should open dialog on button click', async () => {
    const user = userEvent.setup()
    render(
      <ContactArtistDialog artistSlug="abbey-peters" artistName="Abbey Peters" />
    )

    await user.click(screen.getByTestId('contact-artist-button'))

    expect(screen.getByTestId('contact-artist-dialog')).toBeInTheDocument()
    expect(screen.getByText('Contact Abbey Peters')).toBeInTheDocument()
  })

  it('should show all form fields', async () => {
    const user = userEvent.setup()
    render(
      <ContactArtistDialog artistSlug="abbey-peters" artistName="Abbey Peters" />
    )

    await user.click(screen.getByTestId('contact-artist-button'))

    expect(screen.getByTestId('contact-firstName')).toBeInTheDocument()
    expect(screen.getByTestId('contact-lastName')).toBeInTheDocument()
    expect(screen.getByTestId('contact-email')).toBeInTheDocument()
    expect(screen.getByTestId('contact-subject')).toBeInTheDocument()
    expect(screen.getByTestId('contact-message')).toBeInTheDocument()
    expect(screen.getByTestId('contact-submit')).toBeInTheDocument()
  })

  it('should have proper labels for all fields', async () => {
    const user = userEvent.setup()
    render(
      <ContactArtistDialog artistSlug="abbey-peters" artistName="Abbey Peters" />
    )

    await user.click(screen.getByTestId('contact-artist-button'))

    expect(screen.getByLabelText(/First Name/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Last Name/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Subject/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Message/)).toBeInTheDocument()
  })

  it('should have a hidden honeypot field', async () => {
    const user = userEvent.setup()
    render(
      <ContactArtistDialog artistSlug="abbey-peters" artistName="Abbey Peters" />
    )

    await user.click(screen.getByTestId('contact-artist-button'))

    const honeypot = screen.getByLabelText('Website')
    expect(honeypot).toBeInTheDocument()
    expect(honeypot).toHaveAttribute('tabIndex', '-1')
    expect(honeypot.closest('[aria-hidden]')).toHaveAttribute('aria-hidden', 'true')
  })

  it('should show success message on successful submission', async () => {
    const { contactArtist } = await import('@/lib/api')
    vi.mocked(contactArtist).mockResolvedValueOnce({ message: 'Your message has been sent' })

    const user = userEvent.setup()
    render(
      <ContactArtistDialog artistSlug="abbey-peters" artistName="Abbey Peters" />
    )

    await user.click(screen.getByTestId('contact-artist-button'))
    await user.type(screen.getByTestId('contact-firstName'), 'Jane')
    await user.type(screen.getByTestId('contact-lastName'), 'Smith')
    await user.type(screen.getByTestId('contact-email'), 'jane@example.com')
    await user.type(screen.getByTestId('contact-subject'), 'Commission inquiry')
    await user.type(screen.getByTestId('contact-message'), 'I love your work and would like to discuss a commission.')
    await user.click(screen.getByTestId('contact-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('contact-success')).toBeInTheDocument()
    })
    expect(screen.getByText('Your message has been sent.')).toBeInTheDocument()
  })

  it('should call contactArtist with correct data', async () => {
    const { contactArtist } = await import('@/lib/api')
    vi.mocked(contactArtist).mockResolvedValueOnce({ message: 'Your message has been sent' })

    const user = userEvent.setup()
    render(
      <ContactArtistDialog artistSlug="abbey-peters" artistName="Abbey Peters" />
    )

    await user.click(screen.getByTestId('contact-artist-button'))
    await user.type(screen.getByTestId('contact-firstName'), 'Jane')
    await user.type(screen.getByTestId('contact-lastName'), 'Smith')
    await user.type(screen.getByTestId('contact-email'), 'jane@example.com')
    await user.type(screen.getByTestId('contact-subject'), 'Hello')
    await user.type(screen.getByTestId('contact-message'), 'I love your ceramic work very much!')
    await user.click(screen.getByTestId('contact-submit'))

    await waitFor(() => {
      expect(contactArtist).toHaveBeenCalledWith('abbey-peters', {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        subject: 'Hello',
        message: 'I love your ceramic work very much!',
        website: '',
      })
    })
  })

  it('should show error message on failure', async () => {
    const { contactArtist } = await import('@/lib/api')
    vi.mocked(contactArtist).mockRejectedValueOnce(new Error('Too many requests'))

    const user = userEvent.setup()
    render(
      <ContactArtistDialog artistSlug="abbey-peters" artistName="Abbey Peters" />
    )

    await user.click(screen.getByTestId('contact-artist-button'))
    await user.type(screen.getByTestId('contact-firstName'), 'Jane')
    await user.type(screen.getByTestId('contact-lastName'), 'Smith')
    await user.type(screen.getByTestId('contact-email'), 'jane@example.com')
    await user.type(screen.getByTestId('contact-subject'), 'Hello')
    await user.type(screen.getByTestId('contact-message'), 'I would like to inquire about your work.')
    await user.click(screen.getByTestId('contact-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('contact-error')).toBeInTheDocument()
    })
    expect(screen.getByText('Too many requests')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('should disable submit button while submitting', async () => {
    const { contactArtist } = await import('@/lib/api')
    // Never resolve — keeps the form in submitting state
    vi.mocked(contactArtist).mockReturnValueOnce(new Promise(() => {}))

    const user = userEvent.setup()
    render(
      <ContactArtistDialog artistSlug="abbey-peters" artistName="Abbey Peters" />
    )

    await user.click(screen.getByTestId('contact-artist-button'))
    await user.type(screen.getByTestId('contact-firstName'), 'Jane')
    await user.type(screen.getByTestId('contact-lastName'), 'Smith')
    await user.type(screen.getByTestId('contact-email'), 'jane@example.com')
    await user.type(screen.getByTestId('contact-subject'), 'Hello')
    await user.type(screen.getByTestId('contact-message'), 'I would like to inquire about your work.')
    await user.click(screen.getByTestId('contact-submit'))

    expect(screen.getByTestId('contact-submit')).toBeDisabled()
    expect(screen.getByText('Sending...')).toBeInTheDocument()
  })
})
