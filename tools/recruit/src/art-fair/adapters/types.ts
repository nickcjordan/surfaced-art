/**
 * Adapter interface for art fair website scrapers.
 *
 * Each adapter knows how to extract artist data from a specific fair's HTML.
 * The generic adapter uses heuristics for unknown sites.
 */

import type { ArtistLead } from '../../shared/types.js'

export interface FairAdapter {
  /** Human-readable adapter name. */
  name: string

  /** Test whether this adapter can handle the given URL. */
  canHandle(url: string): boolean

  /** Extract artist entries from the HTML content. */
  extract(html: string, pageUrl: string): ArtistLead[]
}
