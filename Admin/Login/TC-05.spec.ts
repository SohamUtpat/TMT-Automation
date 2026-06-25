import { test, expect } from '../fixtures/login.fixture';
import { loginData } from '../data/loginData';

test('TC_AP_05 - Invalid Username Not Present', async ({ loginPage }) => {
  await loginPage.login(loginData.userNotPresent, loginData.validPassword);
  await loginPage.expectInvalidCredentials();
});
