import { test, expect } from '../fixtures/login.fixture';
import { loginData } from '../data/loginData';

test('TC_AP_08 - Invalid Username and Password', async ({ loginPage }) => {
  await loginPage.login(loginData.invalidUser, loginData.invalidPassword);
  await loginPage.expectInvalidCredentials();
});