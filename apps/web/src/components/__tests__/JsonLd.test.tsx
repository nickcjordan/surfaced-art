import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { JsonLd } from '../JsonLd'

describe('JsonLd', () => {
  it('renders a script tag with type application/ld+json', () => {
    const { container } = render(
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebSite' }} />
    )
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).toBeInTheDocument()
  })

  it('serializes data as JSON in script content', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Test Product',
      offers: { '@type': 'Offer', price: '99.00' },
    }
    const { container } = render(<JsonLd data={data} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(JSON.parse(script!.textContent!)).toEqual(data)
  })

  it('handles special characters in strings', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'O\'Brien & Co — "Artists"',
    }
    const { container } = render(<JsonLd data={data} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    const parsed = JSON.parse(script!.textContent!)
    expect(parsed.name).toBe('O\'Brien & Co — "Artists"')
  })

  it('handles arrays in data', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      sameAs: ['https://instagram.com/test', 'https://example.com'],
    }
    const { container } = render(<JsonLd data={data} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    const parsed = JSON.parse(script!.textContent!)
    expect(parsed.sameAs).toEqual(['https://instagram.com/test', 'https://example.com'])
  })

  it('handles nested objects', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      offers: {
        '@type': 'Offer',
        seller: { '@type': 'Person', name: 'Artist' },
      },
    }
    const { container } = render(<JsonLd data={data} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    const parsed = JSON.parse(script!.textContent!)
    expect(parsed.offers.seller.name).toBe('Artist')
  })
})
