import { test, expect } from '../fixtures/login.fixture';
import { loginData } from '../data/loginData';

test('TC_AP_07 - Excess Length Password', async ({ loginPage }) => {
  await loginPage.login(loginData.validUser, `${loginData.validPassword}123123123123123123123123123123`);
  await loginPage.expectInvalidCredentials();
});
