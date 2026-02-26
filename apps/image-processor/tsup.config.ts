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
  // installed via npm in the Docker image).
  noExternal: [/.*/],
  external: ['sharp'],
  minify: true,
  // Provides a real require() for esbuild's CJS-to-ESM interop shim.
  // The AWS SDK contains CJS code that calls require("util"), require("stream"),
  // etc. When bundled into ESM, esbuild wraps these in a shim that throws
  // "Dynamic require of X is not supported" because require is undefined in ESM.
  // This banner creates a real require() from import.meta.url so those calls work.
  // Same pattern as apps/api/tsup.config.ts.
  banner: {
    js: "import { createRequire as __cr } from 'module'; var require = __cr(import.meta.url);",
  },
  // Emit a single index.js — the Dockerfile copies only this file into
  // the Lambda container. Splitting would create chunk-*.js files that
  // wouldn't be included.
  splitting: false,
})
