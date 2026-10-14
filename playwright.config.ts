import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { loadEnv } from './Admin/config/loadEnv';
import { getBaseUrl } from './Admin/config/appConfig';
import { resolveTarget } from './Admin/config/environments';

loadEnv(__dirname);

const authFile = path.join(__dirname, 'playwright/.auth/admin.json');
const baseURL = getBaseUrl();
const startFrontend = process.env.START_FRONTEND === '1' || process.env.START_FRONTEND === 'true';
const frontendPort = process.env.FRONTEND_PORT;
const frontendDir = process.env.FRONTEND_DIR
  ? path.resolve(__dirname, process.env.FRONTEND_DIR)
  : path.resolve(__dirname, '..', 'gulfnet-tmt-frontend');

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
    baseURL,
    navigationTimeout: 300_000,
    actionTimeout: 30_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  // When START_FRONTEND=1, boot webpack-dev-server (FRONTEND_PORT avoids stale :8000 instances).
  ...(startFrontend && resolveTarget() === 'local'
    ? {
        webServer: {
          command: 'npm run dev',
          cwd: frontendDir,
          url: baseURL,
          env: {
            FRONTEND_PORT: frontendPort ?? '8000',
          },
          reuseExistingServer:
            process.env.REUSE_EXISTING_FRONTEND === '1' && !process.env.CI,
          timeout: 300_000,
        },
      }
    : {}),
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
      // Login API spacing + occasional 429 backoff; keep headroom for cold local UMS.
      timeout: 300_000,
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
