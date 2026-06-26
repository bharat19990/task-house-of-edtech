import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Vitest configuration.
 * Mirrors tsconfig path aliases so tests resolve `@/*` imports.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
