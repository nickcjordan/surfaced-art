import { describe, it, expect } from 'vitest'
import { render } from '@react-email/render'
import { AdminApplicationNotification } from './admin-application-notification.js'

describe('AdminApplicationNotification template', () => {
  const props = {
    artistName: 'Alice Creator',
    artistEmail: 'alice@example.com',
    categories: ['Ceramics', 'Mixed Media'],
    applicationDate: 'February 27, 2026',
  }

  it('should render a complete HTML document', async () => {
    const html = await render(<AdminApplicationNotification {...props} />)

    expect(html).toContain('<!DOCTYPE html')
    expect(html).toContain('</html>')
  })

  it('should include the artist name', async () => {
    const html = await render(<AdminApplicationNotification {...props} />)

    expect(html).toContain('Alice Creator')
  })

  it('should include the heading "New Artist Application"', async () => {
    const html = await render(<AdminApplicationNotification {...props} />)

    expect(html).toContain('New Artist Application')
  })

  it('should include the artist email', async () => {
    const html = await render(<AdminApplicationNotification {...props} />)

    expect(html).toContain('alice@example.com')
  })

  it('should include comma-separated categories', async () => {
    const html = await render(<AdminApplicationNotification {...props} />)

    expect(html).toContain('Ceramics, Mixed Media')
  })

  it('should include the application date', async () => {
    const html = await render(<AdminApplicationNotification {...props} />)

    expect(html).toContain('February 27, 2026')
  })

  it('should render plain text with all data', async () => {
    const text = await render(<AdminApplicationNotification {...props} />, {
      plainText: true,
    })

    expect(text).toContain('Alice Creator')
    expect(text).toContain('alice@example.com')
    expect(text).toContain('Ceramics, Mixed Media')
  })
})
