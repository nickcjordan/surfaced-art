import { describe, it, expect } from 'vitest'
import {
  parseRedditListing,
  filterByKeywords,
  filterByAge,
  filterByScore,
  deduplicatePosts,
  buildSearchUrl,
  extractSnippet,
  DEFAULT_SUBREDDITS,
  DEFAULT_KEYWORDS,
} from '../../src/reddit/reddit-lib.js'
import type { RedditPost } from '../../src/shared/types.js'

// ---------------------------------------------------------------------------
// Sample data matching Reddit's actual JSON structure
// ---------------------------------------------------------------------------

const SAMPLE_REDDIT_RESPONSE = {
  kind: 'Listing',
  data: {
    children: [
      {
        kind: 't3',
        data: {
          title: 'Leaving Etsy after 5 years - where else can I sell?',
          author: 'ceramicmaker42',
          subreddit: 'etsysellers',
          url: 'https://www.reddit.com/r/etsysellers/comments/abc123/leaving_etsy/',
          permalink: '/r/etsysellers/comments/abc123/leaving_etsy/',
          score: 87,
          created_utc: 1709251200, // 2024-03-01
          selftext:
            'I have been selling handmade ceramics on Etsy for 5 years. The fees keep going up and the search algorithm buries my listings. Looking for a curated platform as an alternative.',
          num_comments: 34,
        },
      },
      {
        kind: 't3',
        data: {
          title: 'Best art marketplace for handmade jewelry?',
          author: 'silversmith_jane',
          subreddit: 'artbusiness',
          url: 'https://www.reddit.com/r/artbusiness/comments/def456/best_art_marketplace/',
          permalink: '/r/artbusiness/comments/def456/best_art_marketplace/',
          score: 23,
          created_utc: 1709164800, // 2024-02-29
          selftext: 'I make handmade silver jewelry and want to find a marketplace that values quality over quantity.',
          num_comments: 12,
        },
      },
      {
        kind: 't3',
        data: {
          title: 'New pottery glaze recipe',
          author: 'glazemaster',
          subreddit: 'pottery',
          url: 'https://www.reddit.com/r/pottery/comments/ghi789/new_glaze/',
          permalink: '/r/pottery/comments/ghi789/new_glaze/',
          score: 156,
          created_utc: 1709078400,
          selftext: 'Just figured out the perfect celadon glaze. Here is the recipe...',
          num_comments: 45,
        },
      },
      {
        kind: 't1', // Comment, not a post — should be filtered out
        data: {
          title: '',
          author: 'commenter',
        },
      },
    ],
    after: null,
  },
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('parseRedditListing', () => {
  it('parses valid Reddit listing JSON into RedditPost[]', () => {
    const posts = parseRedditListing(SAMPLE_REDDIT_RESPONSE)
    expect(posts).toHaveLength(3)
    expect(posts[0]).toEqual({
      title: 'Leaving Etsy after 5 years - where else can I sell?',
      author: 'ceramicmaker42',
      subreddit: 'etsysellers',
      url: 'https://www.reddit.com/r/etsysellers/comments/abc123/leaving_etsy/',
      permalink: '/r/etsysellers/comments/abc123/leaving_etsy/',
      score: 87,
      createdUtc: 1709251200,
      selftext: expect.stringContaining('handmade ceramics'),
      numComments: 34,
    })
  })

  it('filters out non-t3 items (comments, etc.)', () => {
    const posts = parseRedditListing(SAMPLE_REDDIT_RESPONSE)
    expect(posts.every((p) => p.author !== 'commenter')).toBe(true)
  })

  it('returns empty array for invalid input', () => {
    expect(parseRedditListing(null)).toEqual([])
    expect(parseRedditListing({})).toEqual([])
    expect(parseRedditListing({ data: {} })).toEqual([])
  })
})

describe('filterByKeywords', () => {
  const posts = parseRedditListing(SAMPLE_REDDIT_RESPONSE)

  it('matches keywords in title (case-insensitive)', () => {
    const result = filterByKeywords(posts, ['leaving Etsy'])
    expect(result).toHaveLength(1)
    expect(result[0]!.author).toBe('ceramicmaker42')
  })

  it('matches keywords in selftext', () => {
    const result = filterByKeywords(posts, ['curated platform'])
    expect(result).toHaveLength(1)
    expect(result[0]!.author).toBe('ceramicmaker42')
  })

  it('matches multiple keywords (OR logic)', () => {
    const result = filterByKeywords(posts, ['leaving Etsy', 'art marketplace'])
    expect(result).toHaveLength(2)
  })

  it('returns empty when no keywords match', () => {
    const result = filterByKeywords(posts, ['blockchain', 'NFT'])
    expect(result).toHaveLength(0)
  })
})

describe('filterByAge', () => {
  const posts: RedditPost[] = [
    { title: 'Recent', author: '', subreddit: '', url: '', permalink: '/a', score: 1, createdUtc: 1709251200, selftext: '', numComments: 0 },
    { title: 'Old', author: '', subreddit: '', url: '', permalink: '/b', score: 1, createdUtc: 1704067200, selftext: '', numComments: 0 }, // 2024-01-01
  ]

  it('filters posts older than maxAgeDays', () => {
    // Use a fixed "now" of 2024-03-02 for deterministic tests
    const nowUnix = 1709337600
    const result = filterByAge(posts, 7, nowUnix)
    expect(result).toHaveLength(1)
    expect(result[0]!.title).toBe('Recent')
  })

  it('includes all posts when maxAgeDays is large', () => {
    const nowUnix = 1709337600
    const result = filterByAge(posts, 365, nowUnix)
    expect(result).toHaveLength(2)
  })
})

describe('filterByScore', () => {
  const posts = parseRedditListing(SAMPLE_REDDIT_RESPONSE)

  it('filters by minimum score', () => {
    const result = filterByScore(posts, 50)
    expect(result).toHaveLength(2)
    expect(result.every((p) => p.score >= 50)).toBe(true)
  })

  it('returns all posts with minScore 0', () => {
    const result = filterByScore(posts, 0)
    expect(result).toHaveLength(3)
  })
})

describe('deduplicatePosts', () => {
  it('removes duplicates by permalink', () => {
    const posts = parseRedditListing(SAMPLE_REDDIT_RESPONSE)
    const withDupe = [...posts, posts[0]!]
    const result = deduplicatePosts(withDupe)
    expect(result).toHaveLength(3)
  })

  it('preserves order (keeps first occurrence)', () => {
    const posts = parseRedditListing(SAMPLE_REDDIT_RESPONSE)
    const result = deduplicatePosts(posts)
    expect(result[0]!.author).toBe('ceramicmaker42')
  })
})

describe('buildSearchUrl', () => {
  it('builds a valid Reddit search URL', () => {
    const url = buildSearchUrl('artbusiness', ['leaving Etsy', 'Etsy alternative'], 'month', 100)
    expect(url).toContain('https://www.reddit.com/r/artbusiness/search.json')
    expect(url).toContain('restrict_sr=on')
    expect(url).toContain('sort=new')
    expect(url).toContain('t=month')
    expect(url).toContain('limit=100')
  })

  it('caps limit at 100', () => {
    const url = buildSearchUrl('art', ['test'], 'week', 500)
    expect(url).toContain('limit=100')
  })

  it('wraps keywords in quotes for phrase matching', () => {
    const url = buildSearchUrl('art', ['leaving Etsy'], 'month', 25)
    // URLSearchParams encodes spaces as + and quotes as %22
    expect(url).toContain('%22leaving+Etsy%22')
  })
})

describe('extractSnippet', () => {
  const longText = 'This is a long post about various topics. Eventually I talk about leaving Etsy because the fees are too high. I want to find a better platform for my handmade goods.'

  it('centers snippet around keyword match', () => {
    const snippet = extractSnippet(longText, ['leaving Etsy'], 80)
    expect(snippet).toContain('leaving Etsy')
    expect(snippet.length).toBeLessThanOrEqual(86) // 80 + "..." prefix/suffix
  })

  it('returns beginning of text when no keyword matches in body', () => {
    const snippet = extractSnippet(longText, ['blockchain'], 50)
    expect(snippet.startsWith('This is')).toBe(true)
    expect(snippet).toContain('...')
  })

  it('returns empty string for empty selftext', () => {
    expect(extractSnippet('', ['test'])).toBe('')
  })

  it('returns full text when shorter than maxLength', () => {
    const snippet = extractSnippet('Short post.', ['test'], 200)
    expect(snippet).toBe('Short post.')
  })

  it('replaces newlines with spaces', () => {
    const snippet = extractSnippet('Line one\n\nLine two', ['Line'], 200)
    expect(snippet).not.toContain('\n')
    expect(snippet).toContain('Line one Line two')
  })
})

describe('defaults', () => {
  it('has sensible default subreddits', () => {
    expect(DEFAULT_SUBREDDITS).toContain('artbusiness')
    expect(DEFAULT_SUBREDDITS).toContain('etsysellers')
    expect(DEFAULT_SUBREDDITS.length).toBeGreaterThan(3)
  })

  it('has sensible default keywords', () => {
    expect(DEFAULT_KEYWORDS).toContain('leaving Etsy')
    expect(DEFAULT_KEYWORDS).toContain('Etsy alternative')
    expect(DEFAULT_KEYWORDS.length).toBeGreaterThan(5)
  })
})
