import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_17 - Empty Username Password', async ({ page }) => {
  const login = new LoginPage(page);

  await login.navigate();
  await login.login('', '');

  await expect(page.getByText(loginData.usernameRequiredMessage)).toBeVisible();
  await expect(page.getByText(loginData.passwordRequiredMessage)).toBeVisible();
});
