import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    // Prisma's generated .ts files use .js extensions in imports (standard
    // ESM convention). Vitest needs to resolve those back to .ts source.
    extensions: ['.ts', '.js', '.mjs', '.json'],
    conditions: ['node', 'import', 'module', 'default'],
  },
  test: {
    globals: true,
    environment: 'node',
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.integration.test.ts'],
  },
})
