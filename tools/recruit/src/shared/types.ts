/**
 * Shared types for the artist recruitment automation tools.
 */

// ---------------------------------------------------------------------------
// Surfaced Art categories
// ---------------------------------------------------------------------------

export const SA_CATEGORIES = [
  'Ceramics',
  'Painting',
  'Print',
  'Jewelry',
  'Illustration',
  'Photography',
  'Woodworking',
  'Fibers',
  'Mixed Media',
] as const

export type SACategory = (typeof SA_CATEGORIES)[number]

// ---------------------------------------------------------------------------
// Artist lead (universal output from any discovery tool)
// ---------------------------------------------------------------------------

export type LeadSource = 'art-fair' | 'reddit' | 'etsy' | 'enrichment'

export interface ArtistLead {
  name: string
  category: string | null
  website: string | null
  instagram: string | null
  source: LeadSource
  sourceDetail: string
  notes: string | null
}

// ---------------------------------------------------------------------------
// Notion Artist Pipeline
// ---------------------------------------------------------------------------

export type PipelineStage =
  | 'Identified'
  | 'Contacted'
  | 'Interested'
  | 'Applied'
  | 'Accepted'
  | 'Onboarded'
  | 'Passed'

export type PipelineSource =
  | 'SIL Network'
  | 'Instagram Outreach'
  | 'Artist Referral'
  | 'Inbound'

export interface PipelineEntry {
  id: string
  name: string
  categories: string[]
  stage: PipelineStage
  source: PipelineSource | null
  instagram: string | null
  website: string | null
  notes: string | null
  foundingArtist: boolean
}

// ---------------------------------------------------------------------------
// Reddit
// ---------------------------------------------------------------------------

export interface RedditPost {
  title: string
  author: string
  subreddit: string
  url: string
  permalink: string
  score: number
  createdUtc: number
  selftext: string
  numComments: number
}

// ---------------------------------------------------------------------------
// Etsy
// ---------------------------------------------------------------------------

export interface EtsyShop {
  shopId: number
  shopName: string
  shopOwner: string
  shopUrl: string
  listingTitles: string[]
  priceRangeCents: { min: number; max: number }
  instagram: string | null
  website: string | null
  location: string | null
  numFavorers: number
}

// ---------------------------------------------------------------------------
// Output formatting
// ---------------------------------------------------------------------------

export type OutputFormat = 'table' | 'json' | 'csv'
