import { describe, it, expect } from 'vitest'
import { render } from '@react-email/render'
import { Layout, BRAND } from './Layout.js'

describe('Layout component', () => {
  it('should render a complete HTML document', async () => {
    const html = await render(<Layout preview="Test preview">Hello</Layout>)

    expect(html).toContain('<!DOCTYPE html')
    expect(html).toContain('<html')
    expect(html).toContain('</html>')
  })

  it('should include the Surfaced Art wordmark header', async () => {
    const html = await render(<Layout preview="Test">Content</Layout>)

    expect(html).toContain('SURFACED ART')
  })

  it('should include the footer tagline', async () => {
    const html = await render(<Layout preview="Test">Content</Layout>)

    expect(html).toContain('Curated handmade art from vetted artists')
    expect(html).toContain('surfacedart.com')
  })

  it('should render child content', async () => {
    const html = await render(
      <Layout preview="Test">
        <p>Unique child content here</p>
      </Layout>,
    )

    expect(html).toContain('Unique child content here')
  })

  it('should use brand background color', async () => {
    const html = await render(<Layout preview="Test">Content</Layout>)

    expect(html).toContain(BRAND.colors.background)
  })

  it('should use brand text color', async () => {
    const html = await render(<Layout preview="Test">Content</Layout>)

    expect(html).toContain(BRAND.colors.text)
  })

  it('should use brand heading font stack', async () => {
    const html = await render(<Layout preview="Test">Content</Layout>)

    expect(html).toContain('Georgia')
  })

  it('should render plain text version', async () => {
    const text = await render(
      <Layout preview="Test">
        <p>Some email body text</p>
      </Layout>,
      { plainText: true },
    )

    expect(text).toContain('SURFACED ART')
    expect(text).toContain('Some email body text')
    expect(text).toContain('surfacedart.com')
  })
})
