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
  // Provide CJS globals (__dirname, __filename) for bundled dependencies.
  shims: true,
  // esbuild's CJS-to-ESM interop emits a `require` proxy that throws at
  // runtime because `require` doesn't exist in ESM scope. Provide a real
  // `require` via Node's createRequire so bundled CJS code can load Node
  // builtins (path, fs, etc.).
  banner: {
    js: "import { createRequire as __cr } from 'module'; var require = __cr(import.meta.url);",
  },
})
