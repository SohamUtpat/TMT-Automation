import { test, expect } from '@playwright/test';
import { loginData } from '../data/loginData';

test('TC_AP_12 - Password Eye Icon', async ({ page }) => {
  await page.goto(loginData.baseUrl);

  const password = page.locator('#password');
  const eyeIcon = page.locator('.ant-input-suffix, .ant-input-password-icon');

  await password.fill(loginData.validPassword);
  await eyeIcon.first().click();
  await expect(password).toHaveAttribute('type', 'text');
});
