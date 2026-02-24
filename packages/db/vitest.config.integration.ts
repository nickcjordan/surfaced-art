import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    extensions: ['.ts', '.js', '.mjs', '.json'],
    conditions: ['node', 'import', 'module', 'default'],
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.integration.test.ts', 'prisma/**/*.integration.test.ts'],
    // Longer timeout for Testcontainers startup
    testTimeout: 60_000,
    hookTimeout: 120_000,
    // Run integration test files sequentially (container per suite)
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
})
