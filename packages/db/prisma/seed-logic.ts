/**
 * Shared seed logic used by both seed.ts (local dev) and seed-safe.ts (Lambda).
 *
 * This module contains the pure seeding functions without any entrypoint
 * side effects, so it can be imported safely by multiple scripts.
 */
import type { PrismaClient } from '../src/generated/prisma/client'
import { cdnUrl, seedKey } from './seed-data'
import type { ArtistSeedConfig } from './seed-data'

type TransactionClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]

/**
 * Derives image pixel dimensions from artwork physical proportions.
 *
 * Product photos of artwork closely match the artwork's aspect ratio,
 * so we scale the physical dimensions (artworkLength × artworkWidth) to
 * pixel dimensions with the longest side at `maxPixels`.
 *
 * @param artworkLength - Physical height of the artwork (inches)
 * @param artworkWidth - Physical width of the artwork (inches)
 * @param maxPixels - Maximum pixel dimension for the longest side (default 1200)
 */
export function artworkToImageDimensions(
  artworkLength: number,
  artworkWidth: number,
  maxPixels = 1200
): { width: number; height: number } {
  const longest = Math.max(artworkLength, artworkWidth)
  const scale = maxPixels / longest
  return {
    width: Math.round(artworkWidth * scale),
    height: Math.round(artworkLength * scale),
  }
}

export async function seedArtist(tx: TransactionClient, data: ArtistSeedConfig) {
  // Upsert user
  const user = await tx.user.upsert({
    where: { email: data.user.email },
    update: {
      cognitoId: data.user.cognitoId,
      fullName: data.user.fullName,
      avatarUrl: data.user.avatarUrl,
    },
    create: data.user,
  })

  // Upsert buyer role
  await tx.userRole.upsert({
    where: { userId_role: { userId: user.id, role: 'buyer' } },
    update: {},
    create: { userId: user.id, role: 'buyer' },
  })

  // Upsert artist role
  await tx.userRole.upsert({
    where: { userId_role: { userId: user.id, role: 'artist' } },
    update: {},
    create: { userId: user.id, role: 'artist' },
  })

  // Upsert artist profile
  const profile = await tx.artistProfile.upsert({
    where: { userId: user.id },
    update: {
      displayName: data.profile.displayName,
      slug: data.profile.slug,
      bio: data.profile.bio,
      location: data.profile.location,
      websiteUrl: data.profile.websiteUrl,
      instagramUrl: data.profile.instagramUrl,
      originZip: data.profile.originZip,
      status: data.profile.status,
      commissionsOpen: data.profile.commissionsOpen,
      coverImageUrl: data.profile.coverImageUrl,
      profileImageUrl: data.profile.profileImageUrl,
      applicationSource: data.profile.applicationSource,
      isDemo: data.profile.isDemo,
    },
    create: {
      userId: user.id,
      ...data.profile,
    },
  })

  // Delete and re-create categories (no unique constraint on individual entries to upsert on)
  await tx.artistCategory.deleteMany({ where: { artistId: profile.id } })
  for (const category of data.categories) {
    await tx.artistCategory.create({
      data: { artistId: profile.id, category },
    })
  }

  // Delete and re-create CV entries
  await tx.artistCvEntry.deleteMany({ where: { artistId: profile.id } })
  for (const entry of data.cvEntries) {
    await tx.artistCvEntry.create({
      data: { artistId: profile.id, ...entry },
    })
  }

  // Delete and re-create process media
  await tx.artistProcessMedia.deleteMany({ where: { artistId: profile.id } })
  for (const media of data.processMedia) {
    await tx.artistProcessMedia.create({
      data: { artistId: profile.id, ...media },
    })
  }

  // Delete and re-create listings (and their images cascade)
  await tx.listing.deleteMany({ where: { artistId: profile.id } })
  for (const listingData of data.listings) {
    const listingSlug = listingData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const listing = await tx.listing.create({
      data: {
        artistId: profile.id,
        type: 'standard',
        title: listingData.title,
        description: listingData.description,
        medium: listingData.medium,
        category: listingData.category,
        price: listingData.price,
        status: listingData.status,
        isDocumented: listingData.isDocumented,
        quantityTotal: 1,
        quantityRemaining: listingData.status === 'available' ? 1 : 0,
        artworkLength: listingData.artworkLength,
        artworkWidth: listingData.artworkWidth,
        artworkHeight: listingData.artworkHeight,
        packedLength: listingData.packedLength,
        packedWidth: listingData.packedWidth,
        packedHeight: listingData.packedHeight,
        packedWeight: listingData.packedWeight,
      },
    })

    // Create 2 images per listing: primary + one additional angle
    // For documented listings, second image is a process photo
    const listingImageBase = `${seedKey(data.profile.slug, 'listings')}/${listingSlug}`
    const imageDimensions = artworkToImageDimensions(listingData.artworkLength, listingData.artworkWidth)
    await tx.listingImage.create({
      data: {
        listingId: listing.id,
        url: cdnUrl(`${listingImageBase}/front`),
        isProcessPhoto: false,
        sortOrder: 0,
        width: imageDimensions.width,
        height: imageDimensions.height,
      },
    })
    await tx.listingImage.create({
      data: {
        listingId: listing.id,
        url: cdnUrl(`${listingImageBase}/angle`),
        isProcessPhoto: listingData.isDocumented,
        sortOrder: 1,
        width: imageDimensions.width,
        height: imageDimensions.height,
      },
    })
  }

  return { user, profile }
}
