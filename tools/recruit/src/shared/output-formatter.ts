/**
 * Format structured data for console output in table, JSON, or CSV format.
 */

import type { OutputFormat } from './types.js'

/**
 * Format an array of objects for console output.
 *
 * @param data - Array of objects to format
 * @param columns - Which keys to include and their display headers
 * @param format - Output format: table, json, or csv
 */
export function formatOutput<T extends Record<string, unknown>>(
  data: T[],
  columns: Array<{ key: keyof T; header: string; width?: number }>,
  format: OutputFormat
): string {
  switch (format) {
    case 'json':
      return formatJson(data)
    case 'csv':
      return formatCsv(data, columns)
    case 'table':
    default:
      return formatTable(data, columns)
  }
}

function formatJson<T>(data: T[]): string {
  return JSON.stringify(data, null, 2)
}

function formatCsv<T extends Record<string, unknown>>(
  data: T[],
  columns: Array<{ key: keyof T; header: string }>
): string {
  const header = columns.map((c) => c.header).join(',')
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const val = String(row[c.key] ?? '')
        // Escape CSV values that contain commas, quotes, or newlines
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`
        }
        return val
      })
      .join(',')
  )
  return [header, ...rows].join('\n')
}

function formatTable<T extends Record<string, unknown>>(
  data: T[],
  columns: Array<{ key: keyof T; header: string; width?: number }>
): string {
  if (data.length === 0) return '(no results)'

  // Calculate column widths
  const widths = columns.map((col) => {
    const headerLen = col.header.length
    const maxDataLen = data.reduce((max, row) => {
      const val = String(row[col.key] ?? '')
      return Math.max(max, val.length)
    }, 0)
    return col.width ?? Math.min(Math.max(headerLen, maxDataLen), 60)
  })

  // Build header row
  const headerRow = columns
    .map((col, i) => col.header.padEnd(widths[i]!))
    .join('  ')
  const separator = widths.map((w) => '-'.repeat(w)).join('  ')

  // Build data rows
  const rows = data.map((row) =>
    columns
      .map((col, i) => {
        const val = String(row[col.key] ?? '')
        return val.length > widths[i]!
          ? val.slice(0, widths[i]! - 1) + '\u2026'
          : val.padEnd(widths[i]!)
      })
      .join('  ')
  )

  return [headerRow, separator, ...rows].join('\n')
}
