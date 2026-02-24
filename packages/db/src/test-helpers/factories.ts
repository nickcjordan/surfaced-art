import { faker } from '@faker-js/faker'
import type { PrismaClient } from '../generated/prisma/client.js'

type CreateTestUserOptions = {
  email?: string
  fullName?: string
  cognitoId?: string
}

/**
 * Create a test user with realistic fake data.
 * Returns the Prisma-created record.
 */
export async function createTestUser(
  prisma: PrismaClient,
  overrides: CreateTestUserOptions = {}
) {
  return prisma.user.create({
    data: {
      cognitoId: overrides.cognitoId ?? faker.string.uuid(),
      email: overrides.email ?? faker.internet.email().toLowerCase(),
      fullName: overrides.fullName ?? faker.person.fullName(),
      avatarUrl: faker.image.avatar(),
    },
  })
}

type CreateTestArtistOptions = {
  userId?: string
  displayName?: string
  slug?: string
  status?: 'pending' | 'approved' | 'suspended'
  categories?: Array<'ceramics' | 'painting' | 'print' | 'jewelry' | 'illustration' | 'photography' | 'woodworking' | 'fibers' | 'mixed_media'>
}

/**
 * Create a test artist profile (and user if userId not provided).
 * Returns the Prisma-created ArtistProfile with user included.
 */
export async function createTestArtist(
  prisma: PrismaClient,
  overrides: CreateTestArtistOptions = {}
) {
  // Create a user if not provided
  let userId = overrides.userId
  if (!userId) {
    const user = await createTestUser(prisma)
    userId = user.id
  }

  const displayName = overrides.displayName ?? faker.person.fullName()
  const slug = overrides.slug ?? faker.helpers.slugify(displayName).toLowerCase()

  const artist = await prisma.artistProfile.create({
    data: {
      userId,
      displayName,
      slug,
      bio: faker.lorem.paragraphs(2),
      location: `${faker.location.city()}, ${faker.location.state({ abbreviated: true })}`,
      websiteUrl: faker.internet.url(),
      instagramUrl: `https://instagram.com/${faker.internet.username()}`,
      originZip: faker.location.zipCode(),
      status: overrides.status ?? 'approved',
      profileImageUrl: faker.image.avatar(),
      coverImageUrl: faker.image.url({ width: 1440, height: 400 }),
      categories: overrides.categories
        ? {
            create: overrides.categories.map((category) => ({ category })),
          }
        : {
            create: [{ category: 'ceramics' }],
          },
    },
    include: {
      user: true,
      categories: true,
    },
  })

  return artist
}

type CreateTestListingOptions = {
  artistId?: string
  title?: string
  category?: 'ceramics' | 'painting' | 'print' | 'jewelry' | 'illustration' | 'photography' | 'woodworking' | 'fibers' | 'mixed_media'
  price?: number
  status?: 'available' | 'reserved_system' | 'reserved_artist' | 'sold'
  withImages?: number
}

/**
 * Create a test listing (and artist if artistId not provided).
 * Returns the Prisma-created Listing with images and artist included.
 */
export async function createTestListing(
  prisma: PrismaClient,
  overrides: CreateTestListingOptions = {}
) {
  // Create an artist if not provided
  let artistId = overrides.artistId
  if (!artistId) {
    const artist = await createTestArtist(prisma)
    artistId = artist.id
  }

  const imageCount = overrides.withImages ?? 2

  const listing = await prisma.listing.create({
    data: {
      artistId,
      title: overrides.title ?? faker.commerce.productName(),
      description: faker.lorem.paragraphs(2),
      medium: faker.helpers.arrayElement([
        'Ceramic',
        'Oil on canvas',
        'Watercolor on paper',
        'Silver and gold',
        'Digital print',
        'Wood and resin',
      ]),
      category: overrides.category ?? 'ceramics',
      price: overrides.price ?? faker.number.int({ min: 5000, max: 200000 }),
      status: overrides.status ?? 'available',
      packedLength: 12.0,
      packedWidth: 12.0,
      packedHeight: 8.0,
      packedWeight: 5.0,
      artworkLength: 10.0,
      artworkWidth: 10.0,
      artworkHeight: 6.0,
      images:
        imageCount > 0
          ? {
              create: Array.from({ length: imageCount }, (_, i) => ({
                url: faker.image.url({ width: 800, height: 800 }),
                sortOrder: i,
              })),
            }
          : undefined,
    },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      artist: {
        include: {
          categories: true,
          user: true,
        },
      },
    },
  })

  return listing
}

/**
 * Create a test waitlist entry.
 */
export async function createTestWaitlistEntry(
  prisma: PrismaClient,
  overrides: { email?: string } = {}
) {
  return prisma.waitlist.create({
    data: {
      email: overrides.email ?? faker.internet.email().toLowerCase(),
    },
  })
}
