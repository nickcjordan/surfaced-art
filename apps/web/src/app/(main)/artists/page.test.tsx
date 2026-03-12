import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://surfaced.art')
vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.surfaced.art')
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/api', () => ({
  getFeaturedArtists: vi.fn().mockResolvedValue([]),
}))

import { getFeaturedArtists } from '@/lib/api'
import ArtistsPage, { metadata } from './page'

const mockGetFeaturedArtists = getFeaturedArtists as ReturnType<typeof vi.fn>

describe('Artists Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the page heading', async () => {
    const Component = await ArtistsPage()
    render(Component)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Our Artists')
  })

  it('should render artist cards when API returns data', async () => {
    mockGetFeaturedArtists.mockResolvedValue([
      {
        slug: 'jane-doe',
        displayName: 'Jane Doe',
        location: 'Portland, OR',
        profileImageUrl: null,
        coverImageUrl: null,
        artworkImageUrls: [],
        categories: ['ceramics'],
      },
      {
        slug: 'john-smith',
        displayName: 'John Smith',
        location: 'Brooklyn, NY',
        profileImageUrl: null,
        coverImageUrl: null,
        artworkImageUrls: [],
        categories: ['drawing_painting'],
      },
    ])
    const Component = await ArtistsPage()
    render(Component)
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('John Smith')).toBeInTheDocument()
  })

  it('should handle empty artist list gracefully', async () => {
    mockGetFeaturedArtists.mockResolvedValue([])
    const Component = await ArtistsPage()
    render(Component)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/check back soon/i)).toBeInTheDocument()
  })

  it('should have correct metadata title', () => {
    expect(metadata.title).toContain('Artists')
  })

  it('should have correct metadata description', () => {
    expect(metadata.description).toBeDefined()
    expect(typeof metadata.description).toBe('string')
  })
})
