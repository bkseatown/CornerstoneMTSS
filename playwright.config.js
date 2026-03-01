// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:4173';

module.exports = defineConfig({
  testDir: './tests',
  timeout: 45000,
  retries: 0,
  reporter: 'line',
  use: {
    baseURL: BASE_URL,
    screenshot: 'on',
    trace: 'on',
    video: 'off'
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        browserName: 'chromium'
      }
    }
  ]
});
