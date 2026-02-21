import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'], // Lambda requires CommonJS
  target: 'node20',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  dts: false,
  // Bundle dependencies for Lambda deployment
  noExternal: [/.*/],
  // Minify for smaller bundle size
  minify: true,
})
