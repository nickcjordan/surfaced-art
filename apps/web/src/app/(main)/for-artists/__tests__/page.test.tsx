import { describe, it, expect, vi, beforeAll } from 'vitest'

vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://surfacedart.com')
vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.surfacedart.com')
import { render, screen } from '@testing-library/react'
import ForArtistsContent from '../ForArtistsContent'

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  global.IntersectionObserver = class {
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
    constructor() { /* noop */ }
  } as unknown as typeof IntersectionObserver

  // SVG methods not available in jsdom
  if (typeof SVGPathElement !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (SVGPathElement.prototype as any).getTotalLength = () => 100
  } else if (typeof SVGElement !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (SVGElement.prototype as any).getTotalLength = () => 100
  }
})

describe('For Artists Page', () => {
  it('should render the hero section', () => {
    render(<ForArtistsContent />)
    expect(screen.getByTestId('for-artists-hero')).toBeInTheDocument()
  })

  it('should render the hero heading', () => {
    render(<ForArtistsContent />)
    expect(
      screen.getByRole('heading', { level: 1, name: /built for artists/i })
    ).toBeInTheDocument()
  })

  it('should render the profile section', () => {
    render(<ForArtistsContent />)
    expect(screen.getByTestId('for-artists-profile')).toBeInTheDocument()
  })

  it('should render the how-it-works section', () => {
    render(<ForArtistsContent />)
    expect(screen.getByTestId('for-artists-how-it-works')).toBeInTheDocument()
  })

  it('should render the platform section', () => {
    render(<ForArtistsContent />)
    expect(screen.getByTestId('for-artists-platform')).toBeInTheDocument()
  })

  it('should render the commission section', () => {
    render(<ForArtistsContent />)
    expect(screen.getByTestId('for-artists-commission')).toBeInTheDocument()
  })

  it('should render the CTA section', () => {
    render(<ForArtistsContent />)
    expect(screen.getByTestId('for-artists-cta')).toBeInTheDocument()
  })

  it('should render the roadmap section', () => {
    render(<ForArtistsContent />)
    expect(screen.getByTestId('for-artists-roadmap')).toBeInTheDocument()
  })

  it('should not render a fake testimonial', () => {
    render(<ForArtistsContent />)
    expect(screen.queryByText(/Surfaced Art Creator/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/selling through DMs/i)).not.toBeInTheDocument()
  })
})
