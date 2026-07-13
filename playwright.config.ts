import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { getBaseUrl } from './Admin/config/appConfig';

const authFile = path.join(__dirname, 'playwright/.auth/admin.json');

export default defineConfig({
  testDir: './Admin',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Default 1 worker: the app invalidates duplicate sessions for the same admin user.
  // Set PW_WORKERS=2+ only when separate admin accounts are configured per worker.
  workers: Number(process.env.PW_WORKERS ?? 1),
  timeout: 120_000,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: getBaseUrl(),
    navigationTimeout: 300_000,
    actionTimeout: 30_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      // Slow bundle.js can take ~3+ minutes; allow full login + dashboard.
      timeout: 600_000,
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
