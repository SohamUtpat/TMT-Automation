import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_05 - Invalid Username Not Present', async ({ page }) => {
  const login = new LoginPage(page);

  await login.navigate();
  await login.login(loginData.userNotPresent, loginData.validPassword);
  await login.expectInvalidCredentials();
});
