/**
 * Shared type definitions for seed data configuration.
 *
 * Extracted from seed-data.ts to support a modular file layout.
 */

import type {
  ArtistStatusType,
  CategoryType,
  CvEntryTypeType,
  ListingStatusType,
  ProcessMediaTypeType,
} from '../../src/generated/prisma/client'

export interface SeedUser {
  cognitoId: string
  email: string
  fullName: string
  avatarUrl: string | null
}

export interface SeedProfile {
  displayName: string
  slug: string
  bio: string
  location: string
  websiteUrl: string | null
  instagramUrl: string | null
  originZip: string
  status: ArtistStatusType
  commissionsOpen: boolean
  coverImageUrl: string | null
  profileImageUrl: string | null
  applicationSource: string | null
  isDemo: boolean
}

export interface SeedCvEntry {
  type: CvEntryTypeType
  title: string
  institution: string
  year: number
  sortOrder: number
}

export interface SeedListing {
  title: string
  description: string
  medium: string
  category: CategoryType
  price: number
  status: ListingStatusType
  isDocumented: boolean
  artworkLength: number
  artworkWidth: number
  artworkHeight: number
  packedLength: number
  packedWidth: number
  packedHeight: number
  packedWeight: number
}

export interface SeedProcessMedia {
  type: ProcessMediaTypeType
  url?: string
  sortOrder: number
}

export interface ArtistSeedConfig {
  user: SeedUser
  profile: SeedProfile
  categories: CategoryType[]
  cvEntries: SeedCvEntry[]
  listings: SeedListing[]
  processMedia: SeedProcessMedia[]
}
