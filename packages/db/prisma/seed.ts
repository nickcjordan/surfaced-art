import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { artistConfigs, cdnUrl } from './seed-data'
import type { ArtistSeedConfig } from './seed-data'

// Validate DATABASE_URL before attempting connection
if (!process.env.DATABASE_URL) {
  console.error(
    'ERROR: DATABASE_URL environment variable is not set.\n' +
    'Set it in your .env file or export it before running the seed:\n' +
    '  export DATABASE_URL="postgresql://user:password@host:5432/dbname"\n' +
    '  npx prisma db seed'
  )
  process.exit(1)
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})
const prisma = new PrismaClient({ adapter })

// ============================================================================
// Seed function
// ============================================================================

type TransactionClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]

async function seedArtist(tx: TransactionClient, data: ArtistSeedConfig) {
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
    // S3 key: uploads/seed/artists/{slug}/listings/{listing-slug}/front.jpg
    await tx.listingImage.create({
      data: {
        listingId: listing.id,
        url: cdnUrl(`${data.profile.slug}/listings/${listingSlug}/front.jpg`),
        isProcessPhoto: false,
        sortOrder: 0,
      },
    })
    await tx.listingImage.create({
      data: {
        listingId: listing.id,
        url: cdnUrl(`${data.profile.slug}/listings/${listingSlug}/angle.jpg`),
        isProcessPhoto: listingData.isDocumented,
        sortOrder: 1,
      },
    })
  }

  return { user, profile }
}

async function main() {
  console.log('Start seeding...')

  for (const config of artistConfigs) {
    const result = await prisma.$transaction(async (tx) => {
      return seedArtist(tx, config)
    })
    console.log(`  Seeded artist: ${result.profile.displayName} (${result.profile.slug})`)
  }

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
