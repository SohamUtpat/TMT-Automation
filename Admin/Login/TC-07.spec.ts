import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_07 - Excess Length Password', async ({ page }) => {
  const login = new LoginPage(page);

  await login.navigate();
  await login.login(loginData.validUser, `${loginData.validPassword}123123123123123123123123123123`);
  await login.expectInvalidCredentials();
});
