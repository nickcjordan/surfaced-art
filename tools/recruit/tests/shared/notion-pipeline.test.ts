import { describe, it, expect } from 'vitest'
import { NotionPipeline } from '../../src/shared/notion-pipeline.js'

// Sample Notion page matching the Artist Pipeline schema
const SAMPLE_PAGE = {
  id: 'page-123',
  properties: {
    Name: {
      title: [{ plain_text: 'Jane Ceramicist' }],
    },
    Category: {
      multi_select: [{ name: 'Ceramics' }, { name: 'Mixed Media' }],
    },
    Stage: {
      select: { name: 'Identified' },
    },
    Source: {
      select: { name: 'Instagram Outreach' },
    },
    Instagram: {
      url: 'https://instagram.com/janeceramics',
    },
    Website: {
      url: 'https://janeceramics.com',
    },
    Notes: {
      rich_text: [{ plain_text: 'Great process photos' }],
    },
    'Founding Artist': {
      checkbox: false,
    },
  },
}

const MINIMAL_PAGE = {
  id: 'page-456',
  properties: {
    Name: {
      title: [],
    },
    Category: {
      multi_select: [],
    },
    Stage: {},
    Source: {},
    Instagram: {},
    Website: {},
    Notes: {
      rich_text: [],
    },
    'Founding Artist': {},
  },
}

describe('NotionPipeline.parseRow', () => {
  it('parses a fully populated page', () => {
    const entry = NotionPipeline.parseRow(SAMPLE_PAGE)
    expect(entry).toEqual({
      id: 'page-123',
      name: 'Jane Ceramicist',
      categories: ['Ceramics', 'Mixed Media'],
      stage: 'Identified',
      source: 'Instagram Outreach',
      instagram: 'https://instagram.com/janeceramics',
      website: 'https://janeceramics.com',
      notes: 'Great process photos',
      foundingArtist: false,
    })
  })

  it('handles missing/empty fields gracefully', () => {
    const entry = NotionPipeline.parseRow(MINIMAL_PAGE)
    expect(entry.id).toBe('page-456')
    expect(entry.name).toBe('')
    expect(entry.categories).toEqual([])
    expect(entry.stage).toBe('Identified')
    expect(entry.source).toBeNull()
    expect(entry.instagram).toBeNull()
    expect(entry.website).toBeNull()
    expect(entry.notes).toBeNull()
    expect(entry.foundingArtist).toBe(false)
  })
})
