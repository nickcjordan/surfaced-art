import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  dts: false,
  // Bundle dependencies for Lambda deployment — except sharp which has
  // native binaries that must be installed via npm in the Docker image.
  noExternal: [/.*/],
  external: ['sharp'],
  minify: true,
})
