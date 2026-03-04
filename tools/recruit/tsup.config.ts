import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/art-fair/cli.ts',
    'src/enricher/cli.ts',
    'src/reddit/cli.ts',
    'src/etsy/cli.ts',
  ],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  dts: false,
})
