import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/performance',
  timeout: 60 * 1000,
  expect: {
    timeout: 60000,
  },
  use: {
    headless: true,
  },
});
