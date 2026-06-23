import { test, expect } from '@playwright/test';
import { loginData } from '../data/loginData';

test('TC_AP_13 - Pointer Cursor', async ({ page }) => {
  await page.goto(loginData.baseUrl);

  const button = page.locator('button.ant-btn-primary');
  await expect(button).toHaveCSS('cursor', 'pointer');
});
