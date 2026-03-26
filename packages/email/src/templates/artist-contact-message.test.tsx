import { describe, it, expect } from 'vitest'
import { render } from '@react-email/render'
import { ArtistContactMessage } from './artist-contact-message.js'

const defaultProps = {
  artistName: 'Elena Cordova',
  senderFirstName: 'Jane',
  senderLastName: 'Smith',
  senderEmail: 'jane@example.com',
  subject: 'Interested in a commission',
  message: 'I love your ceramic work. Would you be open to a custom piece?',
}

describe('ArtistContactMessage template', () => {
  it('should render a complete HTML document', async () => {
    const html = await render(<ArtistContactMessage {...defaultProps} />)

    expect(html).toContain('<!DOCTYPE html')
    expect(html).toContain('</html>')
  })

  it('should include the artist name', async () => {
    const html = await render(<ArtistContactMessage {...defaultProps} />)

    expect(html).toContain('Elena Cordova')
  })

  it('should include the sender details', async () => {
    const html = await render(<ArtistContactMessage {...defaultProps} />)

    expect(html).toContain('Jane')
    expect(html).toContain('Smith')
    expect(html).toContain('jane@example.com')
  })

  it('should include the subject', async () => {
    const html = await render(<ArtistContactMessage {...defaultProps} />)

    expect(html).toContain('Interested in a commission')
  })

  it('should include the message content', async () => {
    const html = await render(<ArtistContactMessage {...defaultProps} />)

    expect(html).toContain('ceramic work')
  })

  it('should include reply instruction', async () => {
    const html = await render(<ArtistContactMessage {...defaultProps} />)

    expect(html).toContain('Reply directly to this email')
  })

  it('should include spam reporting note', async () => {
    const html = await render(<ArtistContactMessage {...defaultProps} />)

    expect(html).toContain('support@surfaced.art')
  })

  it('should include brand header and footer', async () => {
    const html = await render(<ArtistContactMessage {...defaultProps} />)

    expect(html).toContain('SURFACED ART')
    expect(html).toContain('surfaced.art')
  })

  it('should render plain text with key content', async () => {
    const text = await render(<ArtistContactMessage {...defaultProps} />, { plainText: true })

    expect(text).toContain('New Message')
    expect(text).toContain('Elena Cordova')
    expect(text).toContain('Jane')
    expect(text).toContain('jane@example.com')
    expect(text).toContain('ceramic work')
  })
})
