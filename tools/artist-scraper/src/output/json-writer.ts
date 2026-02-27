/**
 * Write ScrapedArtistData as a JSON file.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import type { ScrapedArtistData } from '../types.js'

/**
 * Write the scraped data as a formatted JSON file.
 */
export async function writeJson(
  data: ScrapedArtistData,
  outputDir: string
): Promise<string> {
  await fs.mkdir(outputDir, { recursive: true })
  const filePath = path.join(outputDir, 'scraped-data.json')
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
  return filePath
}
