import { describe, it, expect, vi } from 'vitest'
import { scrapeArtistWebsite } from '../../src/enricher/website-scraper.js'
import { HttpClient } from '../../src/shared/http-client.js'
import { RateLimiter } from '../../src/shared/rate-limiter.js'

function createMockHttpClient(body: string, ok = true): HttpClient {
  const mockFetch = vi.fn(async () =>
    new Response(body, { status: ok ? 200 : 404 })
  ) as unknown as typeof fetch

  return new HttpClient({
    rateLimiter: new RateLimiter({ minDelayMs: 0 }),
    fetchFn: mockFetch,
  })
}

const HTML_WITH_INSTAGRAM = `
<html><body>
<nav>
  <a href="https://instagram.com/janeceramics">Instagram</a>
  <a href="https://facebook.com/janeceramics">Facebook</a>
  <a href="https://pinterest.com/janeceramics">Pinterest</a>
</nav>
<main><p>Welcome to my art studio.</p></main>
</body></html>
`

const HTML_WITHOUT_SOCIAL = `
<html><body>
<nav>
  <a href="/about">About</a>
  <a href="/gallery">Gallery</a>
  <a href="/contact">Contact</a>
</nav>
</body></html>
`

const HTML_WITH_MULTIPLE_SOCIAL = `
<html><body>
<footer>
  <a href="https://www.instagram.com/artist_jane/">Follow on IG</a>
  <a href="https://www.tiktok.com/@artist_jane">TikTok</a>
  <a href="https://www.youtube.com/c/artist_jane">YouTube</a>
</footer>
</body></html>
`

describe('scrapeArtistWebsite', () => {
  it('extracts Instagram link from artist website', async () => {
    const client = createMockHttpClient(HTML_WITH_INSTAGRAM)
    const result = await scrapeArtistWebsite('https://janeceramics.com', client)
    expect(result.instagram).toBe('https://instagram.com/janeceramics')
  })

  it('extracts other social links', async () => {
    const client = createMockHttpClient(HTML_WITH_INSTAGRAM)
    const result = await scrapeArtistWebsite('https://janeceramics.com', client)
    expect(result.otherSocialLinks).toHaveLength(2)
    expect(result.otherSocialLinks[0]!.platform).toBe('facebook')
    expect(result.otherSocialLinks[1]!.platform).toBe('pinterest')
  })

  it('returns null Instagram when no social links found', async () => {
    const client = createMockHttpClient(HTML_WITHOUT_SOCIAL)
    const result = await scrapeArtistWebsite('https://example.com', client)
    expect(result.instagram).toBeNull()
    expect(result.otherSocialLinks).toHaveLength(0)
  })

  it('handles www.instagram.com URLs', async () => {
    const client = createMockHttpClient(HTML_WITH_MULTIPLE_SOCIAL)
    const result = await scrapeArtistWebsite('https://artist-jane.com', client)
    expect(result.instagram).toBe('https://instagram.com/artist_jane')
  })

  it('returns empty result for failed HTTP requests', async () => {
    const client = createMockHttpClient('Not Found', false)
    const result = await scrapeArtistWebsite('https://dead-site.com', client)
    expect(result.instagram).toBeNull()
    expect(result.otherSocialLinks).toHaveLength(0)
  })
})
