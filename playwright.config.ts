import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/performance',
  timeout: 60 * 1000,
  expect: {
    timeout: 60000,
  },
  use: {
    headless: true,
    launchOptions: {
      args: [
        '--use-gl=desktop', // Sử dụng GPU thực của máy thay vì giả lập
        '--enable-webgl', // Bật WebGL
        '--hide-scrollbars',
        '--mute-audio',
        '--no-sandbox',
      ],
    },
  },
});
