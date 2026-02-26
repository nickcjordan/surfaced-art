import { builtinModules } from 'node:module'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  dts: false,
  // Bundle dependencies for Lambda deployment — except sharp (native binaries
  // installed via npm in the Docker image) and Node.js built-ins (resolved at
  // runtime, and bundling them causes "Dynamic require of X is not supported"
  // errors in ESM mode).
  noExternal: [/.*/],
  external: ['sharp', ...builtinModules, ...builtinModules.map((m) => `node:${m}`)],
  minify: true,
  // Emit a single index.js — the Dockerfile copies only this file into
  // the Lambda container. Splitting would create chunk-*.js files that
  // wouldn't be included.
  splitting: false,
})
