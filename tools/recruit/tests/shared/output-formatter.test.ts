import { describe, it, expect } from 'vitest'
import { formatOutput } from '../../src/shared/output-formatter.js'

const SAMPLE_DATA = [
  { name: 'Alice', score: 42, url: 'https://alice.com' },
  { name: 'Bob', score: 7, url: 'https://bob.dev' },
]

const COLUMNS = [
  { key: 'name' as const, header: 'Name', width: 10 },
  { key: 'score' as const, header: 'Score', width: 6 },
  { key: 'url' as const, header: 'URL', width: 20 },
]

describe('formatOutput', () => {
  describe('json', () => {
    it('returns valid JSON', () => {
      const result = formatOutput(SAMPLE_DATA, COLUMNS, 'json')
      const parsed = JSON.parse(result)
      expect(parsed).toHaveLength(2)
      expect(parsed[0].name).toBe('Alice')
    })
  })

  describe('csv', () => {
    it('produces header row and data rows', () => {
      const result = formatOutput(SAMPLE_DATA, COLUMNS, 'csv')
      const lines = result.split('\n')
      expect(lines[0]).toBe('Name,Score,URL')
      expect(lines[1]).toBe('Alice,42,https://alice.com')
      expect(lines[2]).toBe('Bob,7,https://bob.dev')
    })

    it('escapes values with commas', () => {
      const data = [{ name: 'Smith, Jr.', score: 1, url: 'x' }]
      const result = formatOutput(data, COLUMNS, 'csv')
      expect(result).toContain('"Smith, Jr."')
    })

    it('escapes values with quotes', () => {
      const data = [{ name: 'He said "hi"', score: 1, url: 'x' }]
      const result = formatOutput(data, COLUMNS, 'csv')
      expect(result).toContain('"He said ""hi"""')
    })
  })

  describe('table', () => {
    it('produces aligned columns', () => {
      const result = formatOutput(SAMPLE_DATA, COLUMNS, 'table')
      const lines = result.split('\n')
      expect(lines[0]).toContain('Name')
      expect(lines[0]).toContain('Score')
      expect(lines[0]).toContain('URL')
      // Separator line
      expect(lines[1]).toMatch(/^-+/)
      // Data rows
      expect(lines[2]).toContain('Alice')
      expect(lines[3]).toContain('Bob')
    })

    it('truncates long values with ellipsis', () => {
      const data = [{ name: 'A very long name that exceeds width', score: 1, url: 'x' }]
      const result = formatOutput(data, COLUMNS, 'table')
      const dataLine = result.split('\n')[2]!
      // Name column width is 10, so should be truncated
      expect(dataLine.slice(0, 10)).toContain('\u2026')
    })

    it('returns "(no results)" for empty data', () => {
      const result = formatOutput([], COLUMNS, 'table')
      expect(result).toBe('(no results)')
    })
  })
})
