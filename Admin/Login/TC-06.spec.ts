import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_06 - Incorrect Long Password', async ({ page }) => {
  const login = new LoginPage(page);

  await login.navigate();
  await login.login(loginData.validUser, 'VeryLongWrongPassword123456789');
  await login.expectInvalidCredentials();
});
