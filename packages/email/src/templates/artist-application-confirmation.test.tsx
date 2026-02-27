import { describe, it, expect } from 'vitest'
import { render } from '@react-email/render'
import { ArtistApplicationConfirmation } from './artist-application-confirmation.js'

describe('ArtistApplicationConfirmation template', () => {
  const props = { artistName: 'Jane Doe' }

  it('should render a complete HTML document', async () => {
    const html = await render(<ArtistApplicationConfirmation {...props} />)

    expect(html).toContain('<!DOCTYPE html')
    expect(html).toContain('</html>')
  })

  it('should include the artist name', async () => {
    const html = await render(<ArtistApplicationConfirmation {...props} />)

    expect(html).toContain('Jane Doe')
  })

  it('should include the heading "We Received Your Application"', async () => {
    const html = await render(<ArtistApplicationConfirmation {...props} />)

    expect(html).toContain('We Received Your Application')
  })

  it('should mention the review timeline', async () => {
    const html = await render(<ArtistApplicationConfirmation {...props} />)

    expect(html).toContain('5–7 business days')
  })

  it('should include the brand header and footer', async () => {
    const html = await render(<ArtistApplicationConfirmation {...props} />)

    expect(html).toContain('SURFACED ART')
    expect(html).toContain('surfacedart.com')
  })

  it('should render plain text with key content', async () => {
    const text = await render(<ArtistApplicationConfirmation {...props} />, {
      plainText: true,
    })

    expect(text).toContain('Jane Doe')
    expect(text).toContain('We Received Your Application')
    expect(text).toContain('SURFACED ART')
  })
})
