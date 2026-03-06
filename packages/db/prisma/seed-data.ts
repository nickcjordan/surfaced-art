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

// Re-export for direct access when needed
export { realArtistConfigs } from './seed-data/real'
export { demoArtistConfigs } from './seed-data/demo'

/**
 * Select artist configs based on SEED_MODE environment variable.
 *
 *   SEED_MODE=real  → only real artists (production)
 *   SEED_MODE=demo  → only demo artists (dev/staging)
 *   SEED_MODE=all   → both (default, backward compatible)
 *   unset           → both (backward compatible)
 */
function getArtistConfigs(): ArtistSeedConfig[] {
  const mode = process.env.SEED_MODE?.toLowerCase()

  switch (mode) {
    case 'real':
      return [...realArtistConfigs]
    case 'demo':
      return [...demoArtistConfigs]
    case 'all':
    case undefined:
    case '':
      return [...realArtistConfigs, ...demoArtistConfigs]
    default:
      throw new Error(
        `Invalid SEED_MODE="${process.env.SEED_MODE}". Must be "real", "demo", or "all".`
      )
  }
}

export const artistConfigs: ArtistSeedConfig[] = getArtistConfigs()
