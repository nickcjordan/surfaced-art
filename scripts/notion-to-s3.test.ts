/**
 * Tests for the Notion-to-S3 upload script.
 *
 * Tests cover:
 *   - S3 upload key derivation from Notion S3 Key field
 *   - Content-type detection from source image URLs
 *   - Notion row parsing / filtering
 *   - Dry-run and idempotency logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  deriveUploadKey,
  detectContentType,
  parseNotionRow,
  type NotionImageRow,
} from './notion-to-s3-lib.js'

// ---------------------------------------------------------------------------
// deriveUploadKey
// ---------------------------------------------------------------------------

describe('deriveUploadKey', () => {
  it('strips /{width}w.webp and appends the source extension', () => {
    const s3Key = 'uploads/seed/artists/elena-cordova/profile/1200w.webp'
    expect(deriveUploadKey(s3Key, '.png')).toBe(
      'uploads/seed/artists/elena-cordova/profile.png'
    )
  })

  it('works with 400w variant', () => {
    const s3Key = 'uploads/seed/artists/elena-cordova/cover/400w.webp'
    expect(deriveUploadKey(s3Key, '.jpg')).toBe(
      'uploads/seed/artists/elena-cordova/cover.jpg'
    )
  })

  it('works with 800w variant', () => {
    const s3Key = 'uploads/seed/artists/elena-cordova/process/studio/800w.webp'
    expect(deriveUploadKey(s3Key, '.png')).toBe(
      'uploads/seed/artists/elena-cordova/process/studio.png'
    )
  })

  it('handles listing front images', () => {
    const s3Key =
      'uploads/seed/artists/elena-cordova/listings/acequia-study-no-3/front/1200w.webp'
    expect(deriveUploadKey(s3Key, '.png')).toBe(
      'uploads/seed/artists/elena-cordova/listings/acequia-study-no-3/front.png'
    )
  })

  it('handles listing angle images', () => {
    const s3Key =
      'uploads/seed/artists/james-okafor/listings/market-day-chorus/angle/1200w.webp'
    expect(deriveUploadKey(s3Key, '.jpg')).toBe(
      'uploads/seed/artists/james-okafor/listings/market-day-chorus/angle.jpg'
    )
  })

  it('throws if the key does not end with a width variant pattern', () => {
    expect(() => deriveUploadKey('uploads/seed/artists/foo/bar.png', '.png')).toThrow()
  })
})

// ---------------------------------------------------------------------------
// detectContentType
// ---------------------------------------------------------------------------

describe('detectContentType', () => {
  it('detects PNG from URL path', () => {
    const url = 'https://prod-files.notion.so/abc123/image.png?X-Amz-Signature=xxx'
    expect(detectContentType(url)).toEqual({
      contentType: 'image/png',
      extension: '.png',
    })
  })

  it('detects JPEG from .jpg URL path', () => {
    const url = 'https://prod-files.notion.so/abc123/photo.jpg?sig=abc'
    expect(detectContentType(url)).toEqual({
      contentType: 'image/jpeg',
      extension: '.jpg',
    })
  })

  it('detects JPEG from .jpeg URL path', () => {
    const url = 'https://prod-files.notion.so/abc123/photo.jpeg?sig=abc'
    expect(detectContentType(url)).toEqual({
      contentType: 'image/jpeg',
      extension: '.jpeg',
    })
  })

  it('detects WebP from URL path', () => {
    const url = 'https://prod-files.notion.so/abc123/image.webp?sig=abc'
    expect(detectContentType(url)).toEqual({
      contentType: 'image/webp',
      extension: '.webp',
    })
  })

  it('defaults to PNG when extension is unrecognized', () => {
    const url = 'https://prod-files.notion.so/abc123/file?sig=abc'
    expect(detectContentType(url)).toEqual({
      contentType: 'image/png',
      extension: '.png',
    })
  })
})

// ---------------------------------------------------------------------------
// parseNotionRow
// ---------------------------------------------------------------------------

describe('parseNotionRow', () => {
  const makeRow = (overrides: Record<string, unknown> = {}) => ({
    id: 'row-id-123',
    properties: {
      Image: {
        type: 'title' as const,
        title: [{ plain_text: 'Elena Cordova — Profile' }],
      },
      Artist: {
        type: 'select' as const,
        select: { name: 'Elena Cordova' },
      },
      Type: {
        type: 'select' as const,
        select: { name: 'profile' },
      },
      Done: {
        type: 'checkbox' as const,
        checkbox: true,
      },
      'S3 Key': {
        type: 'rich_text' as const,
        rich_text: [
          {
            plain_text:
              'uploads/seed/artists/elena-cordova/profile/1200w.webp',
          },
        ],
      },
      'Generated Image': {
        type: 'files' as const,
        files: [
          {
            type: 'file' as const,
            name: 'elena-profile.png',
            file: {
              url: 'https://prod-files.notion.so/abc/elena-profile.png?sig=xyz',
              expiry_time: '2026-03-03T12:00:00.000Z',
            },
          },
        ],
      },
      Prompt: {
        type: 'rich_text' as const,
        rich_text: [{ plain_text: 'A portrait prompt...' }],
      },
      ...overrides,
    },
  })

  it('parses a valid Done row with all fields', () => {
    const result = parseNotionRow(makeRow() as unknown as Record<string, unknown>)
    expect(result).toEqual({
      id: 'row-id-123',
      imageName: 'Elena Cordova — Profile',
      artist: 'Elena Cordova',
      type: 'profile',
      done: true,
      s3Key: 'uploads/seed/artists/elena-cordova/profile/1200w.webp',
      fileUrl:
        'https://prod-files.notion.so/abc/elena-profile.png?sig=xyz',
      fileName: 'elena-profile.png',
    })
  })

  it('returns null fileUrl when Done is false', () => {
    const row = makeRow({
      Done: { type: 'checkbox', checkbox: false },
      'Generated Image': { type: 'files', files: [] },
    })
    const result = parseNotionRow(row as unknown as Record<string, unknown>)
    expect(result.done).toBe(false)
    expect(result.fileUrl).toBeNull()
  })

  it('returns null fileUrl when no files are attached', () => {
    const row = makeRow({
      'Generated Image': { type: 'files', files: [] },
    })
    const result = parseNotionRow(row as unknown as Record<string, unknown>)
    expect(result.fileUrl).toBeNull()
  })

  it('handles external file type (Notion external URL)', () => {
    const row = makeRow({
      'Generated Image': {
        type: 'files',
        files: [
          {
            type: 'external',
            name: 'elena-profile.png',
            external: {
              url: 'https://example.com/elena-profile.png',
            },
          },
        ],
      },
    })
    const result = parseNotionRow(row as unknown as Record<string, unknown>)
    expect(result.fileUrl).toBe('https://example.com/elena-profile.png')
    expect(result.fileName).toBe('elena-profile.png')
  })

  it('returns empty s3Key when field is missing', () => {
    const row = makeRow({
      'S3 Key': { type: 'rich_text', rich_text: [] },
    })
    const result = parseNotionRow(row as unknown as Record<string, unknown>)
    expect(result.s3Key).toBe('')
  })
})
