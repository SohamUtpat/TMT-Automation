import { test, expect } from '../fixtures/login.fixture';
import { loginData } from '../data/loginData';

test('TC_AP_02 - Incorrect Username', async ({ loginPage }) => {
  await loginPage.login('Soham06', loginData.validPassword);
  await loginPage.expectInvalidCredentials();
});
