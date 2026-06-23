import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_15 - Admin User Login', async ({ page }) => {
  const login = new LoginPage(page);

  await login.navigate();
  await login.login(loginData.validUser, loginData.validPassword);
  await login.expectLoggedIn();
});
