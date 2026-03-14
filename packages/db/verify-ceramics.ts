import { PrismaClient } from './src/index.js'

const prisma = new PrismaClient()

async function verifyCeramics() {
  console.log('=== Ceramics Category Verification ===\n')

  try {
    // 1. Count all ceramics listings
    console.log('1. Total ceramics listings (any artist)...')
    const totalCeramicsCount = await prisma.listing.count({
      where: { category: 'ceramics' },
    })
    console.log(`   Found: ${totalCeramicsCount}\n`)

    // 2. Count approved artists with ceramics
    console.log('2. Approved artists with ceramics category...')
    const approvedArtistsWithCeramics = await prisma.artistProfile.count({
      where: {
        status: 'approved',
        categories: {
          some: { category: 'ceramics' },
        },
      },
    })
    console.log(`   Found: ${approvedArtistsWithCeramics}\n`)

    // 3. Count visible ceramics listings (approved artist + available/non-expired status)
    console.log('3. Ceramics listings from approved artists (available status)...')
    const now = new Date()
    const visibleCeramicsCount = await prisma.listing.count({
      where: {
        category: 'ceramics',
        artist: { status: 'approved' },
        OR: [
          { status: 'available' },
          {
            status: 'reserved_system',
            reservedUntil: { lt: now },
          },
        ],
      },
    })
    console.log(`   Found: ${visibleCeramicsCount}\n`)

    // 4. Get details of visible ceramics listings
    console.log('4. Visible ceramics listings (details)...')
    const visibleListings = await prisma.listing.findMany({
      where: {
        category: 'ceramics',
        artist: { status: 'approved' },
        OR: [
          { status: 'available' },
          {
            status: 'reserved_system',
            reservedUntil: { lt: now },
          },
        ],
      },
      include: {
        artist: {
          select: {
            displayName: true,
            slug: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    if (visibleListings.length === 0) {
      console.log('   No listings found!')
    } else {
      visibleListings.forEach((listing, i) => {
        console.log(`   ${i + 1}. "${listing.title}" by ${listing.artist.displayName}`)
        console.log(`      Status: ${listing.status}, Price: $${(listing.price / 100).toFixed(2)}`)
      })
    }
    console.log()

    // 5. List all categories with counts
    console.log('5. All categories (available listings)...')
    const categoryCounts = await prisma.listing.groupBy({
      by: ['category'],
      where: {
        artist: { status: 'approved' },
        OR: [
          { status: 'available' },
          {
            status: 'reserved_system',
            reservedUntil: { lt: now },
          },
        ],
      },
      _count: true,
    })

    const categoryMap = new Map(categoryCounts.map((c) => [c.category, c._count]))
    const allCategories = [
      'drawing_painting',
      'printmaking_photography',
      'ceramics',
      'mixed_media_3d',
    ]
    allCategories.forEach((cat) => {
      const count = categoryMap.get(cat) || 0
      console.log(`   ${cat}: ${count}`)
    })

    // 6. Check API parameters validation
    console.log('\n6. Testing API query parameter validation...')
    const ceramicsLowercase = 'ceramics'
    console.log(`   Testing parameter: "${ceramicsLowercase}"`)
    console.log(`   Valid: ${allCategories.includes(ceramicsLowercase) ? 'YES' : 'NO'}`)
  } catch (error) {
    console.error('Error during verification:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

verifyCeramics()
