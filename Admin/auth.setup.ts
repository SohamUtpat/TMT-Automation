import { test as setup, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { LoginPage } from './pages/LoginPage';
import { isAuthStateValid } from './utils/authState';

const authFile = path.join(__dirname, '../playwright/.auth/admin.json');

setup('authenticate admin', async ({ page }) => {
  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  if (isAuthStateValid(authFile)) {
    return;
  }

  const login = new LoginPage(page);
  await login.loginAsAdmin();
  await expect(page.locator('#pageTitle')).toBeVisible({ timeout: 60_000 });

  await page.context().storageState({ path: authFile });
});
