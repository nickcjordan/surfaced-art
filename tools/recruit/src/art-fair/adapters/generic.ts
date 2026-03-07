/**
 * Generic art fair adapter that uses heuristics to extract artist data
 * from arbitrary HTML pages.
 *
 * Strategy:
 * 1. Look for common CSS classes/elements that represent artist listings
 * 2. For each listing element, extract name, medium, website, Instagram
 * 3. Fall back to scanning links and headings if no structured listing found
 */

import * as cheerio from 'cheerio'
import type { FairAdapter } from './types.js'
import type { ArtistLead } from '../../shared/types.js'
import {
  normalizeArtistName,
  guessCategory,
  findArtistWebsite,
  findInstagramUrl,
} from '../art-fair-lib.js'

/** CSS selectors to try for finding artist listing containers. */
const CONTAINER_SELECTORS = [
  '.artist',
  '.exhibitor',
  '.artist-card',
  '.exhibitor-card',
  '.artist-listing',
  '.artist-item',
  '.vendor',
  '.participant',
  '[class*="artist"]',
  '[class*="exhibitor"]',
]

/** Selectors within a container to find the artist name. */
const NAME_SELECTORS = [
  'h1', 'h2', 'h3', 'h4', 'h5',
  '.artist-name',
  '.name',
  'strong',
  'b',
]

/** Selectors for medium/category info within a container. */
const MEDIUM_SELECTORS = [
  '.medium',
  '.category',
  '.media',
  '.art-type',
  '.discipline',
  '.genre',
  'em',
  '.subtitle',
]

export class GenericFairAdapter implements FairAdapter {
  name = 'generic'

  canHandle(): boolean {
    return true // Always returns true — it's the fallback
  }

  extract(html: string, pageUrl: string): ArtistLead[] {
    const $ = cheerio.load(html)
    const fairDomain = new URL(pageUrl).hostname

    // Try structured extraction first
    const structured = this.extractStructured($, fairDomain)
    if (structured.length > 0) return structured

    // Fall back to table extraction
    const fromTable = this.extractFromTable($, fairDomain)
    if (fromTable.length > 0) return fromTable

    // Fall back to list extraction
    return this.extractFromList($, fairDomain)
  }

  private extractStructured(
    $: cheerio.CheerioAPI,
    fairDomain: string,
  ): ArtistLead[] {
    const leads: ArtistLead[] = []

    for (const selector of CONTAINER_SELECTORS) {
      const elements = $(selector)
      if (elements.length < 3) continue // Need at least 3 to be a list

      elements.each((_, el) => {
        const $el = $(el)
        const name = this.extractName($, $el)
        if (!name || name.length < 2) return

        const hrefs: string[] = []
        $el.find('a[href]').each((_, a) => {
          const href = $(a).attr('href')
          if (href) hrefs.push(href)
        })

        const mediumText = this.extractMedium($, $el)

        leads.push({
          name: normalizeArtistName(name),
          category: guessCategory(mediumText ?? ''),
          website: findArtistWebsite(hrefs, fairDomain),
          instagram: findInstagramUrl(hrefs),
          source: 'art-fair',
          sourceDetail: `Fair: ${fairDomain}`,
          notes: mediumText ? `Medium: ${mediumText}` : null,
        })
      })

      if (leads.length > 0) break // Use the first successful selector
    }

    return leads
  }

  private extractFromTable(
    $: cheerio.CheerioAPI,
    fairDomain: string,
  ): ArtistLead[] {
    const leads: ArtistLead[] = []

    $('table').each((_, table) => {
      const rows = $(table).find('tr')
      if (rows.length < 3) return // Need meaningful rows

      rows.each((i, row) => {
        if (i === 0) return // Skip header row
        const cells = $(row).find('td')
        if (cells.length === 0) return

        const firstCell = cells.first()
        const name = firstCell.text().trim()
        if (!name || name.length < 2) return

        const hrefs: string[] = []
        $(row).find('a[href]').each((_, a) => {
          const href = $(a).attr('href')
          if (href) hrefs.push(href)
        })

        const mediumText = cells.length > 1 ? $(cells.get(1)!).text().trim() : null

        leads.push({
          name: normalizeArtistName(name),
          category: guessCategory(mediumText ?? ''),
          website: findArtistWebsite(hrefs, fairDomain),
          instagram: findInstagramUrl(hrefs),
          source: 'art-fair',
          sourceDetail: `Fair: ${fairDomain}`,
          notes: mediumText ? `Medium: ${mediumText}` : null,
        })
      })
    })

    return leads
  }

  private extractFromList(
    $: cheerio.CheerioAPI,
    fairDomain: string,
  ): ArtistLead[] {
    const leads: ArtistLead[] = []

    // Look for lists with multiple items
    $('ul, ol').each((_, list) => {
      const items = $(list).find('> li')
      if (items.length < 5) return // Need at least 5 items to be an artist list

      items.each((_, li) => {
        const $li = $(li)
        const text = $li.text().trim()
        if (!text || text.length < 2) return

        // Try to extract name from the first text node or first child element
        let name = ''
        const link = $li.find('a').first()
        if (link.length > 0) {
          name = link.text().trim()
        } else {
          name = text.split(/[,\-\u2013\u2014|]/)[0]?.trim() ?? text
        }

        if (!name || name.length < 2) return

        const hrefs: string[] = []
        $li.find('a[href]').each((_, a) => {
          const href = $(a).attr('href')
          if (href) hrefs.push(href)
        })

        // The rest of the text after the name may contain medium info
        const remaining = text.replace(name, '').replace(/^[\s,\-\u2013\u2014|]+/, '').trim()

        leads.push({
          name: normalizeArtistName(name),
          category: guessCategory(remaining),
          website: findArtistWebsite(hrefs, fairDomain),
          instagram: findInstagramUrl(hrefs),
          source: 'art-fair',
          sourceDetail: `Fair: ${fairDomain}`,
          notes: remaining ? `Medium: ${remaining}` : null,
        })
      })
    })

    return leads
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractName(_$: cheerio.CheerioAPI, $el: cheerio.Cheerio<any>): string {
    for (const selector of NAME_SELECTORS) {
      const el = $el.find(selector).first()
      if (el.length > 0) {
        const text = el.text().trim()
        if (text) return text
      }
    }
    return $el.text().trim().split('\n')[0]?.trim() ?? ''
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractMedium(_$: cheerio.CheerioAPI, $el: cheerio.Cheerio<any>): string | null {
    for (const selector of MEDIUM_SELECTORS) {
      const el = $el.find(selector).first()
      if (el.length > 0) {
        const text = el.text().trim()
        if (text) return text
      }
    }
    return null
  }
}
