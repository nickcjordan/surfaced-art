import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { artistConfigs } from './seed-data'
import { seedArtist } from './seed-logic'

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

async function main() {
  const mode = process.env.SEED_MODE || 'all'
  console.log(`Start seeding... (SEED_MODE=${mode}, ${artistConfigs.length} artists)`)

  for (const config of artistConfigs) {
    const result = await prisma.$transaction(async (tx) => {
      return seedArtist(tx, config)
    }, { timeout: 30000 })
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
