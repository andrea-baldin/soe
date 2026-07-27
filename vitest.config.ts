import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      '@soe/core': fileURLToPath(
        new URL('./packages/core/src/index.ts', import.meta.url)
      )
    },
    conditions: ['browser']
  },
  test: {
    coverage: {
      reporter: ['text', 'html']
    },
    environment: 'jsdom',
    include: ['packages/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts']
  }
});
