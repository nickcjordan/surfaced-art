import { describe, it, expect } from 'vitest'
import { GenericFairAdapter } from '../../src/art-fair/adapters/generic.js'

const adapter = new GenericFairAdapter()

const FAIR_URL = 'https://artfair.example.com/artists'

// ---------------------------------------------------------------------------
// Sample HTML fixtures
// ---------------------------------------------------------------------------

const HTML_WITH_ARTIST_CARDS = `
<html><body>
<div class="artists-list">
  <div class="artist">
    <h3>Jane Smith</h3>
    <em>Ceramics</em>
    <a href="https://janesmith.com">Website</a>
    <a href="https://instagram.com/janeceramics">Instagram</a>
  </div>
  <div class="artist">
    <h3>Bob Jones</h3>
    <em>Oil Painting</em>
    <a href="https://bobjones.art">Website</a>
  </div>
  <div class="artist">
    <h3>Alice Rivera</h3>
    <em>Jewelry</em>
    <a href="https://instagram.com/alicerivera">Instagram</a>
  </div>
</div>
</body></html>
`

const HTML_WITH_TABLE = `
<html><body>
<table>
  <tr><th>Name</th><th>Medium</th><th>Website</th></tr>
  <tr>
    <td>Jane Smith</td>
    <td>Pottery</td>
    <td><a href="https://janesmith.com">janesmith.com</a></td>
  </tr>
  <tr>
    <td>Bob Jones</td>
    <td>Woodturning</td>
    <td><a href="https://bobjones.art">bobjones.art</a></td>
  </tr>
  <tr>
    <td>Alice Rivera</td>
    <td>Fiber Art</td>
    <td><a href="https://instagram.com/alice">IG</a></td>
  </tr>
</table>
</body></html>
`

const HTML_WITH_LIST = `
<html><body>
<ul>
  <li><a href="https://janesmith.com">Jane Smith</a> - Ceramics</li>
  <li><a href="https://bobjones.art">Bob Jones</a> - Painting</li>
  <li>Alice Rivera - Jewelry</li>
  <li>Carlos Mendez - Photography</li>
  <li>Diana Wu - Mixed Media</li>
</ul>
</body></html>
`

const HTML_EMPTY = '<html><body><p>No artists listed.</p></body></html>'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GenericFairAdapter', () => {
  it('always canHandle', () => {
    expect(adapter.canHandle('https://any-fair.com')).toBe(true)
  })

  describe('structured extraction (artist cards)', () => {
    it('extracts artists from card-like elements', () => {
      const leads = adapter.extract(HTML_WITH_ARTIST_CARDS, FAIR_URL)
      expect(leads).toHaveLength(3)

      expect(leads[0]!.name).toBe('Jane Smith')
      expect(leads[0]!.category).toBe('Ceramics')
      expect(leads[0]!.website).toBe('https://janesmith.com')
      expect(leads[0]!.instagram).toBe('https://instagram.com/janeceramics')

      expect(leads[1]!.name).toBe('Bob Jones')
      expect(leads[1]!.category).toBe('Painting')
      expect(leads[1]!.website).toBe('https://bobjones.art')
      expect(leads[1]!.instagram).toBeNull()

      expect(leads[2]!.name).toBe('Alice Rivera')
      expect(leads[2]!.category).toBe('Jewelry')
      expect(leads[2]!.instagram).toBe('https://instagram.com/alicerivera')
    })

    it('sets source to art-fair with fair domain', () => {
      const leads = adapter.extract(HTML_WITH_ARTIST_CARDS, FAIR_URL)
      expect(leads[0]!.source).toBe('art-fair')
      expect(leads[0]!.sourceDetail).toContain('artfair.example.com')
    })
  })

  describe('table extraction', () => {
    it('extracts artists from table rows', () => {
      const leads = adapter.extract(HTML_WITH_TABLE, FAIR_URL)
      expect(leads).toHaveLength(3)

      expect(leads[0]!.name).toBe('Jane Smith')
      expect(leads[0]!.category).toBe('Ceramics')
      expect(leads[0]!.website).toBe('https://janesmith.com')

      expect(leads[1]!.name).toBe('Bob Jones')
      expect(leads[1]!.category).toBe('Woodworking')

      expect(leads[2]!.name).toBe('Alice Rivera')
      expect(leads[2]!.category).toBe('Fibers')
      expect(leads[2]!.instagram).toBe('https://instagram.com/alice')
    })
  })

  describe('list extraction', () => {
    it('extracts artists from list items', () => {
      const leads = adapter.extract(HTML_WITH_LIST, FAIR_URL)
      expect(leads).toHaveLength(5)

      expect(leads[0]!.name).toBe('Jane Smith')
      expect(leads[0]!.website).toBe('https://janesmith.com')

      expect(leads[1]!.name).toBe('Bob Jones')
      expect(leads[1]!.website).toBe('https://bobjones.art')
    })
  })

  describe('empty/no-data pages', () => {
    it('returns empty array for pages with no artist data', () => {
      const leads = adapter.extract(HTML_EMPTY, FAIR_URL)
      expect(leads).toEqual([])
    })
  })
})
