import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  dts: false,
  // Bundle dependencies for Lambda deployment
  noExternal: [/.*/],
  // Minify for smaller bundle size
  minify: true,
  // Provides a real require() for esbuild's CJS-to-ESM interop shim.
  // Needed because @prisma/client/runtime and pg sub-deps are CJS.
  // See: https://github.com/evanw/esbuild/issues/1921
  // See: https://github.com/prisma/prisma/issues/28126
  banner: {
    js: "import { createRequire as __cr } from 'module'; var require = __cr(import.meta.url);",
  },
})
