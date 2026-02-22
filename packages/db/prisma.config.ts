import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Fallback allows prisma generate to run in CI without a live DATABASE_URL.
    // Real connections require DATABASE_URL to be set in the environment.
    url: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/surfaced',
  },
})
