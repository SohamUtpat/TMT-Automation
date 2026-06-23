import { test, expect } from '@playwright/test';
import { loginData } from '../data/loginData';

test('TC_AP_11 - Verify Labels', async ({ page }) => {
  await page.goto(loginData.baseUrl);

  await expect(page.getByText('Username *', { exact: true })).toBeVisible();
  await expect(page.getByText('Password *', { exact: true })).toBeVisible();
});
