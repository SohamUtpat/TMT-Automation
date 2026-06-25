import { test, expect } from '../fixtures/login.fixture';
import { loginData } from '../data/loginData';

test('TC_AP_03 - Username Case Sensitivity', async ({ loginPage }) => {
  await loginPage.login('SOHAM05', loginData.validPassword);
  await loginPage.expectInvalidCredentials();
});
