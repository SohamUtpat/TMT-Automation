import { test as setup, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { LoginPage } from './pages/LoginPage';
import { isAuthStateValid } from './utils/authState';

const authFile = path.join(__dirname, '../playwright/.auth/admin.json');

async function hasActiveDashboardSession(page: import('@playwright/test').Page): Promise<boolean> {
  await page.goto('/dashboard', { waitUntil: 'commit', timeout: 120_000 });

  const onLogin = await page.locator('#username').isVisible().catch(() => false);
  if (onLogin) {
    return false;
  }

  return page.locator('#pageTitle').isVisible().catch(() => false);
}

setup('authenticate admin', async ({ page }) => {
  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  // If the saved auth token is still valid, reuse it.
  // This avoids failing setup when the admin password has been changed by a test.
  if (isAuthStateValid(authFile, 0)) {
    await page.context().storageState({ path: authFile });
    return;
  }

  const login = new LoginPage(page);
  await login.loginAsAdmin();
  await expect(page.locator('#pageTitle')).toBeVisible({ timeout: 60_000 });

  await page.context().storageState({ path: authFile });
});
