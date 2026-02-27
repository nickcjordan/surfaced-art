import { describe, it, expect } from 'vitest'
import { render } from '@react-email/render'
import { WaitlistWelcome } from './waitlist-welcome.js'

describe('WaitlistWelcome template', () => {
  it('should render a complete HTML document', async () => {
    const html = await render(<WaitlistWelcome />)

    expect(html).toContain('<!DOCTYPE html')
    expect(html).toContain('</html>')
  })

  it('should include the heading', async () => {
    const html = await render(<WaitlistWelcome />)

    // Apostrophe is HTML-encoded as &#x27; by React Email
    expect(html).toContain('on the List')
  })

  it('should include the anti-AI positioning', async () => {
    const html = await render(<WaitlistWelcome />)

    expect(html).toContain('No AI')
    expect(html).toContain('No drop shipping')
    expect(html).toContain('No mass production')
  })

  it('should mention opening to collectors', async () => {
    const html = await render(<WaitlistWelcome />)

    expect(html).toContain('collectors')
  })

  it('should include brand header and footer', async () => {
    const html = await render(<WaitlistWelcome />)

    expect(html).toContain('SURFACED ART')
    expect(html).toContain('surfacedart.com')
  })

  it('should render plain text with key content', async () => {
    const text = await render(<WaitlistWelcome />, { plainText: true })

    expect(text).toContain("You're on the List")
    expect(text).toContain('No AI')
    expect(text).toContain('SURFACED ART')
  })
})
