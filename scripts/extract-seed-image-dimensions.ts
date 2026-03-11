/**
 * One-time utility: fetch actual image dimensions from CloudFront CDN
 * for all seed listing images and output a JSON lookup.
 *
 * Usage:
 *   npx tsx scripts/extract-seed-image-dimensions.ts
 *   npx tsx scripts/extract-seed-image-dimensions.ts --cdn https://dmfu4c7s6z2cc.cloudfront.net
 *
 * Output: scripts/seed-image-dimensions.json
 */
import { readImageDimensions } from '@surfaced-art/utils'
import { demoArtistConfigs } from '../packages/db/prisma/seed-data/demo'
import { realArtistConfigs } from '../packages/db/prisma/seed-data/real'
import fs from 'node:fs'

const CDN_BASE =
  process.argv.find((a) => a.startsWith('--cdn='))?.split('=')[1] ??
  (process.argv.includes('--prod')
    ? 'https://dmfu4c7s6z2cc.cloudfront.net'
    : 'https://d2agn4aoo0e7ji.cloudfront.net')

interface DimensionEntry {
  artistSlug: string
  listingSlug: string
  angle: string
  width: number
  height: number
  url: string
}

function listingSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function fetchDimensions(url: string): Promise<{ width: number; height: number } | null> {
  try {
    const resp = await fetch(url)
    if (!resp.ok) {
      console.warn(`  SKIP (HTTP ${resp.status}): ${url}`)
      return null
    }
    const buf = Buffer.from(await resp.arrayBuffer())
    return readImageDimensions(buf)
  } catch (err) {
    console.warn(`  SKIP (fetch error): ${url} — ${err instanceof Error ? err.message : err}`)
    return null
  }
}

async function main() {
  const allConfigs = [...demoArtistConfigs, ...realArtistConfigs]
  const results: DimensionEntry[] = []
  let skipped = 0

  for (const config of allConfigs) {
    const slug = config.profile.slug
    console.log(`\n${config.profile.displayName} (${slug})`)

    for (const listing of config.listings) {
      const lSlug = listingSlug(listing.title)
      const base = `uploads/seed/artists/${slug}/listings/${lSlug}`

      for (const angle of ['front', 'angle']) {
        const url = `${CDN_BASE}/${base}/${angle}/1200w.webp`
        process.stdout.write(`  ${lSlug}/${angle}...`)
        const dims = await fetchDimensions(url)
        if (dims) {
          console.log(` ${dims.width}x${dims.height}`)
          results.push({ artistSlug: slug, listingSlug: lSlug, angle, ...dims, url })
        } else {
          console.log(' SKIPPED')
          skipped++
        }
      }
    }
  }

  // Write full results
  const outPath = 'scripts/seed-image-dimensions.json'
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2))
  console.log(`\nWrote ${results.length} entries to ${outPath} (${skipped} skipped)`)

  // Also write a compact lookup by artistSlug/listingSlug (front image only)
  const lookup: Record<string, { width: number; height: number }> = {}
  for (const entry of results) {
    if (entry.angle === 'front') {
      lookup[`${entry.artistSlug}/${entry.listingSlug}`] = { width: entry.width, height: entry.height }
    }
  }
  const lookupPath = 'scripts/seed-image-dimensions-lookup.json'
  fs.writeFileSync(lookupPath, JSON.stringify(lookup, null, 2))
  console.log(`Wrote ${Object.keys(lookup).length} front-image entries to ${lookupPath}`)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
