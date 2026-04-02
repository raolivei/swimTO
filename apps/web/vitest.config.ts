import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    // Only run unit/component tests — Playwright E2E specs live in src/tests/
    // and are run separately via `npm run test:e2e`
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['src/tests/**', '**/node_modules/**', '**/dist/**'],
    passWithNoTests: true,
    css: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

