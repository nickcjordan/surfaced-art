import { describe, it, expect } from 'vitest'
import { render } from '@react-email/render'
import { ArtistAcceptance } from './artist-acceptance.js'

describe('ArtistAcceptance template', () => {
  const props = { artistName: 'John Smith' }

  it('should render a complete HTML document', async () => {
    const html = await render(<ArtistAcceptance {...props} />)

    expect(html).toContain('<!DOCTYPE html')
    expect(html).toContain('</html>')
  })

  it('should include the artist name', async () => {
    const html = await render(<ArtistAcceptance {...props} />)

    expect(html).toContain('John Smith')
  })

  it('should include the heading "Welcome to Surfaced Art"', async () => {
    const html = await render(<ArtistAcceptance {...props} />)

    expect(html).toContain('Welcome to Surfaced Art')
  })

  it('should mention curatorial selection', async () => {
    const html = await render(<ArtistAcceptance {...props} />)

    expect(html).toContain('curatorial team')
    expect(html).toContain('selected your work')
  })

  it('should include a CTA button for profile setup', async () => {
    const html = await render(<ArtistAcceptance {...props} />)

    expect(html).toContain('Set Up Your Profile')
    expect(html).toContain('surfacedart.com')
  })

  it('should include brand header and footer', async () => {
    const html = await render(<ArtistAcceptance {...props} />)

    expect(html).toContain('SURFACED ART')
    expect(html).toContain('Curated handmade art from vetted artists')
  })

  it('should render plain text with key content', async () => {
    const text = await render(<ArtistAcceptance {...props} />, {
      plainText: true,
    })

    expect(text).toContain('John Smith')
    expect(text).toContain('Welcome to Surfaced Art')
    expect(text).toContain('SURFACED ART')
  })
})
