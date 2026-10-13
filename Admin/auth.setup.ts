import { test as setup, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { LoginPage } from './pages/LoginPage';
import { loginData } from './data/loginData';
import { adminPageTitle } from './utils/adminPageTitle';

const authFile = path.join(__dirname, '../playwright/.auth/admin.json');

setup('authenticate admin', async ({ browser }) => {
  // Allow slow bundle.js (~3+ min) plus login + dashboard shell.
  setup.setTimeout(600_000);
  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  // Fresh login on every Playwright run so stale JWTs from prior days are never reused.
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const login = new LoginPage(page);

    try {
      await login.loginAsAdmin();
    } catch (error) {
      const onLogin = await page.locator('#username').isVisible().catch(() => false);
      if (onLogin) {
        throw new Error(
          `authenticate admin failed for "${loginData.validUser}". ` +
            `Verify VALID_USERNAME / VALID_PASSWORD in loginData.ts or env vars. ` +
            `Original error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      throw error;
    }

    await expect(adminPageTitle(page)).toBeVisible({ timeout: 300_000 });
    await context.storageState({ path: authFile });
  } finally {
    await context.close();
  }
});
