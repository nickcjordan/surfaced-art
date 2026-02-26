import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'next/link': path.resolve(__dirname, './src/test/mocks/next-link.tsx'),
      'next/image': path.resolve(__dirname, './src/test/mocks/next-image.tsx'),
      'next/cache': path.resolve(__dirname, './src/test/mocks/next-cache.ts'),
    },
  },
})
