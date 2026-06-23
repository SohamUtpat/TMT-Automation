import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_03 - Username Case Sensitivity', async ({ page }) => {
  const login = new LoginPage(page);

  await login.navigate();
  await login.login('SOHAM05', loginData.validPassword);
  await login.expectInvalidCredentials();
});
