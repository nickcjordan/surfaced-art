/**
 * Generate a JSON manifest of all images needed for demo artists.
 *
 * This script reads the demo artist seed data and outputs a manifest file
 * listing every image needed along with an AI generation prompt for each.
 *
 * Usage:
 *   npx tsx scripts/generate-demo-image-manifest.ts
 *
 * Output:
 *   scripts/demo-image-manifest.json
 */

import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { demoArtistConfigs } from '../packages/db/prisma/seed-data/demo'
import { seedKey } from '../packages/db/prisma/seed-data/cdn'

interface ImageEntry {
  artist: string
  slug: string
  type: 'profile' | 'cover' | 'listing-front' | 'listing-angle' | 'process'
  s3Key: string
  localPath: string
  prompt: string
}

const entries: ImageEntry[] = []

for (const config of demoArtistConfigs) {
  const slug = config.profile.slug
  const name = config.profile.displayName
  const cats = config.categories.join(', ')
  const location = config.profile.location

  // Profile image
  entries.push({
    artist: name,
    slug,
    type: 'profile',
    s3Key: `${seedKey(slug, 'profile')}/1200w.webp`,
    localPath: `demo-images/${slug}/profile.webp`,
    prompt: `Professional headshot portrait of a ${cats} artist in their studio. Natural lighting, warm tones, creative environment visible in background. The subject should appear as a working artist. Location feel: ${location}. Editorial style, shallow depth of field.`,
  })

  // Cover image
  entries.push({
    artist: name,
    slug,
    type: 'cover',
    s3Key: `${seedKey(slug, 'cover')}/1200w.webp`,
    localPath: `demo-images/${slug}/cover.webp`,
    prompt: `Wide landscape-format photograph of a ${cats} artist's studio or workspace. Show tools, materials, and works in progress. Clean, well-lit space with natural light. Aspect ratio approximately 3:1 for a banner/cover image. Location feel: ${location}. Editorial interior photography style.`,
  })

  // Process image
  entries.push({
    artist: name,
    slug,
    type: 'process',
    s3Key: `${seedKey(slug, 'process/studio')}/1200w.webp`,
    localPath: `demo-images/${slug}/process-studio.webp`,
    prompt: `Behind-the-scenes photograph of a ${cats} artist's hands at work. Close-up or medium shot showing the making process — tools, materials, work surface. Natural studio lighting. Documentary style, showing authentic craft process.`,
  })

  // Listing images
  for (const listing of config.listings) {
    const listingSlug = listing.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Front image
    entries.push({
      artist: name,
      slug,
      type: 'listing-front',
      s3Key: `${seedKey(slug, `listings/${listingSlug}/front`)}/1200w.webp`,
      localPath: `demo-images/${slug}/listings/${listingSlug}-front.webp`,
      prompt: `Product photograph of: "${listing.title}". ${listing.description} Medium: ${listing.medium}. Shot on a clean, neutral background (white or light grey). Professional product photography with soft, even lighting. Show the full piece straight-on. High resolution, accurate color.`,
    })

    // Angle image
    entries.push({
      artist: name,
      slug,
      type: 'listing-angle',
      s3Key: `${seedKey(slug, `listings/${listingSlug}/angle`)}/1200w.webp`,
      localPath: `demo-images/${slug}/listings/${listingSlug}-angle.webp`,
      prompt: `Product photograph of: "${listing.title}". ${listing.description} Medium: ${listing.medium}. Shot from a three-quarter angle to show depth and dimension. Clean neutral background. Professional product photography. Show texture and surface detail.`,
    })
  }
}

// Summary stats
const stats = {
  totalImages: entries.length,
  byType: {
    profile: entries.filter((e) => e.type === 'profile').length,
    cover: entries.filter((e) => e.type === 'cover').length,
    process: entries.filter((e) => e.type === 'process').length,
    'listing-front': entries.filter((e) => e.type === 'listing-front').length,
    'listing-angle': entries.filter((e) => e.type === 'listing-angle').length,
  },
  artists: demoArtistConfigs.length,
}

const manifest = { stats, images: entries }

const outPath = resolve(__dirname, 'demo-image-manifest.json')
writeFileSync(outPath, JSON.stringify(manifest, null, 2))
console.log(`Wrote ${entries.length} image entries to ${outPath}`)
console.log('Stats:', JSON.stringify(stats, null, 2))
