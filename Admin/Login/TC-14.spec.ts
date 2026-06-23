import { test, expect } from '@playwright/test';
import { loginData } from '../data/loginData';

test('TC_AP_14 - Verify Login Screen Components', async ({ page }) => {
  await page.goto(loginData.baseUrl);

  await expect(page.locator('#username')).toBeVisible();
  await expect(page.locator('#password')).toBeVisible();
  await expect(page.locator('button.ant-btn-primary')).toBeVisible();
  await expect(page.getByText('Forgot password?')).toBeVisible();
  await expect(page.getByText('For help document')).toBeVisible();
});
