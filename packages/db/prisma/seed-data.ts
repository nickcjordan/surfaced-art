/**
 * Seed data configuration for all artists.
 *
 * This module is imported by both seed.ts (to write to the database) and
 * seed.test.ts (to validate data integrity). Keeping data here as the
 * single source of truth prevents drift between the seed and its tests.
 *
 * Artist data is split into per-file modules under ./seed-data/ for
 * maintainability. This barrel re-exports everything so that existing
 * consumers (seed-logic.ts, seed.ts, seed-safe.ts, seed.test.ts) need
 * no import path changes.
 */

// Re-export types
export type {
  SeedUser,
  SeedProfile,
  SeedCvEntry,
  SeedListing,
  SeedProcessMedia,
  ArtistSeedConfig,
} from './seed-data/types'

// Re-export CDN helpers
export { CDN_BASE, CDN_DEFAULT_WIDTH, cdnUrl, seedKey } from './seed-data/cdn'

// Import artist configs
import { realArtistConfigs } from './seed-data/real'
import { demoArtistConfigs } from './seed-data/demo'

import type { ArtistSeedConfig } from './seed-data/types'

// Exported artist configs — real artists first, then demo
export const artistConfigs: ArtistSeedConfig[] = [
  ...realArtistConfigs,
  ...demoArtistConfigs,
]
