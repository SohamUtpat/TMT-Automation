import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, 'playwright/.auth/admin.json');

export default defineConfig({
  testDir: './Admin',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Use 1 worker unless you have separate admin accounts per worker.
  // This app logs out duplicate sessions for the same user (4 workers = flaky Groups tests).
  workers: Number(process.env.PW_WORKERS ?? 2),
  timeout: 180_000,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://18.142.102.68',
    navigationTimeout: 120_000,
    actionTimeout: 30_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'login',
      testMatch: /Login\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium',
      testIgnore: [/Login\/.*\.spec\.ts/, /auth\.setup\.ts/],
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
    },
  ],
});
