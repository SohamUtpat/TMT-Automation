import { test, expect } from '../fixtures/login.fixture';
import { loginData } from '../data/loginData';

test('TC_AP_16 - Mobile User Cannot Login', async ({ loginPage }) => {
  await loginPage.login(loginData.mobileUser, loginData.mobilePassword);
  await loginPage.expectInvalidCredentials();
});
