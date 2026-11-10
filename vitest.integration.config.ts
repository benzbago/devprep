import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/api/**/*.integration.ts'],
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});
