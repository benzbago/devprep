import { defineConfig } from '@playwright/test';

const baseURL = process.env.DEVPREP_ROUTING_BASE_URL;

if (!baseURL) {
  throw new Error('DEVPREP_ROUTING_BASE_URL is required for routing verification.');
}

export default defineConfig({
  testDir: './e2e',
  testMatch: 'routing.spec.ts',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
});
