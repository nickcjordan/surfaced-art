import { describe, it, expect, vi, beforeAll } from 'vitest'

vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://surfaced.art')
vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.surfaced.art')
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

  describe('copy revisions (SUR-287)', () => {
    it('should use revised hero subheading without hollow enthusiasm', () => {
      render(<ForArtistsContent />)
      expect(screen.queryByText(/Now you do too!/i)).not.toBeInTheDocument()
      expect(screen.getByText(/Now there's one for artists/i)).toBeInTheDocument()
    })

    it('should use revised portfolio headline without generic website-builder phrasing', () => {
      render(<ForArtistsContent />)
      expect(screen.queryByText(/No building required/i)).not.toBeInTheDocument()
      expect(screen.getByText(/actually looks like art/i)).toBeInTheDocument()
    })

    it('should not use "Replace your website" label that contradicts non-exclusivity', () => {
      render(<ForArtistsContent />)
      expect(screen.queryByText(/Replace your website/i)).not.toBeInTheDocument()
      expect(screen.getAllByText(/Everything a portfolio site has/i).length).toBeGreaterThan(0)
    })

    it('should use revised curated gallery headline without gatekeeping tone', () => {
      render(<ForArtistsContent />)
      expect(screen.queryByText(/Every artist here was chosen/i)).not.toBeInTheDocument()
      expect(screen.getByText(/Every artist here made something real/i)).toBeInTheDocument()
    })

    it('should use revised how-it-works step 4 text', () => {
      render(<ForArtistsContent />)
      expect(screen.queryByText(/let the gallery do the rest/i)).not.toBeInTheDocument()
      expect(screen.getAllByText(/buyers can find you from here/i).length).toBeGreaterThan(0)
    })

    it('should mention no commission on shipping in pricing section', () => {
      render(<ForArtistsContent />)
      expect(screen.queryByText(/No listing fees, no monthly subscriptions/i)).not.toBeInTheDocument()
      expect(screen.getByText(/we never take a cut of your shipping costs/i)).toBeInTheDocument()
    })

    it('should use period instead of exclamation on closing CTA', () => {
      render(<ForArtistsContent />)
      expect(screen.queryByText(/Applications are open!/i)).not.toBeInTheDocument()
      expect(screen.getByText(/Applications are open\./i)).toBeInTheDocument()
    })
  })
})
