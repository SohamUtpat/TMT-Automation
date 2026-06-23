import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test('TC_AP_08 - Invalid Username and Password', async ({ page }) => {
  const login = new LoginPage(page);

  await login.navigate();
  await login.login('wronguser', 'wrongpassword');
  await login.expectInvalidCredentials();
});
