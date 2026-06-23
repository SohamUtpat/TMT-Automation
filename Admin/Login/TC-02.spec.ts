import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_02 - Incorrect Username', async ({ page }) => {
  const login = new LoginPage(page);

  await login.navigate();
  await login.login('Soham06', loginData.validPassword);
  await login.expectInvalidCredentials();
});
