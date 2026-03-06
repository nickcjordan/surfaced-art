import type { PrismaClient } from '@surfaced-art/db'
import type {
  DashboardResponse,
  MyListingImageResponse,
  MyListingListItem,
  ProfileCompletionField,
} from '@surfaced-art/types'

function formatListingImage(img: {
  id: string; url: string; isProcessPhoto: boolean; sortOrder: number;
  width: number | null; height: number | null; createdAt: Date
}): MyListingImageResponse {
  return {
    id: img.id,
    url: img.url,
    isProcessPhoto: img.isProcessPhoto,
    sortOrder: img.sortOrder,
    width: img.width,
    height: img.height,
    createdAt: img.createdAt.toISOString(),
  }
}

export function formatListingListItem(listing: {
  id: string; type: string; title: string; medium: string; category: string;
  price: number; status: string; isDocumented: boolean;
  quantityTotal: number; quantityRemaining: number;
  createdAt: Date; updatedAt: Date;
  images: { id: string; url: string; isProcessPhoto: boolean; sortOrder: number; width: number | null; height: number | null; createdAt: Date }[];
}): MyListingListItem {
  const firstImage = listing.images[0]
  const primaryImage = firstImage ? formatListingImage(firstImage) : null
  return {
    id: listing.id,
    type: listing.type as MyListingListItem['type'],
    title: listing.title,
    medium: listing.medium,
    category: listing.category as MyListingListItem['category'],
    price: listing.price,
    status: listing.status as MyListingListItem['status'],
    isDocumented: listing.isDocumented,
    quantityTotal: listing.quantityTotal,
    quantityRemaining: listing.quantityRemaining,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
    primaryImage,
  }
}

/**
 * Fetch an artist's dashboard data by userId.
 * Returns null if the user has no artist profile.
 */
export async function fetchDashboard(
  prisma: PrismaClient,
  userId: string,
): Promise<DashboardResponse | null> {
  const artist = await prisma.artistProfile.findUnique({
    where: { userId },
    include: { categories: true, cvEntries: true },
  })

  if (!artist) return null

  const [totalListings, availableListings, soldListings] = await Promise.all([
    prisma.listing.count({ where: { artistId: artist.id } }),
    prisma.listing.count({ where: { artistId: artist.id, status: 'available' } }),
    prisma.listing.count({ where: { artistId: artist.id, status: 'sold' } }),
  ])

  const fields: ProfileCompletionField[] = [
    { label: 'Bio', complete: artist.bio.trim().length > 0 },
    { label: 'Location', complete: artist.location.trim().length > 0 },
    { label: 'Profile image', complete: artist.profileImageUrl !== null },
    { label: 'Cover image', complete: artist.coverImageUrl !== null },
    { label: 'At least 1 category', complete: artist.categories.length > 0 },
    { label: 'At least 1 CV entry', complete: artist.cvEntries.length > 0 },
  ]

  const completedCount = fields.filter((f) => f.complete).length
  const percentage = Math.round((completedCount / fields.length) * 100)

  return {
    profile: {
      id: artist.id,
      displayName: artist.displayName,
      slug: artist.slug,
      bio: artist.bio,
      location: artist.location,
      websiteUrl: artist.websiteUrl,
      instagramUrl: artist.instagramUrl,
      profileImageUrl: artist.profileImageUrl,
      coverImageUrl: artist.coverImageUrl,
      status: artist.status,
      stripeAccountId: artist.stripeAccountId,
      categories: artist.categories.map((c) => c.category),
    },
    completion: { percentage, fields },
    stats: {
      totalListings,
      availableListings,
      soldListings,
      totalViews: 0,
    },
  }
}

/**
 * Fetch paginated listings for a given artist (by userId).
 * Returns null if the user has no artist profile.
 */
export async function fetchUserListings(
  prisma: PrismaClient,
  userId: string,
  opts: { page: number; limit: number; status?: string; category?: string },
): Promise<{ data: MyListingListItem[]; meta: { page: number; limit: number; total: number; totalPages: number }; artistId: string } | null> {
  const artist = await prisma.artistProfile.findUnique({
    where: { userId },
  })

  if (!artist) return null

  const where: Record<string, unknown> = { artistId: artist.id }
  if (opts.status) where.status = opts.status
  if (opts.category) where.category = opts.category

  const [total, listings] = await Promise.all([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      include: { images: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
      skip: (opts.page - 1) * opts.limit,
      take: opts.limit,
    }),
  ])

  const data: MyListingListItem[] = listings.map((listing) => formatListingListItem(listing))

  return {
    data,
    meta: {
      page: opts.page,
      limit: opts.limit,
      total,
      totalPages: Math.ceil(total / opts.limit) || 1,
    },
    artistId: artist.id,
  }
}
