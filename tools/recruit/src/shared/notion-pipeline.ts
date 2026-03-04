/**
 * Read/write wrapper for the Notion Artist Pipeline database.
 *
 * Uses the Notion SDK v5 dataSources.query() API with cursor-based pagination.
 */

import { Client } from '@notionhq/client'
import type { ArtistLead, PipelineEntry, PipelineSource, PipelineStage } from './types.js'

const PIPELINE_DATA_SOURCE_ID = '9d3afe4f-6a7d-450a-b669-781415c26583'

/** Map lead sources to Notion pipeline source values. */
const SOURCE_MAP: Record<string, PipelineSource> = {
  'art-fair': 'Instagram Outreach',
  reddit: 'Inbound',
  etsy: 'Instagram Outreach',
  enrichment: 'Instagram Outreach',
}

export interface PipelineFilter {
  stage?: PipelineStage
  /** Only return entries missing one of these fields. */
  missingField?: 'instagram' | 'website'
}

export class NotionPipeline {
  constructor(private client: Client) {}

  /**
   * Query entries from the Artist Pipeline with optional filtering.
   * Handles cursor-based pagination automatically.
   */
  async queryEntries(filter?: PipelineFilter): Promise<PipelineEntry[]> {
    const entries: PipelineEntry[] = []
    let cursor: string | undefined

    const filterConditions: Array<Record<string, unknown>> = []

    if (filter?.stage) {
      filterConditions.push({
        property: 'Stage',
        select: { equals: filter.stage },
      })
    }

    if (filter?.missingField === 'instagram') {
      filterConditions.push({
        property: 'Instagram',
        url: { is_empty: true },
      })
    } else if (filter?.missingField === 'website') {
      filterConditions.push({
        property: 'Website',
        url: { is_empty: true },
      })
    }

    const notionFilter =
      filterConditions.length === 0
        ? undefined
        : filterConditions.length === 1
          ? filterConditions[0]
          : { and: filterConditions }

    do {
      const response = await this.client.dataSources.query({
        data_source_id: PIPELINE_DATA_SOURCE_ID,
        filter: notionFilter as Parameters<
          typeof this.client.dataSources.query
        >[0]['filter'],
        start_cursor: cursor,
        page_size: 100,
      })

      for (const page of response.results) {
        if ('properties' in page) {
          entries.push(
            NotionPipeline.parseRow(page as unknown as Record<string, unknown>)
          )
        }
      }

      cursor = response.has_more
        ? response.next_cursor ?? undefined
        : undefined
    } while (cursor)

    return entries
  }

  /**
   * Check if an artist already exists in the pipeline (case-insensitive name match).
   */
  async findByName(name: string): Promise<PipelineEntry | null> {
    const response = await this.client.dataSources.query({
      data_source_id: PIPELINE_DATA_SOURCE_ID,
      filter: {
        property: 'Name',
        title: { equals: name },
      } as Parameters<typeof this.client.dataSources.query>[0]['filter'],
      page_size: 1,
    })

    for (const page of response.results) {
      if ('properties' in page) {
        return NotionPipeline.parseRow(
          page as unknown as Record<string, unknown>
        )
      }
    }

    return null
  }

  /**
   * Create a new entry in the Artist Pipeline from a discovered lead.
   * Returns the Notion page ID.
   */
  async createEntry(lead: ArtistLead): Promise<string> {
    const properties: Record<string, unknown> = {
      Name: {
        title: [{ text: { content: lead.name } }],
      },
      Stage: {
        select: { name: 'Identified' as PipelineStage },
      },
    }

    if (lead.category) {
      properties.Category = {
        multi_select: [{ name: lead.category }],
      }
    }

    const source = SOURCE_MAP[lead.source]
    if (source) {
      properties.Source = {
        select: { name: source },
      }
    }

    if (lead.instagram) {
      properties.Instagram = { url: lead.instagram }
    }

    if (lead.website) {
      properties.Website = { url: lead.website }
    }

    const notesParts: string[] = []
    if (lead.sourceDetail) notesParts.push(`Source: ${lead.sourceDetail}`)
    if (lead.notes) notesParts.push(lead.notes)
    const notesText = notesParts.join('\n')

    if (notesText) {
      properties.Notes = {
        rich_text: [{ text: { content: notesText } }],
      }
    }

    properties['Founding Artist'] = { checkbox: false }

    const page = await this.client.pages.create({
      parent: { data_source_id: PIPELINE_DATA_SOURCE_ID },
      properties: properties as Parameters<
        typeof this.client.pages.create
      >[0]['properties'],
    })

    return page.id
  }

  /**
   * Update specific fields on an existing pipeline entry.
   */
  async updateEntry(
    pageId: string,
    updates: {
      instagram?: string
      website?: string
      notes?: string
    }
  ): Promise<void> {
    const properties: Record<string, unknown> = {}

    if (updates.instagram) {
      properties.Instagram = { url: updates.instagram }
    }

    if (updates.website) {
      properties.Website = { url: updates.website }
    }

    if (updates.notes) {
      properties.Notes = {
        rich_text: [{ text: { content: updates.notes } }],
      }
    }

    await this.client.pages.update({
      page_id: pageId,
      properties: properties as Parameters<
        typeof this.client.pages.update
      >[0]['properties'],
    })
  }

  /**
   * Parse a raw Notion API page object into a typed PipelineEntry.
   */
  static parseRow(page: Record<string, unknown>): PipelineEntry {
    const props = page.properties as Record<string, Record<string, unknown>>

    // Title (Name column)
    const titleProp = props.Name as { title?: Array<{ plain_text: string }> }
    const name = titleProp?.title?.[0]?.plain_text ?? ''

    // Multi-select (Category)
    const categoryProp = props.Category as {
      multi_select?: Array<{ name: string }>
    }
    const categories =
      categoryProp?.multi_select?.map((s) => s.name) ?? []

    // Select (Stage)
    const stageProp = props.Stage as { select?: { name: string } | null }
    const stage = (stageProp?.select?.name ?? 'Identified') as PipelineStage

    // Select (Source)
    const sourceProp = props.Source as { select?: { name: string } | null }
    const source = (sourceProp?.select?.name ?? null) as PipelineSource | null

    // URL fields
    const instagramProp = props.Instagram as { url?: string | null }
    const instagram = instagramProp?.url ?? null

    const websiteProp = props.Website as { url?: string | null }
    const website = websiteProp?.url ?? null

    // Rich text (Notes)
    const notesProp = props.Notes as {
      rich_text?: Array<{ plain_text: string }>
    }
    const notes = notesProp?.rich_text?.[0]?.plain_text ?? null

    // Checkbox (Founding Artist)
    const foundingProp = props['Founding Artist'] as { checkbox?: boolean }
    const foundingArtist = foundingProp?.checkbox ?? false

    return {
      id: page.id as string,
      name,
      categories,
      stage,
      source,
      instagram,
      website,
      notes,
      foundingArtist,
    }
  }
}
