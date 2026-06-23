import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_16 - Mobile User Cannot Login', async ({ page }) => {
  const login = new LoginPage(page);

  await login.navigate();
  await login.login(loginData.mobileUser, loginData.mobilePassword);
  await login.expectInvalidCredentials();
});
