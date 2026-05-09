import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
dotenv.config({ path: '.env.development.local' });
dotenv.config();

export default defineConfig({
  testDir: './tests/performance',
  timeout: 60 * 1000,
  expect: {
    timeout: 60000,
  },
  use: {
    baseURL: 'http://localhost:5173',
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
